import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sendotp, verifyotp } from "../../api/auth.api";
import Toast from "../../components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Clock,
  ArrowRight,
  RefreshCcw,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

/* =========================
   ANIMATIONS
========================= */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

const contentVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [0, -5, 5, -4, 4, -3, 3, 0],
    transition: { duration: 0.22 },
  },
};

const floatSlow = {
  animate: {
    y: [0, -12, 0],
    x: [0, 8, 0],
    transition: { duration: 8, repeat: Infinity, ease: "easeInOut" },
  },
};

const floatSlower = {
  animate: {
    y: [0, 14, 0],
    x: [0, -10, 0],
    transition: { duration: 10, repeat: Infinity, ease: "easeInOut" },
  },
};

const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.985 },
};

/* =========================
   HELPERS
========================= */
const clampDigits = (val) => String(val || "").replace(/[^\d]/g, "");
const maskEmail = (email) => {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  if (name.length <= 2) return `${name[0] || ""}*@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
};

function OtpVerify() {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Email is the ONLY identity and display source
  const email = location.state?.email || sessionStorage.getItem("otpEmail");

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ FIX: timer should NOT start until OTP is successfully sent
  const [timer, setTimer] = useState(0);

  const [sending, setSending] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [shake, setShake] = useState(false);

  const inputRefs = useRef([]);
  const didSendOnce = useRef(false);
  const sendingRef = useRef(false);

  // ✅ canResend only when timer is 0 AND not sending
  const canResend = timer === 0 && !sending;

  const finalOtp = useMemo(() => otp.join(""), [otp]);
  const otpFilledCount = useMemo(
    () => otp.filter((d) => d !== "").length,
    [otp]
  );

  const resendProgress = useMemo(() => {
    // 0% when timer=300, 100% when timer=0
    const total = 300;
    if (timer <= 0) return 100;
    const pct = Math.round(((total - timer) / total) * 100);
    return Math.min(100, Math.max(0, pct));
  }, [timer]);

  const timerLabel = useMemo(() => {
    if (timer <= 0) return "Ready";
    return `${timer}s`;
  }, [timer]);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    // ✅ only run countdown when timer is > 0
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  /* ---------------- SEND OTP ---------------- */
  const triggerOtp = useCallback(async () => {
    if (!email || sendingRef.current) return;

    try {
      setError("");
      sendingRef.current = true;
      setSending(true);

      await sendotp({ email });

      setToast({
        show: true,
        message: "OTP sent successfully!",
        type: "success",
      });

      // ✅ FIX: start timer ONLY after successful send
      setTimer(300);
    } catch (err) {
      const msg = err.response?.data?.message || "Try again after some time";
      setError(msg);
      setToast({ show: true, message: msg, type: "error" });

      // optional: keep timer 0 so resend stays available if send failed
      setTimer(0);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [email]);

  /* ---------------- VERIFY OTP ---------------- */
  const verifyOtp = async () => {
    if (finalOtp.length !== 6) {
      setError("Please enter all 6 digits");
      setShake(true);
      setTimeout(() => setShake(false), 260);
      return;
    }

    try {
      setLoading(true);

      await verifyotp({
        email,
        otp: finalOtp,
      });

      setToast({
        show: true,
        message: "OTP verified successfully!",
        type: "success",
      });

      // Cleanup session storage
      sessionStorage.removeItem("otpEmail");

      navigate("/login");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Invalid OTP. Please try again.";
      setError(msg);
      setToast({ show: true, message: msg, type: "error" });

      setShake(true);
      setTimeout(() => setShake(false), 260);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- INITIAL OTP (ONCE) ---------------- */
  useEffect(() => {
    if (!email) {
      setError("Email not provided");
      return;
    }

    if (didSendOnce.current) return;
    didSendOnce.current = true;

    triggerOtp();
  }, [email, triggerOtp]);

  /* ---------------- OTP INPUT HANDLERS ---------------- */
  const handleChange = (element, index) => {
    const value = clampDigits(element.value);
    if (!value) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      verifyOtp();
    }
  };

  const handlePaste = (e) => {
    const pasted = clampDigits(e.clipboardData.getData("text")).slice(0, 6);
    if (!pasted) return;

    e.preventDefault();

    const next = new Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);

    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  /* ---------------- UI ---------------- */
  return (
    <>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Background */}
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen relative overflow-hidden bg-[#060B16]"
      >
        {/* Aurora layers */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.20),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(168,85,247,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/75" />

        {/* Floating blobs */}
        <motion.div
          {...floatSlow}
          className="absolute -top-24 -left-24 w-[380px] h-[380px] rounded-full bg-teal-500/12 blur-3xl"
        />
        <motion.div
          {...floatSlower}
          className="absolute -bottom-28 -right-28 w-[420px] h-[420px] rounded-full bg-indigo-500/12 blur-3xl"
        />

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-10">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="
              w-full max-w-lg
              rounded-[36px]
              bg-white/5
              border border-white/10
              backdrop-blur-2xl
              shadow-[0_30px_90px_rgba(0,0,0,0.70)]
              overflow-hidden
              relative
            "
          >
            {/* subtle card glow */}
            <motion.div
              animate={{ opacity: [0.2, 0.35, 0.2] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="
                absolute inset-0 pointer-events-none
                bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.16),transparent_55%)]
              "
            />

            {/* Header */}
            <div className="relative px-7 pt-8 pb-6 border-b border-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-purple-500/10" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-white/50">
                    OTP Verification
                  </p>

                  <h1 className="mt-2 text-2xl font-black text-white tracking-tight">
                    Security Check
                  </h1>

                  <p className="mt-2 text-sm text-white/60 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-teal-300" />
                    Code sent to{" "}
                    <span className="font-black text-white/85">
                      {maskEmail(email)}
                    </span>
                  </p>

                  <div
                    className="
                      mt-3 inline-flex items-center gap-2
                      px-3 py-1.5 rounded-2xl
                      bg-white/5 border border-white/10
                      text-xs font-bold text-white/70
                    "
                  >
                    <Sparkles className="w-4 h-4 text-teal-300" />
                    Enter the 6-digit OTP to verify
                  </div>
                </div>

                <motion.div
                  whileHover={{ rotate: 2, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
                >
                  <ShieldCheck className="w-6 h-6 text-teal-300" />
                </motion.div>
              </div>

              {/* Mini progress */}
              <div className="relative mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-white/70 font-semibold">
                    <Clock className="w-4 h-4 text-white/50" />
                    {canResend ? "You can resend now" : "Resend cooldown"}
                  </div>

                  <span className="text-white/70 font-bold">{timerLabel}</span>
                </div>

                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden border border-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${resendProgress}%` }}
                    transition={{ duration: 0.35 }}
                    className="h-full bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400"
                  />
                </div>

                <div className="mt-2 text-[11px] text-white/50 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" />
                  Timer starts only after OTP is successfully sent.
                </div>
              </div>
            </div>

            {/* Body */}
            <motion.form
              onSubmit={(e) => {
                e.preventDefault();
                verifyOtp();
              }}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="px-7 py-7 space-y-5 relative"
            >
              {/* OTP inputs */}
              <motion.div variants={itemVariants}>
                <motion.div
                  variants={shakeVariants}
                  animate={shake ? "shake" : "idle"}
                  className="grid grid-cols-6 gap-2 sm:gap-3"
                  onPaste={handlePaste}
                >
                  {otp.map((data, index) => (
                    <motion.input
                      key={index}
                      whileFocus={{ scale: 1.04 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      ref={(el) => (inputRefs.current[index] = el)}
                      value={data}
                      onChange={(e) => handleChange(e.target, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      disabled={loading}
                      className="
                        h-12 sm:h-14 w-full
                        rounded-2xl
                        text-center text-xl font-black
                        bg-white/5 text-white
                        border border-white/10
                        focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10
                        outline-none transition
                        disabled:opacity-60 disabled:cursor-not-allowed
                      "
                    />
                  ))}
                </motion.div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-white/50 font-semibold">
                    Filled:{" "}
                    <span className="text-white/75 font-black">
                      {otpFilledCount}/6
                    </span>
                  </span>

                  <span className="text-white/50 font-semibold">
                    Tip: Paste OTP directly
                    <Sparkles className="inline-block ml-2 w-3.5 h-3.5 text-teal-300" />
                  </span>
                </div>
              </motion.div>

              <AnimatePresence>
                {error ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="
                      rounded-2xl border border-rose-500/20
                      bg-rose-500/10 px-4 py-3
                      text-xs font-semibold text-rose-200
                      flex items-start gap-2
                    "
                  >
                    <AlertTriangle className="w-4 h-4 mt-0.5 text-rose-300" />
                    <span>{error}</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Verify button */}
              <motion.div variants={itemVariants} className="pt-1">
                <motion.button
                  variants={buttonVariants}
                  initial="idle"
                  whileHover={!loading ? "hover" : "idle"}
                  whileTap={!loading ? "tap" : "idle"}
                  disabled={loading}
                  className="
                    w-full rounded-2xl py-3.5
                    bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400
                    text-sm font-black text-[#041018]
                    shadow-[0_18px_50px_rgba(20,184,166,0.25)]
                    disabled:opacity-70 disabled:cursor-not-allowed
                    transition relative overflow-hidden
                  "
                >
                  {/* shine */}
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
                    {loading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-center gap-2 relative"
                      >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="verify"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-center gap-2 relative"
                      >
                        VERIFY ACCOUNT <ArrowRight className="w-4 h-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>

              {/* Resend */}
              <motion.div variants={itemVariants} className="pt-1">
                <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
                  <p className="text-xs text-white/60 font-semibold">
                    Didn&apos;t receive the code?
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <motion.button
                      type="button"
                      onClick={triggerOtp}
                      disabled={!canResend}
                      whileHover={{ scale: canResend ? 1.02 : 1 }}
                      whileTap={{ scale: canResend ? 0.98 : 1 }}
                      className={`
                        inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl
                        text-xs font-black
                        border transition
                        ${
                          canResend
                            ? "bg-white/5 text-teal-200 border-white/15 hover:bg-white/10"
                            : "bg-white/5 text-white/30 border-white/10 cursor-not-allowed"
                        }
                      `}
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="w-4 h-4" />
                          Resend Code
                        </>
                      )}
                    </motion.button>

                    <span className="text-xs font-bold text-white/50">
                      {canResend ? "Ready now" : `Resend in ${timer}s`}
                    </span>
                  </div>

                  <div className="mt-3 text-[11px] text-white/45 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" />
                    Resend button unlocks only after cooldown ends.
                  </div>
                </div>
              </motion.div>

              {/* Back to login */}
              <motion.div variants={itemVariants} className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-xs font-black text-teal-300 hover:text-teal-200 transition"
                >
                  Back to Login
                </button>
              </motion.div>
            </motion.form>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

export default OtpVerify;