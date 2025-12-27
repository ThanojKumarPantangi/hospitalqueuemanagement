const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getBadgeConfig = (date) => {
  const today = getStartOfDay();
  const target = getStartOfDay(new Date(date));

  const diffDays =
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

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
    label: target.toLocaleDateString(),
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
