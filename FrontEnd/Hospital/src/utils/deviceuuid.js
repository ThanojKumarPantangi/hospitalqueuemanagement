export function getOrCreateDeviceId() {
  let deviceId = sessionStorage.getItem("deviceId");

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    sessionStorage.setItem("deviceId", deviceId);
  }

  return deviceId;
}