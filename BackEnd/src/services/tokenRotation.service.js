import { v4 as uuidv4 } from "uuid";
import RefreshToken from "../models/refreshToken.model.js";
import Session from "../models/session.model.js";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.util.js";

import crypto from "crypto";

export const rotateRefreshToken = async (incomingToken) => {
  const decoded = verifyRefreshToken(incomingToken);

  if (!decoded?.id || !decoded?.jti || !decoded?.sessionId) {
    throw new Error("Invalid refresh token");
  }

  const session = await Session.findById(decoded.sessionId);

  if (!session || session.user.toString() !== decoded.id) {
    throw new Error("Session expired");
  }

  // Absolute lifetime enforcement
  if (session.absoluteExpiresAt && session.absoluteExpiresAt < new Date()) {
    await RefreshToken.updateMany(
      { session: session._id, revoked: false },
      { revoked: true }
    );

    await Session.findByIdAndUpdate(session._id, { isActive: false });

    throw new Error("Session expired");
  }

  if (!session.isActive) {
    throw new Error("Session expired");
  }

  const incomingHash = crypto
    .createHash("sha256")
    .update(incomingToken)
    .digest("hex");

  const newJti = uuidv4();

  const stored = await RefreshToken.findOneAndUpdate(
    {
      user: decoded.id,
      session: decoded.sessionId,
      jti: decoded.jti,
      revoked: false,
      tokenHash: incomingHash,
    },
    {
      revoked: true,
      replacedByJti: newJti,
    },
    { new: true }
  );

  //  If not found → token reuse or theft
  if (!stored) {
    await RefreshToken.updateMany({ user: decoded.id }, { revoked: true });
    await Session.updateMany({ user: decoded.id }, { isActive: false });
    throw new Error("Refresh token reuse detected");
  }

  // Expiry safety check
  if (stored.expiresAt < new Date()) {
    await RefreshToken.updateMany({ user: decoded.id }, { revoked: true });
    await Session.updateMany({ user: decoded.id }, { isActive: false });
    throw new Error("Session expired");
  }
  
  const newAccessPayload = {
    id: decoded.id,
    role: session.role,
    sessionId: session._id,
  };

  const newRefreshPayload = {
    id: decoded.id,
    role: session.role,
    sessionId: session._id,
    jti: newJti,
  };

  const newAccessToken = generateAccessToken(newAccessPayload);
  const newRefreshToken = generateRefreshToken(newRefreshPayload);

  const newHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");

  await RefreshToken.create({
    user: decoded.id,
    session: session._id,
    jti: newJti,
    tokenHash: newHash,
    revoked: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};