import Device from "../../models/device.model.js";

export const updateDeviceRecord = async (
  user,
  deviceId,
  cleanIp,
  userAgent,
  existingDevice,
  currentCountry,
  deviceSecret,
) => {
  let finalDeviceId = deviceId;
  let deviceSecretHash = deviceSecret;

  if (existingDevice) {
    // Update existing device
    existingDevice.lastIp = cleanIp;
    existingDevice.lastCountry = currentCountry || null;
    existingDevice.lastUsedAt = new Date();

    await existingDevice.save();

  } else {
    // Create new device
    await Device.create({
      user: user._id,
      deviceId: finalDeviceId,
      userAgent,
      lastIp: cleanIp,
      lastCountry: currentCountry || null,
      lastUsedAt: new Date(),
      revoked: false,
      deviceSecretHash,
      isTrusted: false,
      trustExpiresAt: null,
    });
  }
};