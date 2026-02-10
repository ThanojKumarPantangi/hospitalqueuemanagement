import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sendotp, verifyotp } from "../../api/auth.api";
import Toast from "../../components/ui/Toast";
import { showToast } from "../../utils/toastBus";
import { motion, AnimatePresence} from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Clock,
  ArrowRight,
  RefreshCcw,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  Activity,
  Building2,
  Users,
  Zap,
  Lock
} from "lucide-react";

/* =========================================
   ANIMATION VARIANTS
   ========================================= */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { y: 18, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 120, damping: 14 }
  }
};

const glowVariants = {
  initial: { opacity: 0.55, scale: 0.9 },
  animate: {
    opacity: [0.3, 0.85, 0.3],
    scale: [0.95, 1.12, 0.95],
    transition: { duration: 10, repeat: Infinity, ease: "easeInOut" }
  }
};

const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.45 }
  }
};

/* =========================================
   UTILITY FUNCTIONS
   ========================================= */
const clampDigits = (val) => String(val || "").replace(/[^\d]/g, "");
const maskEmail = (email) => {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  if (name.length <= 2) return `${name[0] || ""}*@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
};

/* =========================================
   SUB-COMPONENTS
   ========================================= */

// Background Component
const Background = () => (
  <div className="fixed inset-0 z-0 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,#0f172a_1px,transparent_1px),linear-gradient(#0f172a_1px,transparent_1px)] bg-[size:64px_64px]" />

    <motion.div
      variants={glowVariants}
      initial="initial"
      animate="animate"
      className="absolute -left-24 -top-24 w-[520px] h-[520px] bg-gradient-to-br from-cyan-500/20 to-teal-400/10 rounded-full blur-[120px]"
    />

    <motion.div
      variants={glowVariants}
      initial="initial"
      animate="animate"
      transition={{ delay: 2 }}
      className="absolute -right-24 -bottom-24 w-[520px] h-[520px] bg-gradient-to-br from-indigo-600/18 to-purple-600/10 rounded-full blur-[120px]"
    />

    <motion.div
      variants={glowVariants}
      initial="initial"
      animate="animate"
      transition={{ delay: 4 }}
      className="absolute left-1/2 top-[40%] translate-x-[-50%] w-[300px] h-[300px] bg-cyan-500/12 rounded-full blur-[80px]"
    />
  </div>
);

// Stat Badge
const StatBadge = ({ icon: Icon, label, value, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.45, type: "spring", stiffness: 120 }}
    whileHover={{ scale: 1.03, translateY: -4 }}
    className="flex items-center gap-3 bg-white/6 dark:bg-white/4 backdrop-blur-md border border-white/8 dark:border-white/6 p-3 rounded-2xl w-fit"
  >
    <div className="p-2 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-lg">
      <Icon className="w-5 h-5 text-teal-400" />
    </div>
    <div>
      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-slate-900 dark:text-white font-bold">{value}</p>
    </div>
  </motion.div>
);

// Action Button
const ActionButton = ({ children, loading, ...rest }) => {
  return (
    <motion.button
      whileHover={!loading ? { scale: 1.01, y: -2 } : {}}
      whileTap={!loading ? { scale: 0.99 } : {}}
      {...rest}
      className={`w-full relative overflow-hidden h-14 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group ${rest.className || ""}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />

      <span className="relative flex items-center justify-center gap-2.5">
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {children}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </>
        )}
      </span>
    </motion.button>
  );
};

