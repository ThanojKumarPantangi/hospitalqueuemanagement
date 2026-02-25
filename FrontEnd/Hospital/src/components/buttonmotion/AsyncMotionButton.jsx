import { motion, AnimatePresence } from "framer-motion";
const variants = {
  idle: { scale: 1, opacity: 1 },
  pressed: { scale: 0.95 },
  loading: { scale: 0.98, opacity: 0.6 },
};

export default function AsyncMotionButton({
  loading = false,
  onClick,
  children,
  loadingText = "PROCESSING…",
  className = "",
  disabled = false,
  icon,
}) {
  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // ✅ prevents parent card triggering
        onClick?.(e);
      }}
      disabled={loading || disabled}
      variants={variants}
      initial="idle"
      animate={loading ? "loading" : "idle"}
      whileTap={!loading ? "pressed" : undefined}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={className}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-center gap-2"
          >
            <motion.span
              className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            />
            {loadingText}
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex items-center justify-center gap-2"
          >
            {icon}
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
