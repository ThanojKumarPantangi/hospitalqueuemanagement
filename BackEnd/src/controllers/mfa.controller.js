import { verifyMfaService } from "../services/mfa.service.js";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { generateTokens } from "../utils/jwt.util.js";
import { generateRecoveryCodes } from "../utils/recoveryCode.util.js";
import { getCookieOptions } from "../utils/cookie.util.js";

import dotenv from "dotenv";

dotenv.config({ path: "./src/.env" });

// every Time
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
// First Time
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
      return res.status(400).json({
        message: "Invalid MFA request",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        tempToken,
        process.env.MFA_TEMP_SECRET
      );
    } catch {
      return res.status(401).json({
        message: "MFA session expired",
      });
    }

    if (
      !decoded?.id ||
      decoded.type !== "MFA_PENDING" ||
      decoded.deviceId !== deviceId
    ) {
      return res.status(401).json({
        message: "Invalid MFA session",
      });
    }

    const user = await User.findById(decoded.id)
      .select("+mfaTempSecret +mfaTempTokenId");

    if (!user || user.mfaTempTokenId !== decoded.jti) {
      return res.status(401).json({
        message: "Invalid MFA session",
      });
    }

    if (!user.mfaTempSecret) {
      return res.status(400).json({
        message: "MFA not initialized",
      });
    }

    /* ===============================
       VERIFY OTP
    =============================== */

    const verified = speakeasy.totp.verify({
      secret: user.mfaTempSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({
        message: "Invalid code",
      });
    }

    /* ===============================
       ENABLE MFA
    =============================== */

    user.mfaSecret = user.mfaTempSecret;
    user.mfaTempSecret = undefined;
    user.mfaEnabled = true;
    user.mfaTempTokenId = undefined;

    /* ===============================
       GENERATE RECOVERY CODES
    =============================== */

    const { plainCodes, hashedCodes } =
      await generateRecoveryCodes(5);

    user.mfaRecoveryCodes = hashedCodes;

    await user.save();

    /* ===============================
       CREATE RECOVERY PREVIEW JWT
       (short-lived)
    =============================== */

    const recoveryPreviewToken = jwt.sign(
      {
        id: user._id,
        type: "RECOVERY_PREVIEW",
        recoveryCodes: plainCodes,
      },
      process.env.MFA_TEMP_SECRET,
      {
        expiresIn: "5m", // important
      }
    );

    /* ===============================
       RETURN TOKEN (not raw codes)
    =============================== */

    return res.json({
      message: "MFA enabled successfully",
      recoveryPreviewToken,
    });

  } catch (err) {
    return res.status(500).json({
      message: "Failed to confirm MFA",
    });
  }
};

export const getRecoveryPreviewController = (req, res) => {
  try {
    const { token } = req.body;

    const decoded = jwt.verify(
      token,
      process.env.MFA_TEMP_SECRET
    );

    if (decoded.type !== "RECOVERY_PREVIEW") {
      return res.status(401).json({ message: "Invalid token" });
    }

    return res.json({
      recoveryCodes: decoded.recoveryCodes,
    });

  } catch {
    return res.status(401).json({
      message: "Recovery preview expired",
    });
  }
};

export const recoverMfaController = async (req, res) => {
  try {
    const { email, recoveryCode } = req.body;

    if (!email || !recoveryCode) {
      return res.status(400).json({
        message: "Email and recovery code required",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.mfaEnabled) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    /* ===============================
      CHECK RECOVERY CODE
    =============================== */
    let matchedIndex = -1;

    for (let i = 0; i < user.mfaRecoveryCodes.length; i++) {
      const isMatch = await bcrypt.compare(
        recoveryCode,
        user.mfaRecoveryCodes[i]
      );

      if (isMatch) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex === -1) {
      return res.status(401).json({
        message: "Invalid recovery code",
      });
    }

    /* ===============================
      RESET MFA
    =============================== */
    user.mfaRecoveryCodes = [];
    user.mfaEnabled = false;
    user.mfaSecret = null;

    await user.save();

    /* ===============================
      INVALIDATE OLD SESSIONS
    =============================== */

    // deactivate ALL sessions
    await Session.updateMany(
      { user: user._id, isActive: true },
      { isActive: false }
    );

    // revoke all refresh tokens
    await RefreshToken.updateMany(
      { user: user._id, revoked: false },
      { revoked: true }
    );

    /* ===============================
       ISSUE FRESH TOKENS
    =============================== */

    const tokens = generateTokens({
      id: user._id,
      role: user.role,
    });

    res.cookie(
      "accessToken",
      tokens.accessToken,
      getCookieOptions(15 * 60 * 1000)
    );

    res.cookie(
      "refreshToken",
      tokens.refreshToken,
      getCookieOptions(7 * 24 * 60 * 60 * 1000)
    );

    return res.status(200).json({
      message: "Recovery successful. Please setup MFA again.",
    });

  } catch (error) {
    console.error("MFA Recovery Error:", error);

    return res.status(500).json({
      message: "Recovery failed",
    });
  }
};

export const adminResetMfaController = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    /* ===============================
       RESET MFA
    =============================== */
    user.mfaEnabled = false;
    user.mfaSecret = null;
    user.mfaRecoveryCodes = [];

    await user.save();

    /* ===============================
        FORCE LOGOUT (SESSION KILL)
       invalidate ALL sessions
    =============================== */

    // deactivate all sessions
    await Session.updateMany(
      { user: user._id, isActive: true },
      { isActive: false }
    );

    // revoke all refresh tokens
    await RefreshToken.updateMany(
      { user: user._id, revoked: false },
      { revoked: true }
    );

    /* ===============================
       OPTIONAL: Audit Log here
    =============================== */

    return res.status(200).json({
      message: "MFA reset and all sessions invalidated",
    });

  } catch (error) {
    console.error("Admin MFA Reset Error:", error);

    return res.status(500).json({
      message: "Failed to reset MFA",
    });
  }
};