/* =========================================
   MAIN COMPONENT
   ========================================= */
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
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

      showToast({
        show: true,
        message: "OTP sent successfully!",
        type: "success",
      });

      // ✅ FIX: start timer ONLY after successful send
      setTimer(300);
    } catch (err) {
      const msg = err.response?.data?.message || "Try again after some time";
      setError(msg);
      showToast({ show: true, message: msg, type: "error" });

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

      showToast({
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
      showToast({ show: true, message: msg, type: "error" });

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

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative font-sans selection:bg-teal-500/30">
      <Background />

      <div className="container mx-auto px-4 z-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 h-full py-8">
        {/* --- LEFT SIDE: BRANDING & STATS --- */}
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={containerVariants} 
          className="hidden lg:flex flex-col gap-8 max-w-lg"
        >
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              Secure Verification
            </div>

            <motion.h1 variants={itemVariants} className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              Verify Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Identity</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-slate-700 dark:text-slate-400 text-lg leading-relaxed">
              We&apos;ve sent a 6-digit verification code to your email. Enter it below to complete your registration and secure your account.
            </motion.p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatBadge icon={Lock} label="Encryption" value="Bank-Grade" delay={0.35} />
            <StatBadge icon={Activity} label="Verification" value="Real-time" delay={0.45} />
            <StatBadge icon={Users} label="Protected" value="100% Secure" delay={0.55} />
            <StatBadge icon={Building2} label="Compliance" value="HIPAA Ready" delay={0.65} />
          </div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/10 dark:to-cyan-900/10 border border-teal-200 dark:border-teal-800/30 rounded-2xl p-6"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-teal-500/10 rounded-lg">
                <Info className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Quick Tip
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  You can paste the entire OTP code at once. The code is valid for 5 minutes and you can request a new one if needed.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* --- RIGHT SIDE: OTP FORM --- */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[480px]"
        >
          <motion.div 
            className="relative"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
            variants={shakeVariants}
            animate={shake ? "shake" : "idle"}
          >
            {/* Gradient Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500 rounded-3xl opacity-20 blur-xl" />
            
            {/* Main Card */}
            <div className="relative bg-white dark:bg-slate-900 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl">
              {/* Header */}
              <div className="mb-8">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.4 }}
                >
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Verify Your Email
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Enter the 6-digit code sent to your email
                  </p>
                </motion.div>

                {/* Email Display */}
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: 0.2 }} 
                  className="mt-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5"
                >
                  <Mail className="w-4 h-4 text-teal-500" />
                  <span className="font-medium">{maskEmail(email)}</span>
                </motion.div>
              </div>

              {/* Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyOtp();
                }} 
                className="space-y-6" 
                noValidate
              >
                <motion.div 
                  variants={containerVariants} 
                  initial="hidden" 
                  animate="visible" 
                  className="space-y-5"
                >
                  {/* OTP Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Verification Code
                    </label>
                    
                    <div 
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
                          className={`
                            h-12 sm:h-14 w-full
                            rounded-xl
                            text-center text-xl sm:text-2xl font-bold
                            bg-white dark:bg-slate-900
                            text-slate-900 dark:text-white
                            border-2 transition-all duration-300 outline-none
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${data 
                              ? "border-teal-500 dark:border-teal-400 ring-2 ring-teal-100 dark:ring-teal-900/30" 
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                            }
                            focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/30
                          `}
                        />
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Filled: <span className="font-semibold text-slate-700 dark:text-slate-300">{otpFilledCount}/6</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Paste code directly
                      </span>
                    </div>
                  </div>

                  {/* Timer Progress */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">
                          {canResend ? "Ready to resend" : "Resend cooldown"}
                        </span>
                      </div>
                      <span className="font-bold text-teal-600 dark:text-teal-400">{timerLabel}</span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${resendProgress}%` }}
                        transition={{ duration: 0.35 }}
                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      Timer starts after OTP is sent successfully
                    </p>
                  </div>

                  {/* Error Display */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-xs text-red-600 dark:text-red-400"
                      >
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="font-medium">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Verify Button */}
                  <ActionButton 
                    type="submit" 
                    disabled={loading} 
                    loading={loading}
                  >
                    <span>{loading ? "Verifying..." : "Verify Account"}</span>
                  </ActionButton>

                  {/* Resend Section */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      Didn&apos;t receive the code?
                    </p>

                    <div className="flex items-center justify-between gap-3">
                      <motion.button
                        type="button"
                        onClick={triggerOtp}
                        disabled={!canResend}
                        whileHover={{ scale: canResend ? 1.02 : 1 }}
                        whileTap={{ scale: canResend ? 0.98 : 1 }}
                        className={`
                          inline-flex items-center gap-2 px-4 py-2.5 rounded-lg
                          text-sm font-semibold transition-all
                          ${canResend
                            ? "bg-teal-500 hover:bg-teal-600 text-white shadow-md hover:shadow-lg"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
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

                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {canResend ? "Available now" : `Wait ${timer}s`}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                      Resend unlocks after cooldown ends
                    </p>
                  </div>
                </motion.div>
              </form>

              {/* Footer */}
              <div className="mt-8 space-y-4">
                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Secure Verification</span>
                  </div>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>

                {/* Back to Login */}
                <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold hover:underline decoration-2 underline-offset-2 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default OtpVerify;