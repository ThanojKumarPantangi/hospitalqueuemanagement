import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Mail,
  Hash,
  Phone,
  Lock,
  Stethoscope,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  BadgeCheck,
  AlertTriangle,
  Info,
  ArrowRight,
} from "lucide-react";
import Toast from "../../components/ui/Toast";
import { doctorSignupApi } from "../../api/auth.api";

/* =========================
   ANIMATIONS
========================= */
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.35, ease: "easeOut", when: "beforeChildren" },
  },
};

const bgFadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

const leftPanelVariants = {
  hidden: { opacity: 0, x: -36, scale: 0.985 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 220, damping: 24 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 250, damping: 22 },
  },
};

const contentVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.06 } },
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
    transition: { duration: 0.24 },
  },
};

const floatSlow = {
  animate: {
    y: [0, -12, 0],
    x: [0, 10, 0],
    transition: { duration: 9, repeat: Infinity, ease: "easeInOut" },
  },
};

const floatSlower = {
  animate: {
    y: [0, 14, 0],
    x: [0, -12, 0],
    transition: { duration: 11, repeat: Infinity, ease: "easeInOut" },
  },
};

const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.985 },
};

/* =========================
   SMALL UI PARTS
========================= */
const MiniBadge = ({ icon: Icon, text }) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 18 }}
      className="
        inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl
        bg-white/10 border border-white/15
        text-white text-xs font-extrabold
        backdrop-blur-md
      "
    >
      <Icon className="w-4 h-4 opacity-90" />
      {text}
    </motion.div>
  );
};

const DividerLine = () => {
  return (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
  );
};

const SkeletonField = () => {
  return (
    <div className="relative overflow-hidden h-[54px] rounded-2xl bg-white/8 border border-white/10">
      <motion.div
        initial={{ x: "-120%" }}
        animate={{ x: "120%" }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.12),transparent)]"
      />
    </div>
  );
};

