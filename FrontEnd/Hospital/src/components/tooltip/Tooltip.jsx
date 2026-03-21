import React from "react";

const Tooltip = ({ text, children }) => {
  return (
    <div className="relative inline-flex group">
      {children}

      <div
        className="
          pointer-events-none
          absolute bottom-full left-1/2 -translate-x-1/2 mb-3
          
          opacity-0 translate-y-2 scale-95
          group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100
          
          transition-all duration-300 ease-out delay-75
          
          backdrop-blur-md
          bg-black/80 dark:bg-white/10
          text-white dark:text-white
          
          text-[11px] font-semibold tracking-wide
          px-3.5 py-2 rounded-xl
          
          shadow-[0_10px_30px_rgba(0,0,0,0.25)]
          
          whitespace-nowrap z-50
        "
      >
        {text}

        <div
          className="
            absolute left-1/2 top-full -translate-x-1/2
            w-2.5 h-2.5
            bg-black/80 dark:bg-white/10
            rotate-45
          "
        />
      </div>
    </div>
  );
};

export default Tooltip;