import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Quote } from "lucide-react";

const ROTATION_BASE = 6000;

export default function AnimatedQuote({ token, Namedoc }) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  const {
    status,
    minMinutes,
    maxMinutes,
    waitingCount,
    doctorName,
  } = token;

  /* ---------------- MODE ---------------- */
  const mode =
    status === "CALLED"
      ? "CALLED"
      : status === "SKIPPED"
      ? "SKIPPED"
      : "WAITING";

  /* ---------------- WAIT-INTENSITY ---------------- */
  const intensity = useMemo(() => {
    if (typeof minMinutes !== "number") return 1;
    if (minMinutes <= 5) return 1.4;     // urgent
    if (minMinutes <= 15) return 1.1;    // moderate
    return 0.9;                          // calm
  }, [minMinutes]);

  const rotationTime = ROTATION_BASE / intensity;

  /* ---------------- QUOTES ---------------- */
  const quotes = useMemo(() => {
    if (mode === "CALLED") {
      return [`Dr. ${doctorName?.toUpperCase() || Namedoc?.toUpperCase() || "Doctor"} is calling you now.`];
    }

    if (mode === "SKIPPED") {
      return ["You were skipped. Please stay alert."];
    }

    if (typeof minMinutes === "number" && typeof maxMinutes === "number") {
      return [
        `Estimated wait: ${minMinutes}–${maxMinutes} minutes.`,
        `${waitingCount ?? "Some"} patients ahead of you.`,
        "We’re preparing for your consultation.",
      ];
    }

    return [
      "Your token is registered.",
      "Queue has not started yet.",
    ];
  }, [mode, minMinutes, maxMinutes, waitingCount, doctorName, Namedoc]);

  /* ---------------- ROTATION ---------------- */
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (mode !== "WAITING") return;

    const t = setTimeout(
      () => setIndex((i) => (i + 1) % quotes.length),
      rotationTime
    );

    return () => clearTimeout(t);
  }, [index, mode, quotes.length, rotationTime, prefersReducedMotion]);

  const currentQuote = quotes?.[index] ?? "";
  const words = currentQuote.split(" ");

  /* ---------------- RENDER ---------------- */
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
      className="relative overflow-hidden rounded-[2rem] 
                 border border-white/60 dark:border-white/10 
                 bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-900/60 dark:to-gray-800/30
                 backdrop-blur-xl shadow-2xl shadow-emerald-900/5 dark:shadow-emerald-500/5
                 p-10 md:p-14 text-center group"
    >
      {/* Background Decorative Glow (Optional Subtle Gradient) */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-400/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-teal-400/20 rounded-full blur-[80px] pointer-events-none" />

      {/* Icon Section */}
      <div className="flex justify-center mb-8 relative">
        {/* Pulse Effect behind icon */}
        {!prefersReducedMotion && mode === "WAITING" && (
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 m-auto h-16 w-16 rounded-2xl bg-emerald-500/20 z-0"
          />
        )}
        
        <motion.div
          animate={
            prefersReducedMotion
              ? {}
              : { 
                  y: [0, -5, 0],
                  scale: mode === 'CALLED' ? 1.1 : 1 
                }
          }
          transition={{ 
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 0.5 }
          }}
          className={`relative z-10 h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20
                      ${mode === 'CALLED' 
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 ring-4 ring-emerald-200 dark:ring-emerald-900' 
                        : 'bg-gradient-to-br from-teal-500 to-emerald-600'}`}
        >
          <Quote size={28} className="text-white fill-white/20" />
        </motion.div>
      </div>

      {/* Quote Text Area */}
      <div className="min-h-[100px] flex justify-center items-center relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${index}`}
            className="flex flex-wrap justify-center gap-x-2.5 gap-y-1"
          >
            {words.map((word, i) => (
              <motion.span
                key={`${index}-${i}`}
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 15, filter: "blur(8px)", scale: 0.9 }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                exit={
                   prefersReducedMotion 
                   ? { opacity: 0 } 
                   : { opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.2 } }
                }
                transition={{
                  duration: 0.5,
                  delay: prefersReducedMotion ? 0 : i * 0.05,
                  type: "spring",
                  stiffness: 120,
                  damping: 15
                }}
                className={`text-2xl md:text-3xl font-bold tracking-tight ${
                  mode === "CALLED"
                    ? "text-emerald-600 dark:text-emerald-400 drop-shadow-sm"
                    : "text-slate-700 dark:text-slate-100"
                }`}
              >
                {word}
              </motion.span>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      {mode === "WAITING" && !prefersReducedMotion && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200/50 dark:bg-gray-700/30">
          <motion.div
            key={index}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: rotationTime / 1000, ease: "linear" }}
            className="h-full bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          />
        </div>
      )}
    </motion.div>
  );
}