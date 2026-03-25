import Device from "../../models/device.model.js";
import redis from "../../config/redisClient.js";
import { getLocationFromIp } from "../../utils/geo.util.js";
import bcrypt from "bcrypt";

export const evaluateLoginRisk = async ({
  user,
  security,
  deviceId,
  cleanIp,
  userAgent,
  deviceSecret,
}) => {
  let riskScore = 0;

  const DEVICE_EXPIRY_DAYS = 60;
  const now = new Date();

  const location = await getLocationFromIp(cleanIp);
  const currentCountry = location?.country || null;
  
  console.log(location)
  let existingDevice = null;
  let similarDevice = null;

  if (deviceId && deviceSecret) {
    const device = await Device.findOne({
      user: user._id,
      deviceId,
    });

    if (device) {
      const isMatch = await bcrypt.compare(
        deviceSecret,
        device.deviceSecretHash
      );

      if (isMatch) {
        existingDevice = device;
      }
    }
  }

  if (!existingDevice && userAgent) {
    similarDevice = await Device.findOne({
      user: user._id,
      userAgent,
      lastCountry: currentCountry || undefined,
    });
  }

  if (existingDevice) {
    const lastUsed = new Date(existingDevice.lastUsedAt);
    const diffDays = (now - lastUsed) / (1000 * 60 * 60 * 24);

    if (diffDays > DEVICE_EXPIRY_DAYS) {
      riskScore += 40;
    }

    if (existingDevice.lastIp !== cleanIp) {
      riskScore += 20;
    }

    if (
      existingDevice.lastCountry &&
      currentCountry &&
      existingDevice.lastCountry !== currentCountry
    ) {
      riskScore += 50;
    }

    const existingUA = existingDevice.userAgent || "";
    const currentUA = userAgent || "";

    if (
      existingUA &&
      currentUA &&
      !currentUA.includes(existingUA.split(" ")[0])
    ) {
      riskScore += 15;
    }

    if (!existingDevice.isTrusted) {
      riskScore += 20;
    }

    if (
      existingDevice.trustExpiresAt &&
      existingDevice.trustExpiresAt < now
    ) {
      riskScore += 30;
    }

  } else if (similarDevice) {
    riskScore += 25;

    if (similarDevice.lastIp !== cleanIp) {
      riskScore += 15;
    }

    if (
      similarDevice.lastCountry &&
      currentCountry &&
      similarDevice.lastCountry !== currentCountry
    ) {
      riskScore += 40;
    }

  } else {
    riskScore += 40;
  }

  if (
    security.lastLoginCountry &&
    currentCountry &&
    security.lastLoginCountry !== currentCountry
  ) {
    riskScore += 30;
  }

  const key = `login:ip:${cleanIp}`;
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, 60);
  }

  if (attempts > 10) {
    riskScore += 60;
  }

  if (user.role === "ADMIN") {
    riskScore += 20;
  }

  return {
    riskScore,
    location,
    currentCountry,
    existingDevice, 
    similarDevice, 
  };
};

export const handlePasswordFailure = async (user, security) => {
  security.failedLoginAttempts = (security.failedLoginAttempts || 0) + 1;
  await security.save();

  const attempts = security.failedLoginAttempts;

  let delay;
  if (user.role === "ADMIN") {
    delay = Math.min(2000 * Math.pow(2, attempts - 1), 120000);
  } else if (user.role === "DOCTOR") {
    delay = Math.min(1500 * Math.pow(2, attempts - 1), 90000);
  } else {
    delay = Math.min(1000 * Math.pow(2, attempts - 1), 60000);
  }

  await new Promise(resolve => setTimeout(resolve, delay));
  throw new Error("Invalid Credentials");
};

export const resetFailedAttempts = async (security) => {
  if (security.failedLoginAttempts > 0) {
    security.failedLoginAttempts = 0;
    await security.save();
  }
};