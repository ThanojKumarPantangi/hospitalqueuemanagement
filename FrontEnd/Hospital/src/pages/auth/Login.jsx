import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { loginApi } from "../../api/auth.api";
import { jwtDecode } from "jwt-decode";
import Toast from "../../components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Stethoscope,
  ShieldAlert,
} from "lucide-react";

/* =========================
   ANIMATIONS
========================= */
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

const panelVariants = {
  hidden: { opacity: 0, x: -30, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 220, damping: 24 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

const contentVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
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
  hidden: { x: 0 },
  visible: {
    x: [0, -4, 4, -3, 3, 0],
    transition: { duration: 0.22 },
  },
};

/* =========================
   SMALL UI PARTS
========================= */
const MiniChip = ({ icon: Icon, children }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/10 border border-white/15 text-white text-xs font-bold backdrop-blur-md">
      <Icon className="w-4 h-4 opacity-90" />
      {children}
    </div>
  );
};

const Field = ({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  disabled,
  rightSlot,
}) => {
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/5 border border-white/10 text-white/70">
        <Icon className="w-4 h-4" />
      </div>

      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="
          w-full rounded-2xl pl-12 pr-12 py-3.5 text-sm font-semibold
          bg-white/5 text-white placeholder-white/40
          border border-white/10
          focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10
          outline-none transition
          disabled:opacity-60 disabled:cursor-not-allowed
        "
      />

      {rightSlot ? (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightSlot}
        </div>
      ) : null}
    </div>
  );
};

