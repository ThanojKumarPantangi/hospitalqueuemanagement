import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import { generateAccessToken,generateRefreshToken } from "../utils/jwt.util.js";
import Session from "../models/session.model.js";
import Device from "../models/device.model.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);

const getLocationFromIp = async (ip) => {
  try {
    if (!ip) return null;
    if (ip === "::1" || ip === "127.0.0.1") return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const res = await fetch(`https://ipwho.is/${ip}`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.success) return null;

    return {
      city: data.city || null,
      region: data.region || null,
      country: data.country || null,
      timezone: data.timezone?.id || null,
    };
  } catch {
    return null;
  }
};

export const loginService = async (email, password, req) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user) throw new Error("Invalid Credentials");

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    await user.save();

    const attempts = user.failedLoginAttempts;

    let delay;
    if (user.role === "ADMIN") {
      delay = Math.min(2000 * Math.pow(2, attempts - 1), 120000);
    } else if (user.role === "DOCTOR") {
      delay = Math.min(1500 * Math.pow(2, attempts - 1), 90000);
    } else {
      delay = Math.min(1000 * Math.pow(2, attempts - 1), 60000);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    throw new Error("Invalid Credentials");
  }

  if (user.failedLoginAttempts > 0) {
    user.failedLoginAttempts = 0;
    await user.save();
  }

  if (!user.isPhoneVerified) throw new Error("Phone number not verified");
  if (user.role === "DOCTOR" && !user.isVerified) {
    throw new Error("Doctor not approved by admin");
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip;

  const cleanIp = ip?.startsWith("::ffff:")
    ? ip.replace("::ffff:", "")
    : ip;

  const deviceId = req.headers["x-device-id"];
  let riskScore = 0;
  let existingDevice = null;

  if (deviceId) {
    existingDevice = await Device.findOne({
      user: user._id,
      deviceId,
    });

    if (!existingDevice) {
      riskScore += 40;
    } else {
      if (existingDevice.lastIp !== cleanIp) {
        riskScore += 20;
      }
    }
  }

  if (riskScore >= 70 && user.role === "ADMIN") {
    throw new Error("Suspicious login detected. Access denied.");
  }

  if (deviceId) {
    if (existingDevice) {
      existingDevice.lastIp = cleanIp;
      existingDevice.lastUsedAt = new Date();
      await existingDevice.save();
    } else {
      await Device.create({
        user: user._id,
        deviceId,
        userAgent: req.headers["user-agent"],
        lastIp: cleanIp,
        lastUsedAt: new Date(),
      });
    }
  }

  if (user.role === "ADMIN" || user.role === "DOCTOR") {

    const deviceId = req.headers["x-device-id"] || null;
    const tempJti = uuidv4();

    const tempToken = jwt.sign(
      {
        id: user._id,
        type: "MFA_PENDING",
        deviceId,
        jti: tempJti,
      },
      process.env.MFA_TEMP_SECRET,
      { expiresIn: "5m" }
    );

    user.mfaTempTokenId = tempJti;
    await user.save();

    if (!user.mfaEnabled) {
      return {
        mfaSetupRequired: true,
        tempToken,
      };
    }

    return {
      mfaRequired: true,
      tempToken,
    };
  }

  let absoluteExpiry;
  if (user.role === "DOCTOR") {
    absoluteExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  } else if (user.role === "ADMIN") {
    absoluteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else {
    absoluteExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const session = await Session.create({
    user: user._id,
    role: user.role,
    device: req.headers["user-agent"]?.substring(0, 120),
    ipAddress: cleanIp,
    location: null,
    isActive: true,
    absoluteExpiresAt: absoluteExpiry,
  });

  getLocationFromIp(cleanIp)
    .then((location) => {
      if (location) {
        Session.findByIdAndUpdate(session._id, { location }).catch(() => {});
      }
    })
    .catch(() => {});

  const accessPayload = {
    id: user._id,
    role: user.role,
    name: user.name,
    sessionId: session._id,
  };

  const refreshJti = uuidv4();

  const refreshPayload = {
    id: user._id,
    role: user.role,
    sessionId: session._id,
    jti: refreshJti,
  };

  const accessToken = generateAccessToken(accessPayload);
  const refreshToken = generateRefreshToken(refreshPayload);

  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await RefreshToken.create({
    user: user._id,
    session: session._id,
    jti: refreshJti,
    tokenHash,
    revoked: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken, user };
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
    name:name.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    phone,
    password: hashedPassword,
    role: "PATIENT",
    isPhoneVerified: false,
    isActive: true,
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

  return doctor;
};