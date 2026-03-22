import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import { v4 as uuidv4 } from "uuid";
import User from "../../models/user.model.js";
import UserSecurity from "../../models/userSecurity.model.js";
import Device from "../../models/device.model.js";
import { getLocationFromIp } from "../../utils/geo.util.js";
import { createSession } from "./session.service.js";
import { issueTokens } from "./token.service.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

export const verifyMfaService = async (tempToken, code, req,res) => {
  if (!tempToken || !code) {
    throw new Error("Invalid MFA request");
  }

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.MFA_TEMP_SECRET);
  } catch {
    throw new Error("MFA session expired");
  }

  if (
    !decoded?.id ||
    decoded.type !== "MFA_PENDING" 
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

  const deviceId = decoded.deviceId; 

  const userAgent = req.headers["user-agent"];

  const device = await Device.findOne({
    user: user._id,
    deviceId,
  });

  let similarDevice = null;
  
  if(!device){
     similarDevice = await Device.findOne({
      user: user._id,
      userAgent,
      lastCountry: currentCountry || undefined,
    });
  }
  
  const newSecret = crypto.randomBytes(32).toString("hex");
  const newHash = await bcrypt.hash(newSecret, 12);

  if (device) {
    device.deviceSecretHash = newHash;
    device.lastUsedAt = new Date();
    device.lastIp = cleanIp;
    device.lastCountry = currentCountry;

    await device.save();

    res.cookie("deviceSecret", newSecret, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    res.cookie("deviceId", device.deviceId, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
  }
  else if (similarDevice) {

    similarDevice.deviceSecretHash = newHash;
    similarDevice.lastUsedAt = new Date();
    similarDevice.lastIp = cleanIp;
    similarDevice.lastCountry = currentCountry;
    similarDevice.deviceId = deviceId;

    await similarDevice.save();

    res.cookie("deviceSecret", newSecret, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    res.cookie("deviceId", device.deviceId, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

  }
  else {
    await Device.create({
      user: user._id,
      deviceId,
      userAgent: req.headers["user-agent"],
      lastIp: cleanIp,
      lastCountry: currentCountry,
      lastUsedAt: new Date(),
      deviceSecretHash: newHash,
      isTrusted: false,
      trustExpiresAt: null,
    });

    // set cookies
    res.cookie("deviceId", deviceId, 
      { 
        httpOnly: true, 
        secure: true, 
        sameSite: "Strict" 
      });

    res.cookie("deviceSecret", newSecret, 
      { 
        httpOnly: true, 
        secure: true, 
        sameSite: "Strict" 
      });
  }

  // Update account login memory
  security.lastLoginIp = cleanIp;
  security.lastLoginCountry = currentCountry;
  security.lastLoginAt = new Date();
  await security.save();

  // CREATE SESSION via centralized service
  const session = await createSession(user, req, cleanIp,location, deviceId);

  // ISSUE TOKENS via token service
  const tokens = await issueTokens(user, session);

  const shouldAskTrustDevice = !device.isTrusted || !similarDevice.isTrusted || false;

  return { ...tokens, user, shouldAskTrustDevice};
};

// MFA Login Flow
export const handleMfaFlow = async (
  user,
  security,
  deviceId,
  existingDevice,
  riskScore,
) => {

  const isTrustedDevice =
    existingDevice &&
    existingDevice.isTrusted &&
    existingDevice.trustExpiresAt > new Date();

  const isHighRisk = riskScore >= 50;

  let forceMfa = true;

  if (user.role === "DOCTOR" || user.role === "ADMIN") {
    forceMfa = !isTrustedDevice || isHighRisk;
  } else if (user.role === "PATIENT") {
    if (security.twoStepEnabled) {
      forceMfa = !isTrustedDevice || isHighRisk;
    } else {
      forceMfa = isHighRisk;
    }
  }


  if (!forceMfa) return null;

  const tempJti = uuidv4();
  if(!deviceId) deviceId = crypto.randomUUID();

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