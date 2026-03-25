import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import { validateSession } from "../services/auth/session.service.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        message: "Access token missing",
        code: "TOKEN_EXPIRED",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Access token expired",
          code: "TOKEN_EXPIRED",
        });
      }

      return res.status(403).json({
        message: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }

    if (!decoded?.id || !decoded?.sessionId) {
      return res.status(403).json({
        message: "Invalid token payload",
        code: "INVALID_TOKEN",
      });
    }

    const session =await validateSession(decoded.sessionId, decoded.id)

    if (!session || !session.isActive) {
      return res.status(401).json({
        message: "Session expired",
        code: "SESSION_EXPIRED",
      });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Unauthorized",
        code: "USER_INACTIVE",
      });
    }

    if (!session.lastSeenAt || Date.now() - session.lastSeenAt > 5 * 60 * 1000) {
      Session.updateOne(
        { _id: session._id },
        { lastSeenAt: new Date() }
      ).catch(() => {});
    }

    req.user = user;
    req.sessionId = decoded.sessionId;

    next();

  } catch {
    return res.status(500).json({
      message: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
};

export default authMiddleware;