import { loginService,
  signupService,
  doctorSignupService,
  trustDeviceService,
  removeTrustService,
} from "../services/auth/auth.service.js";
import {verifyRefreshToken} from "../utils/jwt.util.js";
import { rotateRefreshToken } from "../services/auth/token.service.js";
import RefreshToken from "../models/refreshToken.model.js";
import Session from "../models/session.model.js";
import { getCookieOptions } from "../utils/cookie.util.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await loginService(email, password, req);

    if (result.mfaSetupRequired) {
      return res.json({
        mfaSetupRequired: true,
        tempToken: result.tempToken,
      });
    }

    // If MFA required → do NOT create session yet
    if (result.mfaRequired) {
      return res.status(200).json({
        mfaRequired: true,
        tempToken: result.tempToken,
      });
    }

    // Normal login (PATIENT)
    const { accessToken, refreshToken, user } = result;

    res.cookie(
      "accessToken",
      accessToken,
      getCookieOptions(24 * 60 * 60 * 1000)
    );

    res.cookie(
      "refreshToken",
      refreshToken,
      getCookieOptions(8 * 24 * 60 * 60 * 1000)
    );


    return res.json({
      message: "Login successful",
      role: user.role,
      userId: user._id,
    });

  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    // authMiddleware already validated session + user
    const user = req.user;

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch user",
    });
  }
};

export const signupController = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const user = await signupService({
      name,
      email,
      phone,
      password,
    });

    res.status(201).json({
      message: "Signup successful. Please verify your phone number.",
      userId: user._id,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const doctorSignupController = async (req, res) => {
  try {
    const { email, doctorRollNo, phone, password } = req.body;

    await doctorSignupService({
      email,
      doctorRollNo,
      phone,
      password,
    });

    res.status(201).json({
      message:
        "Doctor signup completed. Please verify phone and wait for admin approval.",
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const trustDeviceController = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const { deviceId } = req.cookies;

    if (!deviceId) {
      return res.status(400).json({
        message: "Device not identified",
      });
    }

    await trustDeviceService(userId,deviceId,role);

    return res.status(200).json({
      message: "Device trusted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to trust device",
    });
  }
};

export const removeTrustController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: "Device ID required" });
    }

    await removeTrustService(userId, deviceId);

    return res.json({ message: "Device trust removed" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const refreshTokenController = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        message: "Refresh token missing",
        code: "NO_REFRESH_TOKEN",
      });
    }

    const tokens = await rotateRefreshToken(token);

    res.cookie(
      "accessToken",
      tokens.accessToken,
      getCookieOptions(24 * 60 * 60 * 1000)
    );

    res.cookie(
      "refreshToken",
      tokens.refreshToken,
      getCookieOptions(8 * 24 * 60 * 60 * 1000)
    );

    return res.json({ success: true });

  } catch (error) {

    if (error.message === "REFRESH_TOKEN_REUSE_DETECTED") {
      return res.status(401).json({
        message:
          "Security alert: your session may have been compromised. Please login again.",
        code: "REFRESH_TOKEN_REUSE",
      });
    }

    if (
      error.message === "SESSION_EXPIRED" ||
      error.message === "REFRESH_TOKEN_EXPIRED"
    ) {
      return res.status(401).json({
        message: "Session expired. Please login again.",
        code: "SESSION_EXPIRED",
      });
    }

    if (error.message === "INVALID_REFRESH_TOKEN") {
      return res.status(403).json({
        message: "Invalid refresh token",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    return res.status(401).json({
      message: "Unauthorized. Please login again.",
      code: "UNAUTHORIZED",
    });
  }
};

export const logoutController = async (req, res) => {
  try {
    const incomingToken = req.cookies.refreshToken;

    if (incomingToken) {
      try {
        const decoded = verifyRefreshToken(incomingToken);

        if (decoded?.id && decoded?.jti && decoded?.sessionId) {
          await RefreshToken.findOneAndUpdate(
            {
              user: decoded.id,
              session: decoded.sessionId,
              jti: decoded.jti,
              revoked: false,
            },
            { revoked: true }
          );

          await Session.findByIdAndUpdate(decoded.sessionId, {
            isActive: false,
          });
        }
      } catch {
        // ignore invalid token, continue clearing cookies
      }
    }

    res.clearCookie("accessToken", getCookieOptions());
    res.clearCookie("refreshToken", getCookieOptions());

    return res.status(200).json({ message: "Logged out successfully" });
  } catch {
    
    res.clearCookie("accessToken", getCookieOptions());
    res.clearCookie("refreshToken", getCookieOptions());

    return res.status(200).json({ message: "Logged out" });
  }
};