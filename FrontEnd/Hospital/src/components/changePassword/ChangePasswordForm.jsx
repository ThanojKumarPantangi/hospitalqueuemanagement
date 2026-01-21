import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {changePasswordControllerApi} from "../../api/auth.api"

import { showToast } from "../../utils/toastBus";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 70, damping: 18 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35 } },
};

const shakeVariants = {
  initial: { x: 0 },
  shake: {
    x: [0, -6, 6, -5, 5, -3, 3, 0],
    transition: { duration: 0.35 },
  },
};

function getStrengthScore(pwd) {
  if (!pwd) return 0;

  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  return Math.min(score, 5);
}

function strengthLabel(score) {
  if (score <= 1) return "Weak";
  if (score === 2) return "Okay";
  if (score === 3) return "Good";
  if (score === 4) return "Strong";
  return "Very Strong";
}

const Rule = ({ ok, text }) => (
  <div className="flex items-center gap-2 text-xs">
    {ok ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    ) : (
      <AlertCircle className="h-4 w-4 text-gray-400" />
    )}
    <span className={cn("text-gray-600 dark:text-gray-300", ok && "font-semibold")}>
      {text}
    </span>
  </div>
);

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
  right,
  error,
}) => {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <div
        className={cn(
          "group flex items-center gap-2 rounded-2xl border bg-white/80 px-4 py-3 shadow-sm backdrop-blur transition",
          "border-gray-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10",
          "dark:border-white/10 dark:bg-white/5 dark:focus-within:ring-indigo-400/10",
          error && "border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/10"
        )}
      >
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-300">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}

        <input
          value={value}
          onChange={onChange}
          type={type}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
        />

        {right}
      </div>

      <AnimatePresence>
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs font-medium text-rose-600 dark:text-rose-400"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default function ChangePasswordUI() {

  const navigate = useNavigate();
  const [passwordChanged, setPasswordChanged] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitAttempt, setSubmitAttempt] = useState(0);

  const strength = useMemo(() => getStrengthScore(newPassword), [newPassword]);
  const strengthText = useMemo(() => strengthLabel(strength), [strength]);

  const rules = useMemo(() => {
    return {
      min8: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /\d/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    };
  }, [newPassword]);

  const errors = useMemo(() => {
    const e = {};
    if (submitAttempt > 0) {
      if (!oldPassword) e.oldPassword = "Old password is required";
      if (!newPassword) e.newPassword = "New password is required";
      if (!confirmNewPassword) e.confirmNewPassword = "Confirm your new password";

      if (newPassword && newPassword.length < 8) {
        e.newPassword = "New password must be at least 8 characters";
      }

      if (newPassword && oldPassword && newPassword === oldPassword) {
        e.newPassword = "New password should be different from old password";
      }

      if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
        e.confirmNewPassword = "Passwords do not match";
      }
    }
    return e;
  }, [oldPassword, newPassword, confirmNewPassword, submitAttempt]);

  const isValid = useMemo(() => {
    if (!oldPassword || !newPassword || !confirmNewPassword) return false;
    if (newPassword.length < 8) return false;
    if (newPassword !== confirmNewPassword) return false;
    if (newPassword === oldPassword) return false;
    return true;
  }, [oldPassword, newPassword, confirmNewPassword]);

  const strengthWidth = useMemo(() => {
    return `${(strength / 5) * 100}%`;
  }, [strength]);

  const strengthColorClass = useMemo(() => {
    if (strength <= 1) return "bg-rose-500";
    if (strength === 2) return "bg-amber-500";
    if (strength === 3) return "bg-blue-500";
    if (strength === 4) return "bg-emerald-500";
    return "bg-indigo-500";
  }, [strength]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempt((x) => x + 1);

    if (!isValid) return;

    try {
      setLoading(true);

      const res=await changePasswordControllerApi({oldPassword, newPassword});

      showToast({ type: "success", message:res?.data?.message || "Password changed. Login again." });
      setPasswordChanged(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSubmitAttempt(0);
    } catch (err) {
      showToast({
        type: "error",
        message: err?.response?.data?.message || "Failed to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = !isValid && submitAttempt > 0;

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#F8FAFC] p-4 dark:bg-[#07090F] sm:p-8"
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          variants={cardVariants}
          className="mb-6 flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Change Password
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update your password securely. You will be logged out from all devices.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/60 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
              <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Security Settings
            </div>
          </div>
        </motion.div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Form */}
          <motion.div
            variants={cardVariants}
            className="lg:col-span-3 rounded-3xl border border-gray-200 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5"
          >
            <motion.form
              onSubmit={handleSubmit}
              variants={shakeVariants}
              animate={triggerShake ? "shake" : "initial"}
              className="space-y-5"
            >
              <Field
                label="Old Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter old password"
                type={showOld ? "text" : "password"}
                icon={Lock}
                error={errors.oldPassword}
                right={
                  <button
                    type="button"
                    onClick={() => setShowOld((v) => !v)}
                    className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                    title={showOld ? "Hide" : "Show"}
                  >
                    {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <Field
                label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                type={showNew ? "text" : "password"}
                icon={Lock}
                error={errors.newPassword}
                right={
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                    title={showNew ? "Hide" : "Show"}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <Field
                label="Confirm New Password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                type={showConfirm ? "text" : "password"}
                icon={Lock}
                error={errors.confirmNewPassword}
                right={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                    title={showConfirm ? "Hide" : "Show"}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || passwordChanged}
                  className={cn(
                    "w-full rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-lg transition",
                    "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  )}
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </span>
                </button>

                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Tip: Use a strong password with letters, numbers, and symbols.
                </p>
              </div>
              <AnimatePresence>
                {passwordChanged && (
                    <motion.button
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => navigate("/login")}
                    className="mt-4 w-full rounded-2xl px-4 py-3 text-sm font-bold text-indigo-700 shadow-lg transition
                                bg-indigo-100 hover:bg-indigo-200 active:scale-[0.99]
                                dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                    >
                    Go to Login
                    </motion.button>
                )}
              </AnimatePresence>

            </motion.form>
          </motion.div>

          {/* Right side: Strength + Rules */}
          <motion.div
            variants={cardVariants}
            className="lg:col-span-2 rounded-3xl border border-gray-200 bg-white/70 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                  Password Strength
                </h3>
              </div>

              <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                {strengthText}
              </span>
            </div>

            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                <motion.div
                  className={cn("h-full rounded-full", strengthColorClass)}
                  initial={{ width: "0%" }}
                  animate={{ width: strengthWidth }}
                  transition={{ type: "spring", stiffness: 70, damping: 18 }}
                />
              </div>

              <div className="mt-5 space-y-2">
                <Rule ok={rules.min8} text="At least 8 characters" />
                <Rule ok={rules.upper} text="Contains an uppercase letter (A-Z)" />
                <Rule ok={rules.lower} text="Contains a lowercase letter (a-z)" />
                <Rule ok={rules.number} text="Contains a number (0-9)" />
                <Rule ok={rules.special} text="Contains a special character (!@#...)" />
              </div>

              <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-gray-500 dark:text-gray-300" />
                  <p>
                    After changing password, your server will revoke refresh tokens and log you
                    out everywhere. User must login again.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}