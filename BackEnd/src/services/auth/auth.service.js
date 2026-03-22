import bcrypt from "bcrypt";
import User from "../../models/user.model.js";
import UserSecurity from "../../models/userSecurity.model.js";
import Device from "../../models/device.model.js";
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

  const { deviceId, deviceSecret } = req.cookies;

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

  const userAgent = req.headers["user-agent"];

  const {
    riskScore,
    location,
    currentCountry,
    existingDevice,
    similarDevice,
  } = await evaluateLoginRisk({
    user,
    security,
    deviceId,
    cleanIp,
    userAgent,
    deviceSecret,
  });

  if (riskScore >= 50) {
    await createSecurityEvent({
      user,
      type: riskScore >= 90 ? "BLOCKED_LOGIN" : "SUSPICIOUS_LOGIN",
      ip: cleanIp,
      country: currentCountry,
      deviceId,
      userAgent,
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

  if (riskScore >= 90) {
    throw new Error("Suspicious login attempt detected.");
  }

  const mfaResult = await handleMfaFlow(
    user,
    security,
    deviceId,
    existingDevice,
    riskScore,
  );

  if (mfaResult) return mfaResult;

  // Update / create device record
  await updateDeviceRecord(
    user,
    deviceId,
    cleanIp,
    userAgent,
    existingDevice,
    similarDevice,
    currentCountry,
    deviceSecret
  );

  // Update security metadata
  security.lastLoginIp = cleanIp;
  security.lastLoginCountry = currentCountry || null;
  security.lastLoginAt = new Date();
  await security.save();

  // Session + tokens
  const session = await createSession(user, req, cleanIp, location,deviceId);
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

export const trustDeviceService = async (userId, deviceId,role) => {
  const device = await Device.findOne({
    user: userId,
    deviceId,
  });

  if (!device) {
    throw new Error("Device not found");
  }

  let duration;

  if (role === "PATIENT") {
    duration = 30 * 24 * 60 * 60 * 1000; 
  } else if (role === "DOCTOR") {
    duration = 24 * 60 * 60 * 1000; 
  } else if (role === "ADMIN") {
    duration = 12 * 60 * 60 * 1000;
  }

  device.isTrusted = true;
  device.trustExpiresAt = new Date(Date.now() + duration);

  await device.save();
};

export const removeTrustService = async (userId, deviceId) => {
  const device = await Device.findOne({
    user: userId,
    deviceId,
  });

  if (!device) {
    throw new Error("Device not found");
  }

  device.isTrusted = false;
  device.trustExpiresAt = null;

  await device.save();
};