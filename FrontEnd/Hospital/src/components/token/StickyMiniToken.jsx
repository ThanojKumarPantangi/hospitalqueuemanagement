import { motion, AnimatePresence } from "framer-motion";
import { Users, Building2, Zap } from "lucide-react";
import { useState } from "react";

function StickyMiniToken({ token, show }) {
  const [isHovered, setIsHovered] = useState(false);

  if (!token) return null;

  const isCalled = token.status === "CALLED";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.98 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
        >
          <motion.div
            layout
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="
              relative
              w-[320px]
              rounded-3xl
              px-6 pt-3 pb-3
              cursor-default

              bg-gradient-to-br
              from-white/90 to-white/70
              dark:from-gray-900/90 dark:to-gray-800/70

              backdrop-blur-xl
              border border-teal-100/70 dark:border-teal-800/40

              shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]
              dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]
            "
          >
            {/* ================= COLLAPSED ================= */}
            <motion.div layout className="flex items-center justify-between gap-4">
              {/* LEFT */}
              <div className="flex items-center gap-3">
                {/* STATUS DOT */}
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`
                      absolute inline-flex h-full w-full rounded-full animate-ping
                      ${isCalled ? "bg-red-400" : "bg-emerald-400"}
                    `}
                  />
                  <span
                    className={`
                      relative inline-flex h-2.5 w-2.5 rounded-full
                      ${isCalled ? "bg-red-500" : "bg-emerald-500"}
                    `}
                  />
                </span>

                {/* TOKEN INFO */}
                <div>
                  <p className="text-xs font-black text-gray-900 dark:text-gray-100">
                    Token #{token.tokenNumber}
                  </p>
                  <p
                    className={`
                      text-[10px] font-semibold tracking-wide
                      ${isCalled
                        ? "text-red-600 dark:text-red-400"
                        : "text-teal-600 dark:text-teal-400"}
                    `}
                  >
                    {isCalled ? "Proceed Now" : "Waiting"}
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div
                className={`
                  flex items-center gap-1.5 text-[10px] font-bold
                  ${isCalled
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-700 dark:text-gray-300"}
                `}
              >
                <Users size={14} />
                {isCalled ? "CALLED" : `${token.waitingCount} AHEAD`}
              </div>
            </motion.div>

            {/* ================= EXPANDED ================= */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: -6, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="
                    mt-3 pt-3 space-y-2
                    border-t border-teal-100/60 dark:border-teal-800/40
                  "
                >
                  <div className="flex justify-between items-center text-[10px] text-gray-700 dark:text-gray-300">
                    <span className="flex items-center gap-1 opacity-80">
                      <Building2 size={12} /> Department
                    </span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {token.departmentName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-700 dark:text-gray-300">
                    <span className="flex items-center gap-1 opacity-80">
                      <Zap size={12} /> Priority
                    </span>
                    <span
                      className={`
                        font-bold
                        ${token.priority === "HIGH"
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-600 dark:text-amber-400"}
                      `}
                    >
                      {token.priority}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default StickyMiniToken;
