const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const getStartOfISTDay = (date = new Date()) => {
  const d = new Date(date);

  // Convert to IST
  const ist = new Date(d.getTime() + IST_OFFSET_MS);

  // Start of IST day
  ist.setHours(0, 0, 0, 0);

  // Convert back to UTC timestamp (for stable comparison)
  return new Date(ist.getTime() - IST_OFFSET_MS);
};

const getBadgeConfig = (date) => {
  const today = getStartOfISTDay(new Date());
  const target = getStartOfISTDay(date);

  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return {
      label: "TODAY",
      className: "bg-red-500 text-white",
    };
  }

  if (diffDays === 1) {
    return {
      label: "TOMORROW",
      className: "bg-amber-500 text-white",
    };
  }

  return {
    label: new Date(date).toLocaleDateString("en-IN"),
    className:
      "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
  };
};

const Badge = ({ date }) => {
  if (!date) return null;

  const { label, className } = getBadgeConfig(date);

  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[10px] font-black ${className}`}
    >
      {label}
    </span>
  );
};

export default Badge;