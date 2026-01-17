import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Zap,
  Bell,
  Clock,
  ChevronDown,
  ArrowRight,
  Building2,
} from "lucide-react";
import { useMemo, useState } from "react";

function StickyMiniToken({ token, show }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // ✅ Hook-safe token reference
  const safeToken = token ?? null;

  // --- Logic ---
  const isCalled = safeToken?.status === "CALLED";
  const isNear =
    typeof safeToken?.waitingCount === "number" &&
    safeToken.waitingCount <= 3 &&
    !isCalled;

  // --- Dynamic Color Themes ---
  const theme = useMemo(() => {
    if (isCalled) {
      return {
        bg: "bg-rose-600",
        darkBg: "dark:bg-rose-600",
        text: "text-white",
        subText: "text-rose-100",
        accent: "bg-white/16",
        glow: "shadow-[0_24px_70px_-18px_rgba(225,29,72,0.55)]",
        ring: "ring-1 ring-white/15",
        orb: "bg-white/18",
      };
    }

    if (isNear) {
      return {
        bg: "bg-amber-500",
        darkBg: "dark:bg-amber-500",
        text: "text-white",
        subText: "text-amber-100",
        accent: "bg-white/16",
        glow: "shadow-[0_24px_70px_-18px_rgba(245,158,11,0.55)]",
        ring: "ring-1 ring-white/15",
        orb: "bg-white/18",
      };
    }

    return {
      bg: "bg-slate-900",
      darkBg: "dark:bg-black",
      text: "text-white",
      subText: "text-slate-300/80",
      accent: "bg-white/8",
      glow: "shadow-[0_24px_70px_-18px_rgba(15,23,42,0.45)]",
      ring: "ring-1 ring-white/10",
      orb: "bg-indigo-400/10",
    };
  }, [isCalled, isNear]);

  // --- Animation Physics ---
  const springTransition = {
    type: "spring",
    stiffness: 420,
    damping: 32,
    mass: 1,
  };

  const containerVariants = {
    initial: {
      width: 220,
      height: 64,
      borderRadius: 32,
      y: -110,
      opacity: 0,
      scale: 0.96,
      filter: "blur(10px)",
    },
    collapsed: {
      width: 220,
      height: 64,
      borderRadius: 32,
      y: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: springTransition,
    },
    expanded: {
      width: 350,
      height: "auto",
      borderRadius: 26,
      y: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: springTransition,
    },
    exit: {
      y: -150,
      opacity: 0,
      scale: 0.96,
      filter: "blur(10px)",
      transition: { duration: 0.25, ease: "anticipate" },
    },
  };

  // ✅ Safe early return AFTER hooks
  if (!safeToken) return null;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed top-19 left-0 right-0 z-[100] flex justify-center pointer-events-none">
          <motion.div
            layout
            variants={containerVariants}
            initial="initial"
            animate={isExpanded ? "expanded" : "collapsed"}
            exit="exit"
            onClick={() => setIsExpanded((p) => !p)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`
              pointer-events-auto cursor-pointer
              relative overflow-hidden
              ${theme.bg} ${theme.darkBg}
              ${theme.glow}
              ${theme.ring}
              backdrop-blur-xl border border-white/10
            `}
          >
            {/* ===== Premium Ambient Background (NO external URLs) ===== */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Soft gradient layer */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />

              {/* Orbs */}
              <motion.div
                animate={{ x: [0, 10, 0], y: [0, -8, 0] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-[70px] ${theme.orb}`}
              />
              <motion.div
                animate={{ x: [0, -12, 0], y: [0, 10, 0] }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full blur-[70px] bg-white/10"
              />

              {/* Shine sweep */}
              <motion.div
                className="absolute inset-y-0 left-0 w-1/3 bg-white/20 blur-xl rotate-12 opacity-40"
                initial={{ x: "-140%" }}
                animate={{ x: "140%" }}
                transition={{
                  duration: isCalled ? 1.6 : 2.4,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: isCalled ? 0.6 : 1.2,
                }}
              />
            </div>

            {/* ===== CONTENT ===== */}
            <motion.div
              layout
              className="relative z-10 flex flex-col w-full h-full"
            >
              {/* ===== HEADER ROW ===== */}
              <div className="flex items-center justify-between px-2 w-full h-16 shrink-0">
                {/* Left */}
                <div className="flex items-center gap-3 pl-2">
                  {/* Status Ring */}
                  <div className="relative flex items-center justify-center w-10 h-10">
                    <svg
                      className="absolute inset-0 w-full h-full -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <path
                        className="text-white/20"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <motion.path
                        className="text-white"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${isCalled ? 100 : isNear ? 80 : 35}, 100`}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </svg>

                    {/* Icon */}
                    <motion.div
                      animate={
                        isCalled
                          ? { rotate: [0, -12, 12, -12, 0] }
                          : isNear
                          ? { scale: [1, 1.08, 1] }
                          : {}
                      }
                      transition={
                        isCalled
                          ? { repeat: Infinity, repeatDelay: 1.6, duration: 0.55 }
                          : isNear
                          ? { repeat: Infinity, duration: 1.3, ease: "easeInOut" }
                          : { duration: 0.25 }
                      }
                    >
                      {isCalled ? (
                        <Bell size={18} className="text-white" />
                      ) : (
                        <Zap size={18} className="text-white" />
                      )}
                    </motion.div>
                  </div>

                  {/* Text */}
                  <div className="flex flex-col justify-center">
                    <motion.span
                      layout
                      className={`text-[10px] font-semibold uppercase tracking-wider opacity-80 ${theme.text}`}
                    >
                      {isCalled ? "Proceed Now" : isNear ? "Get Ready" : "Your Token"}
                    </motion.span>

                    <motion.span
                      layout
                      className={`text-xl font-black leading-none ${theme.text}`}
                    >
                      #{safeToken.tokenNumber}
                    </motion.span>
                  </div>
                </div>

                {/* Right */}
                <div className="pr-4 flex items-center gap-2">
                  {/* Small status pill */}
                  {!isExpanded && (
                    <motion.div
                      animate={isCalled ? { scale: [1, 1.12, 1] } : {}}
                      transition={{
                        repeat: Infinity,
                        duration: 1.4,
                        ease: "easeInOut",
                      }}
                      className={`
                        px-3 py-1.5 rounded-full text-[10px] font-black
                        backdrop-blur-sm ${theme.text}
                        ${theme.accent}
                      `}
                    >
                      {isCalled ? "NOW" : "VIEW"}
                    </motion.div>
                  )}

                  {/* Expand arrow always visible + rotates */}
                  <motion.div
                    animate={{
                      rotate: isExpanded ? 180 : 0,
                      opacity: isExpanded ? 0.7 : 0.55,
                    }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <ChevronDown size={18} className={`${theme.text}`} />
                  </motion.div>
                </div>
              </div>

              {/* ===== EXPANDED DETAILS ===== */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="px-5 pb-5 w-full"
                  >
                    {/* Divider */}
                    <div className="w-full h-px bg-white/12 mb-4" />

                    {/* Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div
                        className={`p-3 rounded-2xl ${theme.accent} backdrop-blur-md`}
                      >
                        <div className="flex items-center gap-2 mb-1 opacity-70">
                          <Building2 size={12} className={theme.text} />
                          <span
                            className={`text-[10px] uppercase font-black ${theme.text}`}
                          >
                            Dept
                          </span>
                        </div>
                        <p className={`text-sm font-bold truncate ${theme.text}`}>
                          {safeToken.departmentName}
                        </p>
                      </div>

                      <div
                        className={`p-3 rounded-2xl ${theme.accent} backdrop-blur-md`}
                      >
                        <div className="flex items-center gap-2 mb-1 opacity-70">
                          <Users size={12} className={theme.text} />
                          <span
                            className={`text-[10px] uppercase font-black ${theme.text}`}
                          >
                            Ahead
                          </span>
                        </div>
                        <p className={`text-sm font-bold ${theme.text}`}>
                          {isCalled ? "0" : safeToken.waitingCount ?? "--"} People
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className={theme.subText} />
                        <span className={`text-xs ${theme.subText}`}>
                          Est. Wait:{" "}
                          <span className="font-black text-white">
                            {isCalled ? "0m" : "5-10m"}
                          </span>
                        </span>
                      </div>

                      {isCalled && (
                        <motion.button
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white text-rose-600 rounded-xl text-xs font-black uppercase tracking-wide shadow-lg"
                        >
                          Directions <ArrowRight size={12} />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default StickyMiniToken;
