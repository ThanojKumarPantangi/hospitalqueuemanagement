import { verifyMfaService } from "../services/auth/mfa.service.js";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import User from "../models/user.model.js";
import UserSecurity from "../models/userSecurity.model.js";
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
      return res.status(400).json({ message: "Invalid MFA session 1" });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.MFA_TEMP_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "MFA session expired" });
      }
      return res.status(401).json({ message: "Invalid MFA session 2" });
    }

    if (
      !decoded?.id ||
      decoded.type !== "MFA_PENDING" ||
      decoded.deviceId !== deviceId
    ) {
      return res.status(401).json({ message: "Invalid MFA session 3" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Invalid MFA session 4" });
    }

    let security = await UserSecurity.findOne({ user: user._id });

    if (!security) {
      security = await UserSecurity.create({ user: user._id });
    }
    
    if (security.mfaTempTokenId !== decoded.jti) {
      return res.status(401).json({ message: "Invalid MFA session 5" });
    }

    if (security.mfaEnabled) {
      return res.status(400).json({ message: "MFA already enabled" });
    }

    // If setup already started → return same QR
    if (security.mfaTempSecret) {
      const otpauthUrl = speakeasy.otpauthURL({
        secret: security.mfaTempSecret,
        label: `SmartQ (${user.email})`,
        issuer: "SmartQ",
        encoding: "base32",
      });

      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

      return res.json({
        qrCode: qrCodeDataUrl,
        manualCode: security.mfaTempSecret,
      });
    }

    // generate new secret
    const secret = speakeasy.generateSecret({
      name: `SmartQ (${user.email})`,
      issuer: "SmartQ",
      length: 20,
    });

    security.mfaTempSecret = secret.base32;
    await security.save();

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    return res.json({
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
      decoded = jwt.verify(tempToken, process.env.MFA_TEMP_SECRET);
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

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Invalid MFA session" });
    }

    const security = await UserSecurity.findOne({ user: user._id });

    if (!security || security.mfaTempTokenId !== decoded.jti) {
      return res.status(401).json({
        message: "Invalid MFA session",
      });
    }

    if (!security.mfaTempSecret) {
      return res.status(400).json({
        message: "MFA not initialized",
      });
    }

    /* ===============================
       VERIFY OTP
    =============================== */

    const verified = speakeasy.totp.verify({
      secret: security.mfaTempSecret,
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

    security.mfaSecret = security.mfaTempSecret;
    security.mfaTempSecret = undefined;
    security.mfaEnabled = true;
    security.mfaTempTokenId = undefined;

    /* ===============================
       GENERATE RECOVERY CODES
    =============================== */

    const { plainCodes, hashedCodes } =
      await generateRecoveryCodes(5);

    security.mfaRecoveryCodes = hashedCodes;

    await security.save();

    /* ===============================
       CREATE RECOVERY PREVIEW TOKEN
    =============================== */

    const recoveryPreviewToken = jwt.sign(
      {
        id: user._id,
        type: "RECOVERY_PREVIEW",
        recoveryCodes: plainCodes,
      },
      process.env.MFA_TEMP_SECRET,
      { expiresIn: "5m" }
    );

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
    if (!user) return res.status(400).json({ message: "Invalid request" });

    const security = await UserSecurity.findOne({ user: user._id });

    if (!security || !security.mfaEnabled) {
      return res.status(400).json({ message: "Invalid request" });
    }

    /* ===============================
      CHECK RECOVERY CODE
    =============================== */
    let matchedIndex = -1;

    for (let i = 0; i < security.mfaRecoveryCodes.length; i++) {
      const isMatch = await bcrypt.compare(
        recoveryCode,
        security.mfaRecoveryCodes[i]
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
    security.mfaRecoveryCodes = [];
    security.mfaEnabled = false;
    security.mfaSecret = null;

    await security.save();

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
    const security = await UserSecurity.findOne({ user: user._id });

    if (security) {
      security.mfaEnabled = false;
      security.mfaSecret = null;
      security.mfaRecoveryCodes = [];
      await security.save();
    }

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

export const toggleTwoStepController = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("+password");
    if (!user || user.role !== "PATIENT") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const security = await UserSecurity.findOne({ user: userId });
    if (!security) {
      return res.status(404).json({ message: "Security record missing" });
    }

    const { password } = req.body || {};

    // ================= DISABLE =================
    if (security.twoStepEnabled) {
      if (!password) {
        return res.status(400).json({
          message: "Password required",
          enabled: true,
        });
      }

      if (!user.password) {
        return res.status(500).json({
          message: "User password missing",
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({
          message: "Incorrect password",
          enabled: true,
        });
      }

      security.twoStepEnabled = false;
      security.mfaEnabled = false;
      security.mfaSecret = null;
      security.mfaRecoveryCodes = [];

      await security.save();

      return res.json({
        message: "Two-step verification disabled",
        enabled: false,
      });
    }

    // ================= ENABLE =================
    security.twoStepEnabled = true;
    await security.save();

    return res.json({
      message: "Complete setup to enable two-step verification",
      enabled: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update two-step verification" });
  }
};