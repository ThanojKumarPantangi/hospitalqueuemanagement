import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import { generateAccessToken,generateRefreshToken } from "../utils/jwt.util.js";

export const loginService = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new Error("Invalid Credentials");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid Credentials");

if (!user.isPhoneVerified) {
  throw new Error("Phone number not verified");
}

if (user.role === "DOCTOR" && !user.isVerified) {
  throw new Error("Doctor not approved by admin");
}

  const payload = {
    id: user._id,
    role: user.role,
    name:user.name,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    user,
  };
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
    name,
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

export const issueTokens = async (user) => {
  const payload = { id: user._id, role: user.role };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const hashedToken = await bcrypt.hash(refreshToken, 10);

  await RefreshToken.create({
    user: user._id,
    token: hashedToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
};