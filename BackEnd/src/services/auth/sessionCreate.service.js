import Session from "../../models/session.model.js";
import { getLocationFromIp } from "../../utils/geo.util.js";

export const createSession = async (user, req, cleanIp) => {
  let absoluteExpiry;

  if (user.role === "DOCTOR") {
    absoluteExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  } else if (user.role === "ADMIN") {
    absoluteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  } else {
    absoluteExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

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