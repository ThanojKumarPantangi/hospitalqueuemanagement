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
} from "lucide-react";
import Toast from "../../components/ui/Toast";
import {doctorSignupApi} from "../../api/auth.api"

/* =========================
   ANIMATIONS
========================= */
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

const leftPanelVariants = {
  hidden: { opacity: 0, x: -30, scale: 0.98 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 220, damping: 24 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 240, damping: 22 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 + i * 0.05, duration: 0.25 },
  }),
};

const shakeVariants = {
  hidden: { x: 0 },
  visible: {
    x: [0, -4, 4, -3, 3, 0],
    transition: { duration: 0.25 },
  },
};

/* =========================
   SMALL UI PARTS
========================= */
const Field = ({
  icon: Icon,
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  error,
  rightSlot,
}) => {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>

      <div
        className={`flex items-center gap-2 rounded-2xl px-3.5 py-3 border transition shadow-sm
        ${
          error
            ? "border-rose-300 ring-2 ring-rose-500/15 bg-rose-50/40 dark:bg-rose-900/10"
            : "border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300"
        }`}
      >
        <div
          className={`p-2 rounded-xl border transition
          ${
            error
              ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-900/30 dark:text-rose-300"
              : "bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>

        <input
          value={value}
          onChange={onChange}
          type={type}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400"
        />

        {rightSlot}
      </div>

      <AnimatePresence>
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const MiniBadge = ({ icon: Icon, text }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/10 border border-white/15 text-white text-xs font-bold backdrop-blur-md">
      <Icon className="w-4 h-4 opacity-90" />
      {text}
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
    <div className="mt-2">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
        <span>Password strength</span>
        <span className="text-slate-700 dark:text-slate-200">{label}</span>
      </div>

      <div className="mt-2 grid grid-cols-5 gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition
            ${
              i < score
                ? "bg-blue-600 dark:bg-blue-500"
                : "bg-slate-200 dark:bg-slate-800"
            }`}
          />
        ))}
      </div>
    </div>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const res=await doctorSignupApi?.({
        email: form.email.trim(),
        doctorRollNo: form.doctorRollNo.trim(),
        phone: form.phone.trim(),
        password: form.password.trim(),
      });
      setToast({
        show: true,
        message: res?.data?.message ||"Account created successfully",
        type: "success",
      });
      setForm({
        email: "",
        doctorRollNo: "",
        phone: "",
        password: "",
      });
      setErrors({});
    } 
    catch (err) {
      setToast({
        show: true,
        message: err?.response?.data?.message ||"Something went wrong",
        type: "error",
      });
      setErrors({
        email: err?.response?.data?.message ||"Something went wrong",
      });
      setShake(true);
      setTimeout(() => setShake(false), 260);
    }
    finally {
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
            className="min-h-screen bg-slate-50 dark:bg-slate-950"
        >
            {/* Background blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-24 left-1/4 w-[420px] h-[420px] bg-blue-200/50 dark:bg-blue-900/15 rounded-full blur-3xl" />
                <div className="absolute top-24 right-1/4 w-[420px] h-[420px] bg-purple-200/50 dark:bg-purple-900/15 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 md:py-14">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* LEFT BRAND PANEL */}
                <motion.div
                    variants={leftPanelVariants}
                    initial="hidden"
                    animate="visible"
                    className="hidden lg:flex rounded-[34px] overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-2xl"
                >
                    <div className="relative w-full p-10 flex flex-col justify-between">
                    {/* Glow */}
                    <div className="absolute inset-0 opacity-35">
                        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/25 rounded-full blur-3xl" />
                        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                    </div>

                    <div className="relative">
                        <div className="inline-flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg">
                            <Stethoscope className="w-6 h-6 text-white" />
                        </div>
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
                        Manage OPD schedule, profile details and token workflow with a
                        secure doctor account.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2">
                        <MiniBadge icon={ShieldCheck} text="Secure Signup" />
                        <MiniBadge icon={CheckCircle2} text="Verified Access" />
                        <MiniBadge icon={Sparkles} text="Smooth Experience" />
                        </div>
                    </div>

                    <div className="relative rounded-3xl bg-white/10 border border-white/15 backdrop-blur-md p-6">
                        <p className="text-white text-sm font-bold">
                        Tip: Use your official hospital roll number
                        </p>
                        <p className="mt-2 text-white/80 text-xs leading-relaxed">
                        After signup, your account will be reviewed by admin for
                        verification. Once verified, you can start receiving tokens.
                        </p>
                    </div>
                    </div>
                </motion.div>

                {/* RIGHT FORM CARD */}
                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full"
                >
                    <motion.div
                    variants={shake ? shakeVariants : {}}
                    initial="hidden"
                    animate="visible"
                    className="rounded-[34px] border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-xl p-6 md:p-8"
                    >
                    {/* Mobile header */}
                    <div className="lg:hidden mb-6">
                        <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-white">
                            Doctor Signup
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                            Create your account to continue
                            </p>
                        </div>
                        </div>
                    </div>

                    {/* Desktop header */}
                    <div className="hidden lg:block">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                        Create Doctor Account
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Enter your details to register as a doctor.
                        </p>
                    </div>

                    <motion.form
                        onSubmit={handleSubmit}
                        className="mt-6 space-y-4"
                    >
                        <motion.div variants={itemVariants} custom={0}>
                        <Field
                            icon={Mail}
                            label="Email"
                            placeholder="doctor@example.com"
                            value={form.email}
                            onChange={(e) =>
                            setForm((p) => ({ ...p, email: e.target.value }))
                            }
                            error={errors.email}
                        />
                        </motion.div>

                        <motion.div variants={itemVariants} custom={1}>
                        <Field
                            icon={Hash}
                            label="Doctor Roll No"
                            placeholder="DOC123"
                            value={form.doctorRollNo}
                            onChange={(e) =>
                            setForm((p) => ({ ...p, doctorRollNo: e.target.value }))
                            }
                            error={errors.doctorRollNo}
                        />
                        </motion.div>

                        <motion.div variants={itemVariants} custom={2}>
                        <Field
                            icon={Phone}
                            label="Phone"
                            placeholder="9876543210"
                            value={form.phone}
                            onChange={(e) =>
                            setForm((p) => ({ ...p, phone: e.target.value }))
                            }
                            error={errors.phone}
                        />
                        </motion.div>

                        <motion.div variants={itemVariants} custom={3}>
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
                            rightSlot={
                            <button
                                type="button"
                                onClick={() => setShowPass((p) => !p)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
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
                        </motion.div>

                        <motion.div variants={itemVariants} custom={4} className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-500/25 transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating Account...
                            </>
                            ) : (
                            "Create Account"
                            )}
                        </button>

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

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                            By continuing, you agree to the hospital terms & privacy
                            policy.
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