const Field = ({
  icon: Icon,
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  error,
  rightSlot,
  inputMode,
  disabled,
}) => {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-extrabold uppercase tracking-wider text-white/55">
        {label}
      </label>

      <motion.div
        whileHover={{ y: -1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`
          flex items-center gap-2 rounded-2xl px-3.5 py-3
          border transition shadow-sm
          ${
            error
              ? "border-rose-500/30 ring-2 ring-rose-500/15 bg-rose-500/10"
              : "border-white/10 bg-white/5 focus-within:ring-4 focus-within:ring-teal-400/10 focus-within:border-teal-400/40"
          }
        `}
      >
        <div
          className={`
            p-2 rounded-xl border transition
            ${
              error
                ? "bg-rose-500/10 border-rose-500/25 text-rose-200"
                : "bg-white/5 border-white/10 text-white/70"
            }
          `}
        >
          <Icon className="w-4 h-4" />
        </div>

        <input
          value={value}
          onChange={onChange}
          type={type}
          placeholder={placeholder}
          inputMode={inputMode}
          disabled={disabled}
          className="
            w-full bg-transparent outline-none text-sm font-semibold
            text-white placeholder:text-white/35
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        />

        {rightSlot ? <div className="ml-1">{rightSlot}</div> : null}
      </motion.div>

      <AnimatePresence>
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs font-semibold text-rose-300 flex items-center gap-2"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const PasswordStrength = ({ password }) => {
  const score = useMemo(() => {
    let s = 0;
    if (!password) return 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(5, s);
  }, [password]);

  const label =
    score <= 1
      ? "Weak"
      : score === 2
      ? "Okay"
      : score === 3
      ? "Good"
      : score === 4
      ? "Strong"
      : "Very Strong";

  return (
    <motion.div variants={itemVariants} className="mt-2">
      <div className="flex items-center justify-between text-[11px] font-bold text-white/55">
        <span>Password strength</span>
        <span className="text-white/80">{label}</span>
      </div>

      <div className="mt-2 grid grid-cols-5 gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className={`
              h-1.5 rounded-full transition
              ${i < score ? "bg-teal-400" : "bg-white/10"}
            `}
          />
        ))}
      </div>

      <div className="mt-2 text-[11px] text-white/45 flex items-center gap-2">
        <Info className="w-3.5 h-3.5" />
        Use uppercase + numbers + symbols for stronger security.
      </div>
    </motion.div>
  );
};

/* =========================
   MAIN PAGE
========================= */
const DoctorSignup = () => {
  const [form, setForm] = useState({
    email: "",
    doctorRollNo: "",
    phone: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // ------------------ VALIDATION (DO NOT TOUCH LOGIC) ------------------
  const validate = () => {
    const e = {};

    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Enter a valid email address";

    if (!form.doctorRollNo.trim()) e.doctorRollNo = "Doctor Roll No is required";
    else if (form.doctorRollNo.trim().length < 3)
      e.doctorRollNo = "Enter a valid roll number";

    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^\d{10}$/.test(form.phone.trim()))
      e.phone = "Enter a valid 10-digit phone number";

    if (!form.password.trim()) e.password = "Password is required";
    else if (form.password.length < 6)
      e.password = "Password must be at least 6 characters";

    setErrors(e);

    const ok = Object.keys(e).length === 0;
    if (!ok) {
      setShake(true);
      setTimeout(() => setShake(false), 260);
    }
    return ok;
  };

  // ------------------ SUBMIT (DO NOT TOUCH LOGIC) ------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await doctorSignupApi?.({
        email: form.email.trim(),
        doctorRollNo: form.doctorRollNo.trim(),
        phone: form.phone.trim(),
        password: form.password.trim(),
      });

      setToast({
        show: true,
        message: res?.data?.message || "Account created successfully",
        type: "success",
      });

      setForm({
        email: "",
        doctorRollNo: "",
        phone: "",
        password: "",
      });

      setErrors({});
    } catch (err) {
      setToast({
        show: true,
        message: err?.response?.data?.message || "Something went wrong",
        type: "error",
      });

      setErrors({
        email: err?.response?.data?.message || "Something went wrong",
      });

      setShake(true);
      setTimeout(() => setShake(false), 260);
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

      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen relative overflow-hidden bg-[#060B16]"
      >
        {/* BACKGROUND */}
        <motion.div
          variants={bgFadeVariants}
          initial="hidden"
          animate="visible"
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.20),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.16),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(168,85,247,0.14),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/75" />
        </motion.div>

        {/* floating blobs */}
        <motion.div
          {...floatSlow}
          className="absolute -top-24 -left-24 w-[380px] h-[380px] rounded-full bg-teal-500/12 blur-3xl"
        />
        <motion.div
          {...floatSlower}
          className="absolute -bottom-28 -right-28 w-[420px] h-[420px] rounded-full bg-indigo-500/12 blur-3xl"
        />

        {/* CONTENT */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* LEFT BRAND PANEL */}
            <motion.div
              variants={leftPanelVariants}
              initial="hidden"
              animate="visible"
              className="
                hidden lg:flex rounded-[36px] overflow-hidden
                border border-white/10
                shadow-[0_40px_120px_rgba(0,0,0,0.65)]
              "
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
                      <motion.div
                        whileHover={{ rotate: 2, scale: 1.03 }}
                        transition={{ type: "spring", stiffness: 300, damping: 18 }}
                        className="
                          w-12 h-12 rounded-2xl
                          bg-white/15 border border-white/20
                          flex items-center justify-center shadow-lg
                        "
                      >
                        <Stethoscope className="w-6 h-6 text-white" />
                      </motion.div>

                      <div className="text-white">
                        <p className="text-xs font-extrabold uppercase tracking-wider opacity-90">
                          Hospital Portal
                        </p>
                        <h2 className="text-2xl font-black tracking-tight">
                          Doctor Account
                        </h2>
                      </div>
                    </div>

                    <p className="mt-6 text-white/90 text-sm leading-relaxed max-w-md">
                      Manage OPD schedule, profile details, and token workflow with a
                      secure doctor account.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <MiniBadge icon={ShieldCheck} text="Secure Signup" />
                      <MiniBadge icon={BadgeCheck} text="Admin Approval" />
                      <MiniBadge icon={Sparkles} text="Smooth Experience" />
                    </div>
                  </div>

                  <div className="relative rounded-3xl bg-white/10 border border-white/15 backdrop-blur-md p-6">
                    <p className="text-white text-sm font-black">
                      Tip: Use your official hospital roll number
                    </p>

                    <p className="mt-2 text-white/80 text-xs leading-relaxed">
                      After signup, your account will be reviewed by admin for verification.
                      Once verified, you can start receiving tokens.
                    </p>

                    <div className="mt-4">
                      <DividerLine />
                      <div className="mt-3 flex items-center gap-2 text-white/85 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified doctors can accept tokens and update queue status
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT FORM CARD */}
            <motion.div variants={cardVariants} initial="hidden" animate="visible">
              <motion.div
                variants={shakeVariants}
                animate={shake ? "shake" : "idle"}
                className="
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
                        Doctor Registration
                      </p>

                      <h1 className="mt-2 text-2xl font-black text-white tracking-tight">
                        Create Doctor Account
                      </h1>

                      <p className="mt-1 text-sm text-white/60">
                        Enter your details to register as a doctor.
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
                        Admin verification required after signup
                      </div>
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
                      <SkeletonField />
                    ) : (
                      <Field
                        icon={Mail}
                        label="Email"
                        placeholder="doctor@example.com"
                        value={form.email}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, email: e.target.value }))
                        }
                        error={errors.email}
                        disabled={loading}
                      />
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    {loading ? (
                      <SkeletonField />
                    ) : (
                      <Field
                        icon={Hash}
                        label="Doctor Roll No"
                        placeholder="DOC123"
                        value={form.doctorRollNo}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            doctorRollNo: e.target.value,
                          }))
                        }
                        error={errors.doctorRollNo}
                        disabled={loading}
                      />
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    {loading ? (
                      <SkeletonField />
                    ) : (
                      <Field
                        icon={Phone}
                        label="Phone"
                        placeholder="9876543210"
                        value={form.phone}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, phone: e.target.value }))
                        }
                        error={errors.phone}
                        disabled={loading}
                      />
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    {loading ? (
                      <SkeletonField />
                    ) : (
                      <>
                        <Field
                          icon={Lock}
                          label="Password"
                          placeholder="••••••••"
                          type={showPass ? "text" : "password"}
                          value={form.password}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, password: e.target.value }))
                          }
                          error={errors.password}
                          disabled={loading}
                          rightSlot={
                            <button
                              type="button"
                              onClick={() => setShowPass((p) => !p)}
                              className="
                                p-2 rounded-xl text-white/60 hover:text-white transition
                                hover:bg-white/5
                              "
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
                        <PasswordStrength password={form.password} />
                      </>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants} className="pt-2">
                    <motion.button
                      variants={buttonVariants}
                      initial="idle"
                      whileHover={!loading ? "hover" : "idle"}
                      whileTap={!loading ? "tap" : "idle"}
                      type="submit"
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
                            Creating Account...
                          </motion.span>
                        ) : (
                          <motion.span
                            key="idle"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-center gap-2 relative"
                          >
                            Create Account <ArrowRight className="w-4 h-4" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <div className="mt-5 text-center">
                      <p className="text-xs text-white/60">
                        Already have an account?{" "}
                        <Link
                          to="/login"
                          className="font-black text-teal-300 hover:text-teal-200 transition"
                        >
                          Log in
                        </Link>
                      </p>
                    </div>

                    <p className="text-xs text-white/45 mt-4 text-center">
                      By continuing, you agree to the hospital terms & privacy policy.
                    </p>
                  </motion.div>
                </motion.form>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default DoctorSignup;