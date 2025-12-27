import { loginService,signupService,doctorSignupService } from "../services/auth.service.js";

import { rotateRefreshToken } from "../services/tokenRotation.service.js";
import RefreshToken from "../models/refreshToken.model.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } =
      await loginService(email, password);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken, role: user.role });
  } catch (err) {
    res.status(401).json({ message: err.message });
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
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: tokens.accessToken });
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};

export const logoutController = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token provided" });
    }

    await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { revoked: true }
    );

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Logout failed",
    });
  }
};
