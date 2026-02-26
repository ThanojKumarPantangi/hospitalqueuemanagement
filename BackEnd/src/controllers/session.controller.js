import Session from "../models/session.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import { forceLogoutSession } from "../sockets/forceLogout.js"; 
import userSecurityModel from "../models/userSecurity.model.js";
import SecurityEvent from "../models/securityEvent.model.js";
import mongoose from "mongoose";
/**
 * GET all active sessions for logged-in patient
 */
export const getMyActiveSessions = async (req, res) => {
  try {
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({ message: "Access denied" });
    }

    const [sessions, security] = await Promise.all([
      Session.find({
        user: req.user._id,
        isActive: true,
      })
        .sort({ lastSeenAt: -1 })
        .select("-__v"),

      userSecurityModel.findOne({ user: req.user._id })
        .select("twoStepEnabled")
    ]);

    return res.json({
      currentSessionId: req.sessionId || null,
      twoStepEnabled: security?.twoStepEnabled ?? false,
      sessions,
    });

  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch sessions" });
  }
};

/**
 * Logout a specific session (patient only)
 */
export const logoutSessionById = async (req, res) => {
  try {
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      user: req.user._id,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // 1) deactivate session
    session.isActive = false;
    await session.save();

    // 2) revoke refresh tokens for that session
    await RefreshToken.updateMany(
      { user: req.user._id, session: session._id, revoked: false },
      { revoked: true }
    );

    // 3) force logout on that device (socket)
    forceLogoutSession(global.io, session._id.toString());

    return res.json({ message: "Session logged out successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to logout session" });
  }
};

/**
 * Logout all sessions (patient only)
 */
export const logoutAllMySessions = async (req, res) => {
  try {
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({ message: "Access denied" });
    }

    const sessions = await Session.find({
      user: req.user._id,
      isActive: true,
    }).select("_id");

    // 1) deactivate all sessions
    await Session.updateMany(
      { user: req.user._id, isActive: true },
      { isActive: false }
    );

    // 2) revoke all refresh tokens for this user
    await RefreshToken.updateMany(
      { user: req.user._id, revoked: false },
      { revoked: true }
    );

    // 3) force logout all sessions via socket
    sessions.forEach((s) => {
      forceLogoutSession(global.io, s._id.toString());
    });

    return res.json({ message: "Logged out from all devices successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to logout sessions" });
  }
};

/**
 * security Alerts
 */

export const getSecurityEvents = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // Optional pagination
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50); // max 50
    const skip = (page - 1) * limit;

    const events = await SecurityEvent.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // improves performance

    const total = await SecurityEvent.countDocuments({
      user: userId,
    });

    return res.status(200).json({
      success: true,
      page,
      total,
      totalPages: Math.ceil(total / limit),
      events,
    });

  } catch (error) {
    console.error("getSecurityEvents error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch security events",
    });
  }
};

/**
 * Alerts Mark Read
 */
export const markSecurityEventAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const event = await SecurityEvent.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Security event not found",
      });
    }

    if (!event.isRead) {
      event.isRead = true;
      await event.save();
    }

    return res.status(200).json({
      success: true,
      message: "Security event marked as read",
    });

  } catch (error) {
    console.error("markSecurityEventAsRead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark security event as read",
    });
  }
};

/**
 * Alerts Mark All Read
 */

export const markAllSecurityEventsAsRead = async (req, res) => {
  try {
    const result = await SecurityEvent.updateMany(
      { user: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: "All security events marked as read",
      modifiedCount: result.modifiedCount,
    });

  } catch (error) {
    console.error("markAllSecurityEventsAsRead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark security events as read",
    });
  }
};