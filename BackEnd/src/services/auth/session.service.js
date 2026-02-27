import Session from "../../models/session.model.js";
import RefreshToken from "../../models/refreshToken.model.js";
import { getLocationFromIp } from "../../utils/geo.util.js";
import { forceLogoutSession } from "../../sockets/forceLogout.js";

/* =========================================================
   SESSION POLICY (Single Source of Truth)
========================================================= */

const SESSION_LIFETIME = {
  DOCTOR: 14,
  ADMIN: 7,
  PATIENT: 30,
};

const SINGLE_SESSION_ROLES = ["DOCTOR", "ADMIN"];

const shouldEnforceSingleSession = (role) => {
  return SINGLE_SESSION_ROLES.includes(role);
};

const calculateAbsoluteExpiry = (role) => {
  const days = SESSION_LIFETIME[role] || 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

/* =========================================================
   CREATE SESSION
   (Same behavior as your old createSession)
========================================================= */

export const createSession = async (user, req, cleanIp) => {
  // Enforce role-based single session
  if (shouldEnforceSingleSession(user.role)) {
    await revokeAllUserSessions(user._id);
  }

  const absoluteExpiry = calculateAbsoluteExpiry(user.role);

  const session = await Session.create({
    user: user._id,
    role: user.role,
    device: req.headers["user-agent"]?.substring(0, 120),
    ipAddress: cleanIp,
    location: null,
    isActive: true,
    absoluteExpiresAt: absoluteExpiry,
  });

  getLocationFromIp(cleanIp)
    .then((location) => {
      if (location) {
        Session.findByIdAndUpdate(session._id, { location }).catch(() => {});
      }
    })
    .catch(() => {});

  return session;
};

/* =========================================================
   VALIDATE SESSION
========================================================= */

export const validateSession = async (sessionId, userId) => {
  const session = await Session.findById(sessionId);

  if (!session || session.user.toString() !== userId.toString()) {
    throw new Error("Session expired");
  }

  if (!session.isActive) {
    throw new Error("Session expired");
  }

  if (
    session.absoluteExpiresAt &&
    session.absoluteExpiresAt < new Date()
  ) {
    // revoke refresh tokens for this session
    await RefreshToken.updateMany(
      { session: session._id, revoked: false },
      { revoked: true }
    );

    await Session.findByIdAndUpdate(session._id, { isActive: false });

    throw new Error("Session expired");
  }

  return session;
};

/* =========================================================
   REVOKE ALL USER SESSIONS
========================================================= */

export const revokeAllUserSessions = async (userId) => {
  const sessions = await Session.find({
    user: userId,
    isActive: true,
  }).select("_id");

  await Session.updateMany(
    { user: userId, isActive: true },
    { isActive: false }
  );

  await RefreshToken.updateMany(
    { user: userId, revoked: false },
    { revoked: true }
  );

  sessions.forEach((s) => {
    forceLogoutSession(global.io, s._id.toString());
  });
};

/* =========================================================
   REVOKE SINGLE SESSION 
========================================================= */

export const revokeSession = async (sessionId) => {
  await Session.findByIdAndUpdate(sessionId, { isActive: false });

  await RefreshToken.updateMany(
    { session: sessionId, revoked: false },
    { revoked: true }
  );

  forceLogoutSession(global.io, sessionId.toString());
};