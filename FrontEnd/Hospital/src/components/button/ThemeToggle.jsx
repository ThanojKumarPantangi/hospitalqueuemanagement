import { useTheme } from "../../hooks/useTheme";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  // Determine if it is dark mode based on your theme state
  const isDark = theme === "dark";

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* 1. Animation Styles for the EKG effect */}
      <style>{`
        .ekg-animate {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            animation: move-ekg 2s linear infinite;
        }

        @keyframes move-ekg {
            0% { stroke-dashoffset: 100; }
            100% { stroke-dashoffset: -100; }
        }
      `}</style>

      {/* 2. Dynamic Status Label (Slightly smaller text to match) */}
      <div className="flex items-center space-x-2">
        <span
          className={`text-[8px] font-bold uppercase tracking-[0.3em] animate-pulse transition-colors duration-500 ${
            isDark ? "text-blue-400" : "text-slate-500"
          }`}
        >
          {isDark ? "Night Shift" : "Day Shift"}
        </span>
      </div>

      {/* 3. The Scaled Down Toggle */}
      <label className="relative inline-flex items-center cursor-pointer group">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={isDark}
          onChange={toggleTheme}
        />

        {/* Toggle Background (Reduced size to w-14 h-7) */}
        <div
          className="w-14 h-7 bg-[#0a1222] border border-white/10 rounded-full peer 
                        peer-checked:border-blue-500/50 peer-checked:bg-[#0a1222]
                        peer-focus:ring-2 peer-focus:ring-blue-500/20
                        transition-all duration-500 shadow-inner overflow-hidden"
        >
          {/* EKG Path (Scaled for smaller container) */}
          <div className="absolute inset-0 opacity-0 peer-checked:opacity-40 transition-opacity duration-500 flex items-center justify-center pl-1 pr-6">
            <svg viewBox="0 0 100 20" className="w-full h-4 text-blue-500">
              <path
                d="M0 10h10l2-8 3 16 3-8h10l2-8 3 16 3-8h10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ekg-animate"
              />
            </svg>
          </div>

          {/* Sun Icon Background (Light mode indicator) */}
          <div className="absolute inset-0 opacity-100 peer-checked:opacity-0 transition-opacity duration-500 flex items-center justify-end pr-2 text-amber-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
              />
            </svg>
          </div>
        </div>

        {/* Toggle Knob (Reduced to w-5 h-5 and adjusted translate) */}
        <div
          className="absolute left-[4px] top-[4px] w-5 h-5 bg-white rounded-full transition-all duration-500 
                        peer-checked:translate-x-7 peer-checked:bg-blue-500
                        shadow-[0_0_10px_rgba(0,0,0,0.2)] 
                        peer-checked:shadow-[0_0_15px_rgba(59,130,246,0.5)]
                        flex items-center justify-center"
        >
          {/* Moon Icon (Dark Mode) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 text-white hidden peer-checked:block"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>

          {/* Sun Icon (Light Mode) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 text-amber-500 block peer-checked:hidden"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </label>
    </div>
  );
}

export default ThemeToggle;