import Session from "../models/session.model.js";
import { forceLogoutSession } from "../sockets/forceLogout.js";

export const revokeAllUserSessions = async (userId) => {
  // 1️⃣ Find all active sessions
  const sessions = await Session.find({
    user: userId,
    isActive: true,
  }).select("_id");

  // 2️⃣ Mark all as inactive
  await Session.updateMany(
    { user: userId, isActive: true },
    { isActive: false }
  );

  // 3️⃣ Force socket logout
  sessions.forEach((s) => {
    forceLogoutSession(global.io, s._id.toString());
  });
};
