import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const Toast = ({ message, type = "success", duration = 4000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variants = {
    initial: {
      opacity: 0,
      y: -12,
      scale: 0.96,
      filter: "blur(4px)",
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 22,
        mass: 0.8,
      },
    },
    exit: {
      opacity: 0,
      y: -8,
      scale: 0.97,
      transition: { duration: 0.18, ease: "easeInOut" },
    },
  };

  const theme = {
    success: {
      title: "Success",
      icon: <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />,
      accent: "from-emerald-500/20 to-emerald-400/5",
      bar: "bg-emerald-500",
      glow: "shadow-emerald-500/20",
    },
    error: {
      title: "Error",
      icon: <AlertCircle size={20} className="text-rose-600 dark:text-rose-400" />,
      accent: "from-rose-500/20 to-rose-400/5",
      bar: "bg-rose-500",
      glow: "shadow-rose-500/20",
    },
  };

  const style = theme[type] ?? theme.success;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      className={`
        fixed top-6 right-6 z-[100]
        w-[22rem]
        rounded-2xl
        border border-white/20 dark:border-white/10
        bg-white/80 dark:bg-gray-900/80
        backdrop-blur-xl
        shadow-xl ${style.glow}
        overflow-hidden
      `}
    >
      {/* Accent gradient strip */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${style.accent} pointer-events-none`}
      />

      <div className="relative flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="flex-shrink-0 p-2 rounded-xl bg-white/60 dark:bg-black/30">
          {style.icon}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
            {style.title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 leading-snug">
            {message}
          </p>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="
            p-1.5 rounded-lg
            text-gray-400 hover:text-gray-900
            dark:hover:text-white
            hover:bg-black/5 dark:hover:bg-white/10
            transition
          "
        >
          <X size={16} strokeWidth={2.4} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="relative h-[3px] bg-black/5 dark:bg-white/10">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: duration / 1000, ease: "linear" }}
          className={`h-full ${style.bar}`}
        />
      </div>
    </motion.div>
  );
};

export default Toast;
