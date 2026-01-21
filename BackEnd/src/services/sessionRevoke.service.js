import Session from "../models/session.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import { forceLogoutSession } from "../sockets/forceLogout.js";

export const revokeAllUserSessions = async (userId) => {
  // 1) find active sessions
  const sessions = await Session.find({
    user: userId,
    isActive: true,
  }).select("_id");

  // 2) deactivate all sessions
  await Session.updateMany(
    { user: userId, isActive: true },
    { isActive: false }
  );

  // 3) revoke all refresh tokens
  await RefreshToken.updateMany(
    { user: userId, revoked: false },
    { revoked: true }
  );

  // 4) socket logout
  sessions.forEach((s) => {
    forceLogoutSession(global.io, s._id.toString());
  });
};