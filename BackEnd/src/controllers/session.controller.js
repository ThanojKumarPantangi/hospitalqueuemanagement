import Session from "../models/session.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import { forceLogoutSession } from "../sockets/forceLogout.js"; // adjust path if needed
import userSecurityModel from "../models/userSecurity.model.js";
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