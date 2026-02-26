import Device from "../../models/device.model.js";
import redis from "../../config/redisClient.js";
import { getLocationFromIp } from "../../utils/geo.util.js";

export const evaluateLoginRisk = async ({
  user,
  security,
  deviceId,
  cleanIp,
}) => {
  let riskScore = 0;

  const DEVICE_EXPIRY_DAYS = 60;
  const now = new Date();

  // Get current location
  const location = await getLocationFromIp(cleanIp);
  const currentCountry = location?.country || null;

  let existingDevice = null;

  if (deviceId) {
    existingDevice = await Device.findOne({
      user: user._id,
      deviceId,
    });

    // New device
    if (!existingDevice) {
      riskScore += 40;
    } else {
      //  Device expiration check (UTC-safe duration comparison)
      const lastUsed = new Date(existingDevice.lastUsedAt);
      const diffDays = (now - lastUsed) / (1000 * 60 * 60 * 24);

      if (diffDays > DEVICE_EXPIRY_DAYS) {
        riskScore += 40; // expired device
      }

      // IP change on same device
      if (existingDevice.lastIp !== cleanIp) {
        riskScore += 20;
      }

      // Country change on same device
      if (
        existingDevice.lastCountry &&
        currentCountry &&
        existingDevice.lastCountry !== currentCountry
      ) {
        riskScore += 50;
      }
    }
  } else {
    // Missing deviceId header
    riskScore += 30;
  }

  // Account-level country anomaly
  if (
    security.lastLoginCountry &&
    currentCountry &&
    security.lastLoginCountry !== currentCountry
  ) {
    riskScore += 30;
  }

  //Redis IP velocity protection (60 sec window)
  const key = `login:ip:${cleanIp}`;
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, 60);
  }

  if (attempts > 10) {
    riskScore += 60;
  }

  // Extra strictness for admin
  if (user.role === "ADMIN") {
    riskScore += 20;
  }

  return {
    riskScore,
    location,
    currentCountry,
    existingDevice,
  };
};