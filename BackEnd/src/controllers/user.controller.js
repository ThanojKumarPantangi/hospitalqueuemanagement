import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/user.model.js";
import PasswordReset from "../models/passwordReset.model.js";
import { revokeAllUserSessions } from "../services/auth/session.service.js";
import { sendEmail } from "../utils/sendEmail.js";
import { resetPasswordTemplate } from "../emailTemplates/resetPassword.template.js";


const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);
/**
 * Change Password
 * Requires old password
 */
export const changePasswordController = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await user.save();

    // LOGOUT FROM ALL DEVICES
    await revokeAllUserSessions(user._id);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to change password" });
  }
};

/**
 * Change Phone Number
 */
export const changePhoneController = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number required" });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.phone = phone;
    user.isPhoneVerified = false;
    await user.save();

    // LOGOUT FROM ALL DEVICES
    await revokeAllUserSessions(user._id);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({
      message:
        "Phone number updated. Please verify your phone number and login again.",
    });
  } catch {
    res.status(500).json({ message: "Failed to update phone number" });
  }
};


export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    // do not reveal if email exists
    if (!user) {
      return res.json({
        message: "If the email exists, a reset link has been sent.",
      });
    }

    // 1) create raw token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // 2) store hash in DB (never store raw token)
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // optional: revoke old unused reset tokens
    await PasswordReset.updateMany(
      { user: user._id, used: false },
      { used: true }
    );

    await PasswordReset.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    // 3) send reset link (frontend route)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(
      user.email
    )}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your password - Smart Q",
      html: resetPasswordTemplate({
        name: user.name,
        resetUrl,
      }),
    });

    return res.json({
      message: "If the email exists, a reset link has been sent.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to process request" });
  }
};


export const resetPasswordController = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const resetDoc = await PasswordReset.findOne({
      user: user._id,
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetDoc) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // mark token used
    resetDoc.used = true;
    await resetDoc.save();

    // update password
    user.password = await bcrypt.hash(newPassword,BCRYPT_ROUNDS);
    await user.save();

    // revoke all sessions + refresh tokens (best security)
    await revokeAllUserSessions(user._id);

    return res.json({
      message: "Password reset successful. Please login again.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reset password" });
  }
};