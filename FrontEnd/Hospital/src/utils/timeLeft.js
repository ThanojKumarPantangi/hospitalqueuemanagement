const getTimeLeft = (expiry) => {
  if (!expiry) return null;

  const diff = new Date(expiry) - new Date();

  if (diff <= 0) return "Expired";

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h left`;
  return `${minutes}m left`;
};

export default getTimeLeft;