import React, { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  Activity,
  Building2,
  Users,
  RefreshCw,
  Zap,
  BadgeCheck
} from "lucide-react";
import Toast from "../../components/ui/Toast";
import { signupApi } from "../../api/auth.api";

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

/* =========================================
   UTILITY HOOKS
   ========================================= */
function useShake(isShaking) {
  return {
    initial: { x: 0 },
    animate: isShaking
      ? { x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.45 } }
      : { x: 0 }
  };
}

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

// Custom Input Field
const CustomInput = ({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  error,
  rightElement,
  disabled,
  id,
  label,
  inputMode
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const reduceMotion = useReducedMotion();
  const shake = useShake(!!error);
  const inputRef = useRef(null);

  return (
    <motion.div variants={itemVariants} className="relative w-full">
      {/* Floating Label */}
      <motion.label
        htmlFor={id}
        initial={false}
        animate={isFocused || value ? { y: -9, x: 0, scale: 0.85 } : { y: 13, x: 40, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`absolute left-0 text-sm font-medium pointer-events-none select-none z-10 px-1 bg-white dark:bg-slate-900 ${
          isFocused ? "text-teal-500" : value ? "text-slate-700 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {label || placeholder}
      </motion.label>

      <motion.div
        className="relative"
        {...(reduceMotion ? {} : shake)}
      >
        {/* Icon */}
        <div className={`absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center transition-colors duration-300 ${
          isFocused ? "text-teal-500" : "text-slate-400 dark:text-slate-500"
        }`}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder=""
          disabled={disabled}
          inputMode={inputMode}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full bg-white dark:bg-slate-900 border-2 rounded-xl py-3.5 pl-12 pr-12 text-slate-900 dark:text-slate-100 transition-all duration-300 outline-none disabled:opacity-50 disabled:cursor-not-allowed font-medium
            ${error 
              ? "border-red-400 dark:border-red-500 focus:border-red-500 dark:focus:border-red-400 ring-2 ring-red-100 dark:ring-red-900/30" 
              : isFocused
                ? "border-teal-500 dark:border-teal-400 ring-2 ring-teal-100 dark:ring-teal-900/30"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
        />

        {/* Right Element */}
        {rightElement && (
          <div className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            id={`${id}-error`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-2 ml-1"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Password Strength Indicator
const PasswordStrength = ({ password }) => {
  const strength = useMemo(() => {
    if (!password) return { label: "Enter a password", value: 0 };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { label: "Weak", value: 25 };
    if (score === 2) return { label: "Okay", value: 50 };
    if (score === 3) return { label: "Strong", value: 75 };
    return { label: "Very strong", value: 100 };
  }, [password]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-3"
    >
      <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
        <span>Password strength</span>
        <span className="text-slate-900 dark:text-white font-semibold">{strength.label}</span>
      </div>

      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${strength.value}%` }}
          transition={{ duration: 0.35 }}
          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
        />
      </div>

      <div className="mt-2 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>Use at least 8 characters with uppercase, numbers & symbols</span>
      </div>
    </motion.div>
  );
};

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
            <span>Creating account...</span>
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
const Signup = () => {
  // --- STATE MANAGEMENT (PRESERVED FROM ORIGINAL) ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [showPass, setShowPass] = useState(false);
  const [shake, setShake] = useState(false);

  const navigate = useNavigate();

  // Phone validation helper
  const phoneLooksValid = useMemo(() => {
    if (!phone) return false;
    return /^\d{10}$/.test(phone.trim());
  }, [phone]);

  // --- SUBMIT HANDLER (PRESERVED EXACTLY) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !phone) {
      setError("All fields are required");
      setToast({ show: true, message: "All fields are required", type: "error" });
      setShake(true);
      setTimeout(() => setShake(false), 260);
      return;
    }

    if (!phone.trim()) {
      e.phone = "Phone is required";
      setToast({ show: true, message: "Phone is required", type: "error" });

      setShake(true);
      setTimeout(() => setShake(false), 260);
      return;
    } else if (!/^\d{10}$/.test(phone.trim())) {
      e.phone = "Enter a valid 10-digit phone number";
      setToast({
        show: true,
        message: "Enter a valid 10-digit phone number",
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);

      // ✅ Keep your API logic same
      await signupApi({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
      });

      setToast({ show: true, message: "Signup successful", type: "success" });

      sessionStorage.setItem("otpEmail", email);
      navigate("/verify-otp", { state: { phone, email } });
    } catch (err) {
      const message = err.response?.data?.message || "Signup failed";
      setError(message);
      setToast({ show: true, message, type: "error" });

      setShake(true);
      setTimeout(() => setShake(false), 260);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative font-sans selection:bg-teal-500/30">
      <Background />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast({ ...toast, show: false })}
            />
          </div>
        )}
      </AnimatePresence>

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
              Patient Registration Portal
            </div>

            <motion.h1 variants={itemVariants} className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              Join Our Healthcare <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Community</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-slate-700 dark:text-slate-400 text-lg leading-relaxed">
              Create your account to access appointments, medical records, and connect with healthcare professionals securely.
            </motion.p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatBadge icon={BadgeCheck} label="OTP Verified" value="Secure Access" delay={0.35} />
            <StatBadge icon={Activity} label="Instant Setup" value="Quick & Easy" delay={0.45} />
            <StatBadge icon={Users} label="Active Users" value="10,000+" delay={0.55} />
            <StatBadge icon={Building2} label="Departments" value="12 Available" delay={0.65} />
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
                <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  OTP Verification Required
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  We&apos;ll send an OTP to your phone number after signup to confirm your identity and protect your account.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* --- RIGHT SIDE: SIGNUP FORM --- */}
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
            {...useShake(shake)}
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
                    Create Your Account
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Register to continue and verify your phone via OTP
                  </p>
                </motion.div>

                {/* Info Tip */}
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: 0.2 }} 
                  className="mt-4 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg px-3 py-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>OTP will be required after signup</span>
                </motion.div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <motion.div 
                  variants={containerVariants} 
                  initial="hidden" 
                  animate="visible" 
                  className="space-y-5"
                >
                  {/* Name Input */}
                  <CustomInput
                    icon={User}
                    type="text"
                    id="name"
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    rightElement={
                      name && !loading && (
                        <button 
                          onClick={() => setName("")} 
                          type="button" 
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5" 
                          aria-label="Clear name"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )
                    }
                  />

                  {/* Email Input */}
                  <CustomInput
                    icon={Mail}
                    type="email"
                    id="email"
                    label="Email Address"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    disabled={loading}
                  />

                  {/* Phone Input */}
                  <CustomInput
                    icon={Phone}
                    type="tel"
                    id="phone"
                    label="Phone Number"
                    placeholder="9876543210"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                    disabled={loading}
                    rightElement={
                      phone.length > 0 ? (
                        phoneLooksValid ? (
                          <div className="text-emerald-500 dark:text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="text-red-500 dark:text-red-400">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                        )
                      ) : null
                    }
                  />

                  {/* Password Input */}
                  <div>
                    <CustomInput
                      icon={Lock}
                      type={showPass ? "text" : "password"}
                      id="password"
                      label="Password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5"
                          aria-label={showPass ? "Hide password" : "Show password"}
                        >
                          {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      }
                    />
                    {password && <PasswordStrength password={password} />}
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

                  {/* Submit Button */}
                  <ActionButton 
                    type="submit" 
                    disabled={loading} 
                    loading={loading}
                  >
                    <span>Sign Up</span>
                  </ActionButton>
                </motion.div>
              </form>

              {/* Footer */}
              <div className="mt-8 space-y-4">
                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Secure & Protected</span>
                  </div>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>

                {/* Login Link */}
                <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold hover:underline decoration-2 underline-offset-2 transition-colors"
                  >
                    Log In
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;