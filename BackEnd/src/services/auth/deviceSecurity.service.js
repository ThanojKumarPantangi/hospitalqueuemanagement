import Device from "../../models/device.model.js";


export const updateDeviceRecord = async (
  user,
  deviceId,
  cleanIp,
  userAgent,
  existingDevice,
  currentCountry
) => {
  if (!deviceId) return;

  if (existingDevice) {
    existingDevice.lastIp = cleanIp;
    existingDevice.lastCountry = currentCountry || null;
    existingDevice.lastUsedAt = new Date();
    await existingDevice.save();
  } else {
    await Device.create({
      user: user._id,
      deviceId,
      userAgent,
      lastIp: cleanIp,
      lastCountry: currentCountry || null,
      lastUsedAt: new Date(),
    });
  }
};