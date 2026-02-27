import RefreshToken from "../../models/refreshToken.model.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwt.util.js";
import { validateSession, revokeAllUserSessions } from "./session.service.js";


export const issueTokens = async (user, session) => {
  const refreshJti = uuidv4();

  const accessPayload = {
    id: user._id,
    role: user.role,
    name: user.name,
    sessionId: session._id,
  };

  const refreshPayload = {
    id: user._id,
    role: user.role,
    sessionId: session._id,
    jti: refreshJti,
  };

  const accessToken = generateAccessToken(accessPayload);
  const refreshToken = generateRefreshToken(refreshPayload);

  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  await RefreshToken.create({
    user: user._id,
    session: session._id,
    jti: refreshJti,
    tokenHash,
    revoked: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
};


export const rotateRefreshToken = async (incomingToken) => {
  const decoded = verifyRefreshToken(incomingToken);

  if (!decoded?.id || !decoded?.jti || !decoded?.sessionId) {
    throw new Error("Invalid refresh token");
  }

  // Let session service validate everything
  const session = await validateSession(decoded.sessionId, decoded.id);

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

  // Token reuse detection
  if (!stored) {
    await revokeAllUserSessions(decoded.id);
    throw new Error("Refresh token reuse detected");
  }

  if (stored.expiresAt < new Date()) {
    await revokeAllUserSessions(decoded.id);
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