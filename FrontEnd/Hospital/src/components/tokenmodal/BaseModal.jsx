import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

const BaseModal = ({
  open,
  onClose,
  maxWidth = "max-w-lg",
  rounded = "rounded-[3rem]",
  children,
}) => {
  // 🔒 Lock body scroll when modal open (UI only)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ⌨️ Escape key close (UI only)
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.94, y: 42 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: 30 },
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md overflow-y-auto no-scrollbar"
          onClick={onClose}
        >
          {/* Ambient Orbs (premium background) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{ x: [0, 50, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-[140px]
                         bg-teal-400/20 dark:bg-teal-500/10"
            />
            <motion.div
              animate={{ x: [0, -60, 0], y: [0, 50, 0], scale: [1, 1.18, 1] }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-44 -right-44 w-[520px] h-[520px] rounded-full blur-[150px]
                         bg-emerald-400/20 dark:bg-emerald-500/10"
            />
          </div>

          {/* Center wrapper */}
          <div className="min-h-screen flex items-start justify-center px-4 py-16">
            <motion.div
              variants={modalVariants}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className={`
                relative w-full ${maxWidth} overflow-hidden ${rounded}
                bg-white dark:bg-gray-950
                border border-gray-200/80 dark:border-gray-800/80
                shadow-[0_40px_80px_-20px_rgba(0,0,0,0.65)]
              `}
            >
              {/* Soft inner glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[90px] bg-teal-400/10" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-[90px] bg-indigo-400/10" />
              </div>

              {/* Content */}
              <div className="relative z-10">{children}</div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BaseModal;
