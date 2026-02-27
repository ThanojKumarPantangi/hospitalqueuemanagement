import bcrypt from "bcrypt";
import User from "../../models/user.model.js";
import UserSecurity from "../../models/userSecurity.model.js";
import { handlePasswordFailure, resetFailedAttempts } from "./loginFlow.service.js";
import { evaluateLoginRisk } from "./loginFlow.service.js";
import { handleMfaFlow } from "./mfa.service.js";
import { createSession } from "./session.service.js";
import { issueTokens } from "./token.service.js";
import { createSecurityEvent, sendSecurityEmail } from "./securityAlert.service.js";
import {updateDeviceRecord} from "./deviceSecurity.service.js"
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);

export const loginService = async (email, password, req) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user) throw new Error("Invalid Credentials");

  let security = await UserSecurity.findOne({ user: user._id });
  if (!security) security = await UserSecurity.create({ user: user._id });

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    await handlePasswordFailure(user, security);
  }

  await resetFailedAttempts(security);

  if (!user.isPhoneVerified) throw new Error("Phone number not verified");
  if (user.role === "DOCTOR" && !user.isVerified) {
    throw new Error("Doctor not approved by admin");
  }

  const ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip;

  const cleanIp = ip?.startsWith("::ffff:")
    ? ip.replace("::ffff:", "")
    : ip;

  const deviceId = req.headers["x-device-id"] || null;

  const { riskScore, location, currentCountry, existingDevice } =
  await evaluateLoginRisk({
    user,
    security,
    deviceId,
    cleanIp,
  });

  if (riskScore >= 50) {
    await createSecurityEvent({
      user,
      type: riskScore >= 90 ? "BLOCKED_LOGIN" : "SUSPICIOUS_LOGIN",
      ip: cleanIp,
      country: currentCountry,
      deviceId,
      userAgent: req.headers["user-agent"],
      riskScore,
    });

    await sendSecurityEmail({
      user,
      ip: cleanIp,
      country: currentCountry,
      deviceId,
      riskScore,
    });
  }

  // HIGH RISK → block
  if (riskScore >= 90) {
    throw new Error("Suspicious login attempt detected.");
  }

  const forceMfa = riskScore >= 50;

  const mfaResult = await handleMfaFlow(
    user,
    security,
    deviceId,
    forceMfa
  );

  if (mfaResult) return mfaResult;

  // LOW RISK SUCCESS → update device + account memory
  await updateDeviceRecord(
    user,
    deviceId,
    cleanIp,
    req.headers["user-agent"],
    existingDevice,
    currentCountry
  );

  security.lastLoginIp = cleanIp;
  security.lastLoginCountry = currentCountry || null;
  security.lastLoginAt = new Date();
  await security.save();

  const session = await createSession(user, req, cleanIp);
  const tokens = await issueTokens(user, session);

  return { ...tokens, user };
};


export const signupService = async ({
  name,
  email,
  phone,
  password,
}) => {
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingUser) {
    throw new Error("User already exists with email or phone");
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await User.create({
    name: name.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    phone,
    password: hashedPassword,
    role: "PATIENT",
    isPhoneVerified: false,
    isActive: true,
  });

  //create security state
  await UserSecurity.create({
    user: user._id,
  });

  return user;
};

export const doctorSignupService = async ({
  email,
  doctorRollNo,
  phone,
  password,
}) => {
  const doctor = await User.findOne({
    email,
    doctorRollNo,
    role: "DOCTOR",
  });

  if (!doctor) {
    throw new Error("Doctor not pre-registered");
  }

  if (doctor.password) {
    throw new Error("Doctor already completed signup");
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  doctor.phone = phone;
  doctor.password = hashedPassword;
  doctor.isPhoneVerified = false;
  doctor.isActive = true;

  await doctor.save();

  // ensure security document exists
  const existingSecurity = await UserSecurity.findOne({ user: doctor._id });

  if (!existingSecurity) {
    await UserSecurity.create({ user: doctor._id });
  }

  return doctor;
};