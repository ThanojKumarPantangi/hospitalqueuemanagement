import Session from "../models/session.model.js";

/**
 * GET all active sessions for logged-in patient
 */
export const getMyActiveSessions = async (req, res) => {
  try {
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({ message: "Access denied" });
    }

    const sessions = await Session.find({
      user: req.user._id,
      isActive: true,
    })
      .sort({ lastSeenAt: -1 })
      .select("-__v");

    res.json({
      currentSessionId: req.sessionId,
      sessions,
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch sessions" });
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

    session.isActive = false;
    await session.save();

    res.json({ message: "Session logged out successfully" });
  } catch {
    res.status(500).json({ message: "Failed to logout session" });
  }
};

/**
 * Logout all the session (patient only)
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

    await Session.updateMany(
      { user: req.user._id, isActive: true },
      { isActive: false }
    );

    sessions.forEach((s) => {
      forceLogoutSession(global.io, s._id.toString());
    });

    res.json({
      message: "Logged out from all devices successfully",
    });
  } catch {
    res.status(500).json({ message: "Failed to logout sessions" });
  }
};
