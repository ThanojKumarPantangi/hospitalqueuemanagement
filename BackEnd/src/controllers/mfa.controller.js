import { verifyMfaService } from "../services/mfa.service.js";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import User from "../models/user.model.js";
import dotenv from "dotenv";
import { getCookieOptions } from "../utils/cookie.util.js";
dotenv.config({ path: "./src/.env" });
import jwt from "jsonwebtoken";


export const verifyMfaController = async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({
        message: "MFA code and session token required",
      });
    }

    const { accessToken, refreshToken, user } =
      await verifyMfaService(tempToken, code, req);

    res.cookie(
      "accessToken",
      accessToken,
      getCookieOptions(15 * 60 * 1000)
    );

    res.cookie(
      "refreshToken",
      refreshToken,
      getCookieOptions(7 * 24 * 60 * 60 * 1000)
    );

    return res.status(200).json({
      message: "MFA verification successful",
      role: user.role,
      userId: user._id,
    });

  } catch (error) {
    return res.status(401).json({
      message: error.message || "MFA verification failed",
    });
  }
};

export const setupMfaController = async (req, res) => {
  try {
    const { tempToken } = req.body;
    const deviceId = req.headers["x-device-id"] || null;

    if (!tempToken) {
      return res.status(400).json({ message: "Invalid MFA session" });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.MFA_TEMP_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "MFA session expired" });
      }
      return res.status(401).json({ message: "Invalid MFA session" });
    }

    // Validate token structure + device binding
    if (
      !decoded?.id ||
      decoded.type !== "MFA_PENDING" ||
      decoded.deviceId !== deviceId
    ) {
      return res.status(401).json({ message: "Invalid MFA session" });
    }

    const user = await User.findById(decoded.id)
      .select("+mfaTempSecret +mfaTempTokenId +mfaEnabled");

    if (!user || user.mfaTempTokenId !== decoded.jti) {
      return res.status(401).json({ message: "Invalid MFA session" });
    }

    if (user.mfaEnabled) {
      return res.status(400).json({ message: "MFA already enabled" });
    }

    // If setup already started → return existing QR again
    if (user.mfaTempSecret) {
      const otpauthUrl = speakeasy.otpauthURL({
        secret: user.mfaTempSecret,
        label: `SmartQ (${user.email})`,
        issuer: "SmartQ",
        encoding: "base32",
      });

      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

      return res.status(200).json({
        qrCode: qrCodeDataUrl,
        manualCode: user.mfaTempSecret,
      });
    }

    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `SmartQ (${user.email})`,
      issuer: "SmartQ",
      length: 20,
    });

    user.mfaTempSecret = secret.base32;
    await user.save();

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    return res.status(200).json({
      qrCode: qrCodeDataUrl,
      manualCode: secret.base32,
    });

  } catch (err) {
    console.error("MFA Setup Error:", err);
    return res.status(500).json({ message: "Failed to setup MFA" });
  }
};

export const confirmMfaController = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    const deviceId = req.headers["x-device-id"] || null;


    if (!tempToken || !code) {
      return res.status(400).json({ message: "Invalid MFA request" });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.MFA_TEMP_SECRET);
    } catch {
      return res.status(401).json({ message: "MFA session expired" });
    }

    if (
      !decoded?.id ||
      decoded.type !== "MFA_PENDING" ||
      decoded.deviceId !== deviceId
    ) {
      return res.status(401).json({ message: "Invalid MFA session" });
    }

    const user = await User.findById(decoded.id)
      .select("+mfaTempSecret +mfaTempTokenId");

    if (!user || user.mfaTempTokenId !== decoded.jti) {
      return res.status(401).json({ message: "Invalid MFA session" });
    }

    if (!user.mfaTempSecret) {
      return res.status(400).json({ message: "MFA not initialized" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaTempSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid code" });
    }

 
    user.mfaSecret = user.mfaTempSecret;
    user.mfaTempSecret = undefined;
    user.mfaEnabled = true;

    
    user.mfaTempTokenId = undefined;

    await user.save();

    return res.json({ message: "MFA enabled successfully" });

  } catch (err) {
    return res.status(500).json({ message: "Failed to confirm MFA" });
  }
};