import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No access token" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    /**
     * 🔐 SESSION VALIDATION (NEW)
     */

    if (!decoded?.id || !decoded?.sessionId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    const session = await Session.findById(decoded.sessionId);
    if (!session || !session.isActive) {
      return res.status(401).json({
        message: "Session expired. Please login again.",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Update activity timestamp (non-blocking)
    Session.updateOne(
      { _id: session._id },
      { lastSeenAt: new Date() }
    ).catch(() => {});


    req.user = user;
    req.sessionId = decoded.sessionId;

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;