import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util.js";

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

export const verifyMfaService = async (tempToken, code, req) => {

  if (!tempToken || !code) {
    throw new Error("Invalid MFA request");
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.MFA_TEMP_SECRET);
  } catch {
    throw new Error("MFA session expired");
  }

  const deviceId = req.headers["x-device-id"] || null;

  if (
    !decoded?.id ||
    decoded.type !== "MFA_PENDING" ||
    decoded.deviceId !== deviceId
  ) {
    throw new Error("Invalid MFA session");
  }

  const user = await User.findById(decoded.id)
    .select("+mfaSecret +failedMfaAttempts +mfaLockedUntil +mfaTempTokenId");

  if (!user || user.mfaTempTokenId !== decoded.jti) {
    throw new Error("Invalid MFA session");
  }

  if (!user.mfaEnabled || !user.mfaSecret) {
    throw new Error("MFA not fully enabled");
  }

  //  Lock check
  if (user.mfaLockedUntil && user.mfaLockedUntil > new Date()) {
    throw new Error("MFA temporarily locked. Try later.");
  }

  const isValid = speakeasy.totp({
    secret: user.mfaSecret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!isValid) {
    user.failedMfaAttempts = (user.failedMfaAttempts || 0) + 1;

    const attempts = user.failedMfaAttempts;
    const delay = Math.min(1000 * Math.pow(2, attempts - 1), 30000);
    await user.save();

    await new Promise(resolve => setTimeout(resolve, delay));

    if (attempts >= 5) {
      user.mfaLockedUntil = new Date(Date.now() + 10 * 60 * 1000);
      user.failedMfaAttempts = 0;
      await user.save();
      throw new Error("Too many failed attempts. MFA locked for 10 minutes.");
    }

    throw new Error("Invalid MFA code");
  }

  user.failedMfaAttempts = 0;
  user.mfaLockedUntil = undefined;

  user.mfaTempTokenId = undefined;

  await user.save();

  
  await Session.updateMany(
    { user: user._id, isActive: true },
    { isActive: false }
  );

  await RefreshToken.updateMany(
    { user: user._id, revoked: false },
    { revoked: true }
  );

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip;

  const cleanIp = ip?.startsWith("::ffff:")
    ? ip.replace("::ffff:", "")
    : ip;

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