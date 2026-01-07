import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { revokeAllUserSessions } from "../services/sessionRevoke.service.js";

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

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // 🔐 LOGOUT FROM ALL DEVICES
    await revokeAllUserSessions(user._id);

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

    // 🔐 LOGOUT FROM ALL DEVICES
    await revokeAllUserSessions(user._id);

    res.json({
      message:
        "Phone number updated. Please verify your phone number and login again.",
    });
  } catch {
    res.status(500).json({ message: "Failed to update phone number" });
  }
};
