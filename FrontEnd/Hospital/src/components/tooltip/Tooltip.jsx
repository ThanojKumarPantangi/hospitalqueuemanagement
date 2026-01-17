import React from "react";

const Tooltip = ({ text, children }) => {
  return (
    <div className="relative inline-flex group">
      {children}

      <div
        className="
          pointer-events-none
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          opacity-0 group-hover:opacity-100
          scale-95 group-hover:scale-100
          transition-all duration-200
          bg-gray-900 text-white text-[10px] font-semibold
          px-3 py-1.5 rounded-lg shadow-xl
          whitespace-nowrap z-50
        "
      >
        {text}
        <div className="absolute left-1/2 top-full -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
      </div>
    </div>
  );
};

export default Tooltip;
