import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import { v4 as uuidv4 } from "uuid";
import User from "../../models/user.model.js";
import UserSecurity from "../../models/userSecurity.model.js";
import Device from "../../models/device.model.js";
import { getLocationFromIp } from "../../utils/geo.util.js";
import { updateDeviceRecord } from "./deviceSecurity.service.js";
import { createSession } from "./session.service.js";
import { issueTokens } from "./token.service.js";


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

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new Error("Invalid MFA session");
  }

  const security = await UserSecurity.findOne({ user: user._id });
  if (!security || security.mfaTempTokenId !== decoded.jti) {
    throw new Error("Invalid MFA session");
  }

  if (!security.mfaEnabled || !security.mfaSecret) {
    throw new Error("MFA not fully enabled");
  }

  // LOCK CHECK
  if (security.mfaLockedUntil && security.mfaLockedUntil > new Date()) {
    throw new Error("MFA temporarily locked. Try later.");
  }

  const isValid = speakeasy.totp.verify({
    secret: security.mfaSecret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  // INVALID CODE HANDLING
  if (!isValid) {
    security.failedMfaAttempts = (security.failedMfaAttempts || 0) + 1;
    const attempts = security.failedMfaAttempts;

    const delay = Math.min(1000 * Math.pow(2, attempts - 1), 30000);
    await security.save();
    await new Promise((resolve) => setTimeout(resolve, delay));

    if (attempts >= 5) {
      security.mfaLockedUntil = new Date(Date.now() + 10 * 60 * 1000);
      security.failedMfaAttempts = 0;
      await security.save();
      throw new Error(
        "Too many failed attempts. MFA locked for 10 minutes."
      );
    }

    throw new Error("Invalid MFA code");
  }

  // SUCCESS → RESET MFA SECURITY STATE
  security.failedMfaAttempts = 0;
  security.mfaLockedUntil = undefined;
  security.mfaTempTokenId = undefined;
  await security.save();

  // Extract IP (Cloudflare priority)
  const ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip;

  const cleanIp = ip?.startsWith("::ffff:")
    ? ip.replace("::ffff:", "")
    : ip;

  // Get location
  const location = await getLocationFromIp(cleanIp);
  const currentCountry = location?.country || null;

  // Fetch existing device
  let existingDevice = null;
  if (deviceId) {
    existingDevice = await Device.findOne({
      user: user._id,
      deviceId,
    });
  }

  // Trust device after MFA success
  await updateDeviceRecord(
    user,
    deviceId,
    cleanIp,
    req.headers["user-agent"],
    existingDevice,
    currentCountry
  );

  // Update account login memory
  security.lastLoginIp = cleanIp;
  security.lastLoginCountry = currentCountry;
  security.lastLoginAt = new Date();
  await security.save();

  // CREATE SESSION via centralized service
  const session = await createSession(user, req, cleanIp);

  // ISSUE TOKENS via token service
  const tokens = await issueTokens(user, session);

  return { ...tokens, user };
};

// MFA Login Flow
export const handleMfaFlow = async (
  user,
  security,
  deviceId,
  forceMfa = false
) => {
  const requiresMfa =
    forceMfa ||
    user.role === "ADMIN" ||
    user.role === "DOCTOR" ||
    (user.role === "PATIENT" && security.twoStepEnabled);

  if (!requiresMfa) return null;

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

  security.mfaTempTokenId = tempJti;
  await security.save();

  if (!security.mfaEnabled) {
    return { mfaSetupRequired: true, tempToken };
  }

  return { mfaRequired: true, tempToken };
};