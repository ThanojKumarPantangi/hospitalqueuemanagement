import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { loginApi } from "../../api/auth.api";
// import { jwtDecode } from "jwt-decode";
import {getOrCreateDeviceId} from "../../utils/deviceuuid"
import api from "../../api/axios";
import { showToast } from "../../utils/toastBus";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Activity,
  CheckCircle2,
  Stethoscope,
  Building2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Zap
} from "lucide-react";

/* =========================================
   ANIMATION VARIANTS (extended for richer motion)
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
   UTILITY HOOKS & HELPERS (non-API, purely UI)
   ========================================= */
function useShake(isShaking) {
  // small helper to derive a shake variant when there is an error
  return {
    initial: { x: 0 },
    animate: isShaking
      ? { x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.45 } }
      : { x: 0 }
  };
}

/* =========================================
   SUB-COMPONENTS (UI ELEMENTS) — improved and extended
   ========================================= */

// 1. Dynamic Background with animated orbs + soft grid + subtle SVG highlights
const Background = () => (
  <div className="fixed inset-0 z-0 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,#0f172a_1px,transparent_1px),linear-gradient(#0f172a_1px,transparent_1px)] bg-[size:64px_64px]" />

    {/* Soft animated orbs */}
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

    {/* Center accent orb */}
    <motion.div
      variants={glowVariants}
      initial="initial"
      animate="animate"
      transition={{ delay: 4 }}
      className="absolute left-1/2 top-[40%] translate-x-[-50%] w-[300px] h-[300px] bg-cyan-500/12 rounded-full blur-[80px]"
    />

    {/* Decorative SVG lines for a high-end product feel */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" x2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <rect x="-20" y="-20" width="40" height="40" fill="url(#lg)" />
    </svg>
  </div>
);

// 2. Custom Input Field with animated floating label, focus glow & error shake
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
  label
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

// 3. Stat/Feature Badge for the hero section — now with micro-interaction
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

// 4. Ripple button (visual enhancement) — still preserves type=submit behavior
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
            <span>Processing...</span>
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
   MAIN COMPONENT (kept API logic intact, UI enhanced)
   ========================================= */
const Login = () => {
  // --- STATE MANAGEMENT ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState("LOGIN");
  const [showPass, setShowPass] = useState(false);

  const navigate = useNavigate();

  const { setUser } = useAuth();

  

  // micro-ref for focus
  const emailRef = useRef(null);

  // --- DYNAMIC TEXT ---
  const headerContent = useMemo(
    () => ({
      title: action === "LOGIN" ? "Welcome Back" : "Verify Identity",
      subtitle: action === "LOGIN" ? "Access your secure healthcare dashboard" : "Please enter your credentials to continue"
    }),
    [action]
  );

  useEffect(() => {
    // gently focus email on mount for faster keyboard flow
    if (emailRef.current) setTimeout(() => emailRef.current.focus(), 300);
  }, []);

  // --- LOGIC (API & AUTH) — preserved exactly as requested ---
  const navigateBasedOnRole = (role) => {
    if (role === "ADMIN") navigate("/admin/dashboard");
    else if (role === "DOCTOR") navigate("/doctor/dashboard");
    else navigate("/patient/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (action === "VERIFY_OTP") {
      navigate("/verify-otp", { state: { email } });
      return;
    }

    if (!email || !password) {
      setError("Credentials required");
      return;
    }

    try {
      setLoading(true);

      const deviceId = getOrCreateDeviceId();

      const res = await loginApi(
        {
          email: email.trim(),      // Trim email
          password: password,       // DO NOT trim password
        },
        {
          headers: {
            "x-device-id": deviceId,
          },
        }
      );

      sessionStorage.setItem("mfaEmail",email.trim())

      //MFA Setup Required
      if (res.data?.mfaSetupRequired) {
        sessionStorage.setItem("mfaTempToken", res.data.tempToken);
        navigate("/setup-mfa");
        return;
      }

      //  MFA Verification Required
      if (res.data?.mfaRequired) {
        sessionStorage.setItem("mfaTempToken", res.data.tempToken);
        navigate("/verify-mfa");
        return;
      }

      //  Normal login (PATIENT)
      const meRes = await api.get("/api/auth/me");
      const user = meRes.data;

      setUser(user);
      navigateBasedOnRole(user.role);

    } catch (err) {

      const message =
        err.response?.data?.message || "Authentication failed";

      //  Phone not verified
      if (message === "Phone number not verified") {
        showToast({
          show: true,
          message: "Verification Required",
          type: "info",
        });

        sessionStorage.setItem("otpEmail", email);
        setAction("VERIFY_OTP");
        return;
      }

      //  MFA Locked
      if (
        message.includes("MFA temporarily locked") ||
        message.includes("Too many failed attempts")
      ) {
        showToast({
          show: true,
          message,
          type: "warning",
        });
        setError(message);
        return;
      }

      //  Suspicious login
      if (message.includes("Suspicious login")) {
        showToast({
          show: true,
          message,
          type: "error",
        });
        setError(message);
        return;
      }

      // Generic authentication error
      showToast({
        show: true,
        message,
        type: "error",
      });

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  // compute per-field error messages so inputs can show specific messages
  const emailError = error && !email ? "Email is required" : null;
  const passwordError = error && !password ? "Password is required" : null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative font-sans selection:bg-teal-500/30">
      <Background />

      <div className="container mx-auto px-4 z-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 h-full py-8">
        {/* --- LEFT SIDE: BRANDING & STATS (Hidden on mobile) --- */}
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="hidden lg:flex flex-col gap-8 max-w-lg">
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              Secure Hospital Portal
            </div>

            <motion.h1 variants={itemVariants} className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              Modern Healthcare <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">Management</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-slate-700 dark:text-slate-400 text-lg leading-relaxed">
              Streamline appointments, manage patient records, and access real-time medical insights with our secure role-based platform.
            </motion.p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatBadge icon={Activity} label="System Status" value="99.9% Uptime" delay={0.35} />
            <StatBadge icon={Stethoscope} label="Practitioners" value="250+ Active" delay={0.45} />
            <StatBadge icon={Building2} label="Departments" value="12 Integrated" delay={0.55} />
            <StatBadge icon={CheckCircle2} label="Compliance" value="HIPAA Ready" delay={0.65} />
          </div>
        </motion.div>

        {/* --- RIGHT SIDE: LOGIN FORM --- */}
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
          >
            {/* Gradient Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-500 rounded-3xl opacity-20 blur-xl" />
            
            {/* Main Card */}
            <div className="relative bg-white dark:bg-slate-900 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-2xl">
              {/* Header */}
              <div className="mb-8">
                <motion.div 
                  key={action} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.4 }}
                >
                  <h2 id="login-heading" className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {headerContent.title}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {headerContent.subtitle}
                  </p>
                </motion.div>

                {/* Tip */}
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: 0.2 }} 
                  className="mt-4 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg px-3 py-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Use your institutional email for faster verification</span>
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
                  {/* Email Input */}
                  <CustomInput
                    icon={Mail}
                    type="email"
                    id="email"
                    label="Email Address"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={emailError}
                    disabled={loading}
                    rightElement={
                      email && (
                        <button 
                          onClick={() => { setEmail(''); emailRef.current?.focus(); }} 
                          type="button" 
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5" 
                          aria-label="Clear email"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )
                    }
                  />

                  {/* Password Input */}
                  <CustomInput
                    icon={Lock}
                    type={showPass ? "text" : "password"}
                    id="password"
                    label="Password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={passwordError}
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

                  {/* Forgot Password Link */}
                  <div className="flex items-center justify-end">
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors hover:underline decoration-2 underline-offset-2"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <ActionButton 
                    type="submit" 
                    disabled={loading} 
                    loading={loading} 
                    aria-label={action === "LOGIN" ? "Sign in" : "Proceed to verify"}
                  >
                    <span>{action === "LOGIN" ? "Sign In" : "Proceed to Verify"}</span>
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
                    <span>Fast & Secure</span>
                  </div>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>

                {/* Sign Up Link */}
                <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                  Don&apos;t have an account?{' '}
                  <Link 
                    to="/signup" 
                    className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold hover:underline decoration-2 underline-offset-2 transition-colors"
                  >
                    Create Account
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

export default Login;