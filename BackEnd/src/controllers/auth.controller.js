import { loginService,signupService,doctorSignupService } from "../services/auth.service.js";
import {verifyRefreshToken} from "../utils/jwt.util.js";
import { rotateRefreshToken } from "../services/tokenRotation.service.js";
import RefreshToken from "../models/refreshToken.model.js";


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { accessToken, refreshToken, user } = await loginService(
      email,
      password,
      req
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ accessToken, role: user.role });
  } catch (err) {
    return res.status(401).json({ message: err.message });
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

export const refreshTokenController = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const tokens = await rotateRefreshToken(token);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    return res.json({ accessToken: tokens.accessToken });
  } catch (error) {
    // 🔥 Refresh token reuse / stolen token detected
    if (error.message === "Refresh token reuse detected") {
      return res.status(401).json({
        message:
          "Security alert: your session may have been compromised. Please login again.",
        code: "REFRESH_TOKEN_REUSE",
      });
    }

    // Session inactive / expired
    if (error.message === "Session expired") {
      return res.status(401).json({
        message: "Session expired. Please login again.",
        code: "SESSION_EXPIRED",
      });
    }

    // Any other refresh failure
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
      const decoded = verifyRefreshToken(incomingToken);

      // revoke refresh token
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
      }

      // deactivate session
      if (decoded?.sessionId) {
        await Session.findByIdAndUpdate(decoded.sessionId, { isActive: false });
      }
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });


    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    // even if token invalid, still clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({ message: "Logged out" });
  }
};