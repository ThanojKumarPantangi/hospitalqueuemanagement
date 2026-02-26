import Session from "../../models/session.model.js";
import RefreshToken from "../../models/refreshToken.model.js";
import { forceLogoutSession } from "../../sockets/forceLogout.js";

export const revokeAllUserSessions = async (userId) => {
  // find active sessions
  const sessions = await Session.find({
    user: userId,
    isActive: true,
  }).select("_id");

  //  deactivate all sessions
  await Session.updateMany(
    { user: userId, isActive: true },
    { isActive: false }
  );

  //  revoke all refresh tokens
  await RefreshToken.updateMany(
    { user: userId, revoked: false },
    { revoked: true }
  );

  //  socket logout
  sessions.forEach((s) => {
    forceLogoutSession(global.io, s._id.toString());
  });
};