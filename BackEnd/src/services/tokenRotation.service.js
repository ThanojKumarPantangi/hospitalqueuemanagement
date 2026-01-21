import { v4 as uuidv4 } from "uuid";
import RefreshToken from "../models/refreshToken.model.js";
import Session from "../models/session.model.js";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.util.js";

export const rotateRefreshToken = async (incomingToken) => {
  const decoded = verifyRefreshToken(incomingToken);

  if (!decoded?.id || !decoded?.jti || !decoded?.sessionId) {
    throw new Error("Invalid refresh token");
  }

  const session = await Session.findById(decoded.sessionId);
  if (!session || !session.isActive) {
    await RefreshToken.updateMany({ user: decoded.id }, { revoked: true });
    throw new Error("Session expired");
  }

  const newJti = uuidv4();

  const stored = await RefreshToken.findOneAndUpdate(
    {
      user: decoded.id,
      session: decoded.sessionId,
      jti: decoded.jti,
      revoked: false,
    },
    {
      revoked: true,
      replacedByJti: newJti,
    },
    { new: true }
  );

  if (!stored) {
    await RefreshToken.updateMany({ user: decoded.id }, { revoked: true });
    throw new Error("Refresh token reuse detected");
  }

  // ✅ DB expiry safety check
  if (stored.expiresAt < new Date()) {
    await RefreshToken.updateMany({ user: decoded.id }, { revoked: true });
    throw new Error("Session expired");
  }

  // ✅ Use session.role (not decoded.role)
  const newAccessPayload = {
    id: decoded.id,
    role: session.role,
    sessionId: decoded.sessionId,
  };

  const newRefreshPayload = {
    id: decoded.id,
    role: session.role,
    sessionId: decoded.sessionId,
    jti: newJti,
  };

  const newAccessToken = generateAccessToken(newAccessPayload);
  const newRefreshToken = generateRefreshToken(newRefreshPayload);

  await RefreshToken.create({
    user: decoded.id,
    session: decoded.sessionId,
    jti: newJti,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};