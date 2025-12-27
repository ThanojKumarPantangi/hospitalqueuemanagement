import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Sparkles } from "lucide-react";

/* ---------------- QUOTES DATA ---------------- */
const QUOTES = [
  "Your care is in progress, please relax.",
  "Every moment brings you closer to care.",
  "We are preparing for your consultation.",
  "Your health journey is moving forward.",
  "Thank you for your patience and trust.",
];

export default function AnimatedQuote() {
  const [index, setIndex] = useState(0);
  const [isTabActive, setIsTabActive] = useState(true);
  const ROTATION_TIME = 6000; // Duration for each quote (6 seconds)

  /* ---------- TAB VISIBILITY LOGIC ---------- */
  useEffect(() => {
    const onVisibilityChange = () => setIsTabActive(!document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  /* ---------- QUOTE ROTATION LOGIC ---------- */
  useEffect(() => {
    if (!isTabActive) return;

    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % QUOTES.length);
    }, ROTATION_TIME);

    return () => clearTimeout(timer);
  }, [index, isTabActive]);

  const words = QUOTES[index].split(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative w-full rounded-[2.5rem] border border-white/40 dark:border-white/5 
                 bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl 
                 shadow-[0_20px_60px_rgba(0,0,0,0.03)] dark:shadow-none 
                 overflow-hidden p-10 md:p-16 text-center"
    >
      {/* 1. Decorative Sparkle (Top Right) */}
      <div className="absolute top-8 right-10 text-teal-400/30 hidden md:block">
        <Sparkles size={28} className="animate-pulse" />
      </div>

      {/* 2. Main Icon with Pulsing Background */}
      <div className="flex justify-center mb-10">
        <div className="relative">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-teal-400 blur-2xl rounded-full"
          />
          <div className="relative z-10 h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 
                          flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Quote className="text-white" size={28} fill="currentColor" />
          </div>
        </div>
      </div>

      {/* 3. Quote Text (Word-by-Word Blur Reveal) */}
      <div className="min-h-[110px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="flex flex-wrap justify-center gap-x-3 gap-y-2"
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, filter: "blur(12px)", y: 12 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0, filter: "blur(8px)", y: -10 }}
                transition={{
                  delay: i * 0.1,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for premium feel
                }}
                className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100"
              >
                {word}
              </motion.span>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4. Minimal Divider */}
      <div className="mt-8 h-px w-20 mx-auto bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

      {/* 5. Animated Timing Progress Bar (Bottom) */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-100/50 dark:bg-gray-800/30">
        <motion.div
          key={index}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: ROTATION_TIME / 1000, ease: "linear" }}
          className="h-full bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-400"
        />
      </div>
    </motion.div>
  );
}