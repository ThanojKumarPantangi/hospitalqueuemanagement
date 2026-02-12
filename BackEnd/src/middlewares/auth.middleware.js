import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";

const authMiddleware = async (req, res, next) => {
  try {
    // Read access token from HttpOnly cookie
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ message: "No access token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

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

    Session.updateOne(
      { _id: session._id },
      { lastSeenAt: new Date() }
    ).catch(() => {});

    req.user = user;
    req.sessionId = decoded.sessionId;

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
