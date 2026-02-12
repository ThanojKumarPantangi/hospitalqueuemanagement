import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { showToast } from "../../utils/toastBus";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ------------------ STATE ------------------
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // UI-only states (does not affect API logic)
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // ------------------ read token + email from URL ------------------
  const { token, email } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      token: params.get("token"),
      email: params.get("email"),
    };
  }, [location.search]);

  // ------------------ API LOGIC (DO NOT TOUCH) ------------------
  const handleReset = async (e) => {
    e.preventDefault();

    if (!token || !email) {
      return showToast({
        type: "error",
        message: "Invalid reset link. Please request again.",
      });
    }

    if (!newPassword || !confirmPassword) {
      return showToast({
        type: "error",
        message: "All fields are required",
      });
    }

    if (newPassword.length < 6) {
      return showToast({
        type: "error",
        message: "Password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return showToast({
        type: "error",
        message: "Passwords do not match",
      });
    }

    try {
      setLoading(true);

      const res = await api.post("/api/users/reset-password", {
        email,
        token,
        newPassword,
      });

      showToast({
        type: "success",
        message: res?.data?.message || "Password reset successful",
      });

      // go login
      navigate("/login");
    } catch (err) {
      showToast({
        type: "error",
        message: err?.response?.data?.message || "Reset failed",
      });
    } finally {
      setLoading(false);
    }
  };

  // ------------------ UI HELPERS (NO API CHANGE) ------------------
  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const passwordTooShort = newPassword.length > 0 && newPassword.length < 6;

  const showMismatchWarning =
    confirmPassword.length > 0 &&
    newPassword.length > 0 &&
    newPassword !== confirmPassword;

  const tokenInvalid = !token || !email;

  // ------------------ ANIMATION VARIANTS ------------------
  const pageVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: 0.55,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.09,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 26, scale: 0.985 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
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
      transition: { duration: 0.65, ease: "easeOut" },
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
          absolute -top-28 -left-28 w-80 h-80 rounded-full
          bg-indigo-400/25 blur-3xl
          dark:bg-indigo-500/20
        "
      />
      <motion.div
        variants={glowVariants}
        className="
          absolute -bottom-28 -right-28 w-80 h-80 rounded-full
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
        {/* top badges */}
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
            Reset Password
          </div>

          <div
            className="
              inline-flex items-center gap-2
              text-xs font-medium
              text-gray-500 dark:text-gray-400
            "
          >
            <ShieldCheck size={16} />
            Protected
          </div>
        </motion.div>

        {/* heading */}
        <motion.div variants={itemVariants} className="mt-5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Create a new password
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            Choose a strong password you don’t use elsewhere. Once updated,
            you’ll be redirected to login.
          </p>
        </motion.div>

        {/* token warning (UI only) */}
        <AnimatePresence>
          {tokenInvalid && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="
                mt-4 rounded-2xl border
                border-amber-200 bg-amber-50
                dark:border-amber-500/30 dark:bg-amber-500/10
                px-4 py-3
              "
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 text-amber-600 dark:text-amber-300"
                />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Reset link looks invalid
                  </p>
                  <p className="text-xs mt-0.5 text-amber-700 dark:text-amber-300/80">
                    Token or email is missing. Please request a new reset link.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* divider */}
        <motion.div
          variants={itemVariants}
          className="mt-5 h-px w-full bg-black/5 dark:bg-white/10"
        />

        {/* form */}
        <motion.form
          onSubmit={handleReset}
          className="mt-6 space-y-4"
          variants={itemVariants}
        >
          {/* NEW PASSWORD */}
          <motion.div variants={itemVariants} className="space-y-2">
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              New password
            </label>

            <motion.div
              variants={inputWrapperVariants}
              initial="idle"
              animate={focusedField === "new" ? "focus" : "idle"}
              className="
                relative rounded-2xl
                border border-black/5 dark:border-white/10
                bg-gray-50 dark:bg-gray-900/60
                shadow-sm
                transition
              "
            >
              {/* left icon container */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <motion.div
                  animate={{
                    rotate: loading ? 8 : 0,
                    scale: focusedField === "new" ? 1.05 : 1,
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
                  <Lock
                    size={18}
                    className="text-gray-500 dark:text-gray-300"
                  />
                </motion.div>
              </div>

              {/* input */}
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type={showNew ? "text" : "password"}
                placeholder="Enter a new password"
                onFocus={() => setFocusedField("new")}
                onBlur={() => setFocusedField(null)}
                className="
                  w-full pl-14 pr-12 py-3 rounded-2xl
                  bg-transparent outline-none
                  text-gray-900 dark:text-white
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  text-sm
                "
              />

              {/* show/hide button */}
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  w-9 h-9 rounded-xl
                  flex items-center justify-center
                  border border-black/5 dark:border-white/10
                  bg-white/70 dark:bg-gray-950/60
                  hover:bg-white dark:hover:bg-gray-950
                  transition
                "
              >
                {showNew ? (
                  <EyeOff size={18} className="text-gray-500 dark:text-gray-300" />
                ) : (
                  <Eye size={18} className="text-gray-500 dark:text-gray-300" />
                )}
              </button>
            </motion.div>

            {/* helper / validation */}
            <AnimatePresence mode="wait">
              {passwordTooShort ? (
                <motion.p
                  key="short"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-rose-600 dark:text-rose-400"
                >
                  Password must be at least 6 characters.
                </motion.p>
              ) : (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-gray-500 dark:text-gray-500"
                >
                  Tip: use a mix of letters, numbers, and symbols.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* CONFIRM PASSWORD */}
          <motion.div variants={itemVariants} className="space-y-2">
            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Confirm password
            </label>

            <motion.div
              variants={inputWrapperVariants}
              initial="idle"
              animate={focusedField === "confirm" ? "focus" : "idle"}
              className="
                relative rounded-2xl
                border border-black/5 dark:border-white/10
                bg-gray-50 dark:bg-gray-900/60
                shadow-sm
                transition
              "
            >
              {/* left icon container */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <motion.div
                  animate={{
                    rotate: loading ? 8 : 0,
                    scale: focusedField === "confirm" ? 1.05 : 1,
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
                  <Lock
                    size={18}
                    className="text-gray-500 dark:text-gray-300"
                  />
                </motion.div>
              </div>

              {/* input */}
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter the password"
                onFocus={() => setFocusedField("confirm")}
                onBlur={() => setFocusedField(null)}
                className="
                  w-full pl-14 pr-12 py-3 rounded-2xl
                  bg-transparent outline-none
                  text-gray-900 dark:text-white
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  text-sm
                "
              />

              {/* show/hide button */}
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  w-9 h-9 rounded-xl
                  flex items-center justify-center
                  border border-black/5 dark:border-white/10
                  bg-white/70 dark:bg-gray-950/60
                  hover:bg-white dark:hover:bg-gray-950
                  transition
                "
              >
                {showConfirm ? (
                  <EyeOff size={18} className="text-gray-500 dark:text-gray-300" />
                ) : (
                  <Eye size={18} className="text-gray-500 dark:text-gray-300" />
                )}
              </button>
            </motion.div>

            {/* match / mismatch helper */}
            <AnimatePresence mode="wait">
              {passwordsMatch ? (
                <motion.div
                  key="match"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400"
                >
                  <CheckCircle2 size={16} />
                  Passwords match.
                </motion.div>
              ) : showMismatchWarning ? (
                <motion.div
                  key="mismatch"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400"
                >
                  <AlertTriangle size={16} />
                  Passwords do not match.
                </motion.div>
              ) : (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-gray-500 dark:text-gray-500"
                >
                  Re-enter the same password to confirm.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* SUBMIT BUTTON */}
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
            {/* moving shine */}
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
                  Reset Password
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
                  Resetting...
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* footer */}
          <motion.div
            variants={itemVariants}
            className="pt-2 text-center text-xs text-gray-500 dark:text-gray-500"
          >
            After reset, you’ll be redirected to the login page.
          </motion.div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
};

export default ResetPassword;