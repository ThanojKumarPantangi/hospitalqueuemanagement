const getTimeLeft = (expiry) => {
  if (!expiry) return null;

  const diff = new Date(expiry) - new Date();

  if (diff <= 0) {
    return { label: "Expired", status: "expired" };
  }

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return { label: `${days}d left`, status: "safe" };
  }

  if (hours > 0) {
    return { label: `${hours}h left`, status: "warning" };
  }

  
  return { label: "Expires soon", status: "danger" };
};

export default getTimeLeft;