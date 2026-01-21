import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import api from "../../api/axios";
import { showToast } from "../../utils/toastBus";

const ForgotPassword = () => {
  // ------------------ STATE ------------------
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // ------------------ API LOGIC (DO NOT TOUCH) ------------------
  const handleForgot = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      return showToast({ type: "error", message: "Email is required" });
    }

    try {
      setLoading(true);

      const res = await api.post("/api/users/forgot-password", {
        email: email.trim(),
      });

      showToast({
        type: "success",
        message: res?.data?.message || "Reset link sent successfully",
      });

      setEmail("");
    } catch (err) {
      showToast({
        type: "error",
        message: err?.response?.data?.message || "Failed to send reset link",
      });
    } finally {
      setLoading(false);
    }
  };

  // ------------------ ANIMATION VARIANTS ------------------
  const pageVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
  };

  const glowVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  };

  const inputWrapperVariants = {
    idle: { scale: 1 },
    focus: { scale: 1.01 },
  };

  // ------------------ UI ------------------
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="
        min-h-screen flex items-center justify-center px-4
        bg-gradient-to-b from-gray-50 via-white to-gray-100
        dark:from-black dark:via-black dark:to-gray-950
        relative overflow-hidden
      "
    >
      {/* ------------------ BACKGROUND DECOR ------------------ */}
      <motion.div
        variants={glowVariants}
        className="
          absolute -top-24 -left-24 w-72 h-72 rounded-full
          bg-indigo-400/25 blur-3xl
          dark:bg-indigo-500/20
        "
      />
      <motion.div
        variants={glowVariants}
        className="
          absolute -bottom-24 -right-24 w-72 h-72 rounded-full
          bg-purple-400/20 blur-3xl
          dark:bg-purple-500/20
        "
      />

      {/* subtle grid overlay */}
      <div
        className="
          absolute inset-0 opacity-[0.08] dark:opacity-[0.10]
          [background-image:linear-gradient(to_right,rgba(0,0,0,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.2)_1px,transparent_1px)]
          dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.25)_1px,transparent_1px)]
          [background-size:42px_42px]
        "
      />

      {/* ------------------ MAIN CARD ------------------ */}
      <motion.div
        variants={cardVariants}
        className="
          w-full max-w-md relative
          rounded-[28px]
          bg-white/80 dark:bg-gray-950/70
          border border-black/5 dark:border-white/10
          shadow-[0_20px_60px_rgba(0,0,0,0.12)]
          backdrop-blur-xl
          p-6 sm:p-7
        "
      >
        {/* top badge */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between"
        >
          <div
            className="
              inline-flex items-center gap-2
              px-3 py-1.5 rounded-full
              bg-indigo-50 text-indigo-700
              dark:bg-indigo-500/10 dark:text-indigo-300
              text-xs font-semibold
              border border-indigo-100 dark:border-indigo-500/20
            "
          >
            <Sparkles size={14} />
            Password Recovery
          </div>

          <div
            className="
              inline-flex items-center gap-2
              text-xs font-medium
              text-gray-500 dark:text-gray-400
            "
          >
            <ShieldCheck size={16} />
            Secure Flow
          </div>
        </motion.div>

        {/* heading */}
        <motion.div variants={itemVariants} className="mt-5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Forgot your password?
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            Enter your email address and we’ll send you a secure reset link.
            Make sure you check your spam folder too.
          </p>
        </motion.div>

        {/* divider */}
        <motion.div
          variants={itemVariants}
          className="mt-5 h-px w-full bg-black/5 dark:bg-white/10"
        />

        {/* form */}
        <motion.form
          onSubmit={handleForgot}
          className="mt-6 space-y-4"
          variants={itemVariants}
        >
          {/* email label */}
          <motion.div variants={itemVariants} className="space-y-2">
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Email address
            </label>

            <motion.div
              variants={inputWrapperVariants}
              initial="idle"
              whileFocusWithin="focus"
              className="
                relative rounded-2xl
                border border-black/5 dark:border-white/10
                bg-gray-50 dark:bg-gray-900/60
                shadow-sm
                focus-within:ring-2 focus-within:ring-indigo-500/60
                transition
              "
            >
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <motion.div
                  animate={{
                    rotate: loading ? 10 : 0,
                    scale: loading ? 1.05 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 18,
                  }}
                  className="
                    w-9 h-9 rounded-xl
                    bg-white dark:bg-gray-950
                    border border-black/5 dark:border-white/10
                    flex items-center justify-center
                    shadow-sm
                  "
                >
                  <Mail size={18} className="text-gray-500 dark:text-gray-300" />
                </motion.div>
              </div>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="example@gmail.com"
                className="
                  w-full pl-14 pr-4 py-3 rounded-2xl
                  bg-transparent
                  outline-none
                  text-gray-900 dark:text-white
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  text-sm
                "
              />
            </motion.div>

            {/* helper text */}
            <motion.p
              variants={itemVariants}
              className="text-xs text-gray-500 dark:text-gray-500"
            >
              We’ll never share your email with anyone.
            </motion.p>
          </motion.div>

          {/* button */}
          <motion.button
            type="submit"
            disabled={loading}
            variants={buttonVariants}
            initial="idle"
            whileHover={!loading ? "hover" : "idle"}
            whileTap={!loading ? "tap" : "idle"}
            className="
              w-full flex items-center justify-center gap-2
              py-3 rounded-2xl font-semibold
              bg-gradient-to-r from-indigo-600 to-purple-600
              hover:from-indigo-700 hover:to-purple-700
              text-white
              shadow-lg shadow-indigo-600/20
              transition
              disabled:opacity-60 disabled:cursor-not-allowed
              relative overflow-hidden
            "
          >
            {/* moving shine effect */}
            <motion.span
              aria-hidden="true"
              className="
                absolute inset-0
                bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.35),transparent)]
                opacity-0
              "
              animate={{
                opacity: loading ? 0 : 1,
                x: loading ? 0 : ["-120%", "120%"],
              }}
              transition={{
                duration: 1.8,
                repeat: loading ? 0 : Infinity,
                ease: "linear",
              }}
            />

            <AnimatePresence mode="wait">
              {!loading ? (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 relative"
                >
                  Send Reset Link
                  <ArrowRight size={18} />
                </motion.span>
              ) : (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 relative"
                >
                  <Loader2 size={18} className="animate-spin" />
                  Sending...
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* footer */}
          <motion.div
            variants={itemVariants}
            className="
              pt-2 text-center text-xs
              text-gray-500 dark:text-gray-500
            "
          >
            If you don’t receive the email within a minute, try again or check
            spam.
          </motion.div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
};

export default ForgotPassword;