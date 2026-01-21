import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import { generateAccessToken,generateRefreshToken } from "../utils/jwt.util.js";
import Session from "../models/session.model.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const getLocationFromIp = async (ip) => {
  try {
    if (!ip) return null;
    if (ip === "::1" || ip === "127.0.0.1") return null;

    const { data } = await axios.get(`https://ipwho.is/${ip}`);
    if (!data?.success) return null;

    return {
      city: data.city || null,
      region: data.region || null,
      country: data.country || null,
      timezone: data.timezone?.id || null,
    };
  } catch (err) {
    return null;
  }
};

export const loginService = async (email, password, req) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new Error("Invalid Credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid Credentials");

  if (!user.isPhoneVerified) throw new Error("Phone number not verified");

  if (user.role === "DOCTOR" && !user.isVerified) {
    throw new Error("Doctor not approved by admin");
  }

  // 🔐 Single session for DOCTOR / ADMIN
  if (user.role === "DOCTOR" || user.role === "ADMIN") {
    await Session.updateMany(
      { user: user._id, isActive: true },
      { isActive: false }
    );
    await RefreshToken.updateMany(
      { user: user._id, revoked: false },
      { revoked: true }
    );
  }

  const ip =
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req.socket?.remoteAddress ||
  req.ip;

  const cleanIp = ip?.startsWith("::ffff:") ? ip.replace("::ffff:", "") : ip;

  const location = await getLocationFromIp(cleanIp);


  // ✅ Create session
  const session = await Session.create({
    user: user._id,
    role: user.role,
    device: req.headers["user-agent"]?.substring(0, 120),
    ipAddress: cleanIp,
    location,
    isActive: true,
  });


  // ✅ Access token payload
  const accessPayload = {
    id: user._id,
    role: user.role,
    name: user.name,
    sessionId: session._id,
  };

  // ✅ Refresh token payload (with jti)
  const refreshJti = uuidv4();

  const refreshPayload = {
    id: user._id,
    role: user.role,
    sessionId: session._id,
    jti: refreshJti,
  };

  const accessToken = generateAccessToken(accessPayload);
  const refreshToken = generateRefreshToken(refreshPayload);

  // ✅ Store refresh token identity in DB
  await RefreshToken.create({
    user: user._id,
    session: session._id,
    jti: refreshJti,
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

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name:name.trim().toLowerCase(),
    email,
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

  const hashedPassword = await bcrypt.hash(password, 10);

  doctor.phone = phone;
  doctor.password = hashedPassword;
  doctor.isPhoneVerified = false; 
  doctor.isActive = true;

  await doctor.save();

  return doctor;
};