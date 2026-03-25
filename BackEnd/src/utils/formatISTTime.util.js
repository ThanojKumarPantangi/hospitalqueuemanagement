export const getStartOfISTDay = (date = new Date()) => {
  const d = new Date(date);

  // Convert to IST by adding 5:30
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffsetMs);

  // Start of IST day
  istDate.setHours(0, 0, 0, 0);

  // Convert back to UTC Date object for DB match
  return new Date(istDate.getTime() - istOffsetMs);
};

export const formatToISTDate = (date, options = {}) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  });
};