/* =========================
   MAIN COMPONENT
========================= */
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [action, setAction] = useState("LOGIN");
  const [showPass, setShowPass] = useState(false);
  const [shake, setShake] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const navigateBasedOnRole = (role) => {
    if (role === "ADMIN") navigate("/admin/dashboard");
    else if (role === "DOCTOR") navigate("/doctor/dashboard");
    else navigate("/patient/dashboard");
  };

  const headerTitle = useMemo(() => {
    return action === "LOGIN" ? "Welcome Back" : "Verify OTP";
  }, [action]);

  const headerDesc = useMemo(() => {
    return action === "LOGIN"
      ? "Sign in to access your hospital portal"
      : "Continue to verify your phone number";
  }, [action]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (action === "VERIFY_OTP") {
      navigate("/verify-otp", { state: { email } });
      return;
    }

    if (!email || !password) {
      setError("Email and password are required");
      setToast({
        show: true,
        message: "Email and password are required",
        type: "error",
      });

      setShake(true);
      setTimeout(() => setShake(false), 260);
      return;
    }

    try {
      setLoading(true);
      const res = await loginApi({ 
        email: email.trim(), 
        password: password.trim(), 
     });
      const { accessToken } = res.data;

      login(accessToken);
      const decoded = jwtDecode(accessToken);
      navigateBasedOnRole(decoded.role);
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setToast({ show: true, message, type: "error" });

      if (message === "Phone number not verified") {
        sessionStorage.setItem("otpEmail", email);
        setAction("VERIFY_OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* BACKGROUND */}
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen relative overflow-hidden "
      >
        {/* Gradient layers */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(168,85,247,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />

        {/* Floating blobs */}
        <motion.div
          animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-24 w-[380px] h-[380px] rounded-full bg-teal-500/10 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 14, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-28 -right-28 w-[420px] h-[420px] rounded-full bg-indigo-500/10 blur-3xl"
        />

        {/* CONTENT */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-7 items-stretch">
            {/* LEFT PANEL (DESKTOP) */}
            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              className="hidden lg:flex rounded-[36px] overflow-hidden border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.65)]"
            >
              <div className="relative w-full p-10 bg-gradient-to-br from-teal-500/95 via-indigo-500/90 to-purple-500/90">
                {/* glow */}
                <div className="absolute inset-0 opacity-35">
                  <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/20 blur-3xl rounded-full" />
                  <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 blur-3xl rounded-full" />
                </div>

                <div className="relative h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg">
                        <Stethoscope className="w-6 h-6 text-white" />
                      </div>

                      <div className="text-white">
                        <p className="text-xs font-extrabold uppercase tracking-wider opacity-90">
                          Hospital Portal
                        </p>
                        <h2 className="text-2xl font-black tracking-tight">
                          Secure Login
                        </h2>
                      </div>
                    </div>

                    <p className="mt-6 text-white/90 text-sm leading-relaxed max-w-md">
                      Sign in to manage doctor schedules, token flow, and patient
                      queue operations with secure access.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <MiniChip icon={ShieldCheck}>Protected Access</MiniChip>
                      <MiniChip icon={Sparkles}>Smooth Experience</MiniChip>
                      <MiniChip icon={ShieldAlert}>OTP Safety</MiniChip>
                    </div>
                  </div>

                  <div className="relative rounded-3xl bg-white/10 border border-white/15 backdrop-blur-md p-6">
                    <p className="text-white text-sm font-black">
                      Admin + Doctor + Patient dashboards
                    </p>
                    <p className="mt-2 text-white/80 text-xs leading-relaxed">
                      Your role is detected automatically after login and you’ll
                      be redirected to the correct dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT CARD */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="w-full flex items-center"
            >
              <motion.div
                variants={shake ? shakeVariants : {}}
                initial="hidden"
                animate="visible"
                className="
                  w-full
                  rounded-[36px]
                  bg-white/5
                  border border-white/10
                  backdrop-blur-2xl
                  shadow-[0_30px_90px_rgba(0,0,0,0.70)]
                  overflow-hidden
                "
              >
                {/* TOP STRIP */}
                <div className="relative px-7 pt-8 pb-6 border-b border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-purple-500/10" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-white/50">
                        Authentication
                      </p>
                      <h1 className="mt-2 text-2xl font-black text-white tracking-tight">
                        {headerTitle}
                      </h1>
                      <p className="mt-1 text-sm text-white/60">{headerDesc}</p>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-teal-300" />
                    </div>
                  </div>
                </div>

                {/* FORM */}
                <motion.form
                  onSubmit={handleSubmit}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  className="px-7 py-7 space-y-4"
                >
                  <motion.div variants={itemVariants}>
                    {loading ? (
                      <div className="h-[52px] rounded-2xl bg-white/10 animate-pulse" />
                    ) : (
                      <Field
                        icon={Mail}
                        type="email"
                        placeholder="Email address"
                        value={email}
                        disabled={loading}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    {loading ? (
                      <div className="h-[52px] rounded-2xl bg-white/10 animate-pulse" />
                    ) : (
                      <Field
                        icon={Lock}
                        type={showPass ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        disabled={loading}
                        onChange={(e) => setPassword(e.target.value)}
                        rightSlot={
                          <button
                            type="button"
                            onClick={() => setShowPass((p) => !p)}
                            className="p-2 rounded-xl text-white/60 hover:text-white transition"
                            aria-label="Toggle password"
                          >
                            {showPass ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        }
                      />
                    )}
                  </motion.div>

                  <AnimatePresence>
                    {error ? (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-200"
                      >
                        {error}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <motion.div variants={itemVariants} className="pt-1">
                    <motion.button
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                      disabled={loading}
                      className="
                        w-full rounded-2xl py-3.5
                        bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400
                        text-sm font-black text-[#041018]
                        shadow-[0_18px_50px_rgba(20,184,166,0.25)]
                        disabled:opacity-70 disabled:cursor-not-allowed
                        transition
                      "
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Signing in...
                        </span>
                      ) : action === "LOGIN" ? (
                        <span className="flex items-center justify-center gap-2">
                          LOG IN <ArrowRight className="h-4 w-4" />
                        </span>
                      ) : (
                        "VERIFY OTP"
                      )}
                    </motion.button>

                    {/* quick actions */}
                    <div className="mt-5 flex items-center justify-between">
                      <button
                        type="button"
                        className="text-xs font-bold text-teal-300 hover:text-teal-200 transition"
                      >
                        Forgot password?
                      </button>

                      <p className="text-xs text-white/60">
                        New here?{" "}
                        <Link
                          to="/signup"
                          className="font-black text-teal-300 hover:text-teal-200 transition"
                        >
                          Create Account
                        </Link>
                      </p>
                    </div>
                  </motion.div>
                </motion.form>

                {/* BOTTOM STRIP */}
                <div className="px-7 pb-7">
                  <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
                    <p className="text-[11px] text-white/50 font-semibold">
                      By continuing, you agree to the hospital security policy.
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      OTP verification may be required for unverified phone
                      numbers.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default Login;