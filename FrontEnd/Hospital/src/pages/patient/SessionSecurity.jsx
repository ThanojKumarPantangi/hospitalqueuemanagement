import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldOff,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import SessionCard from "../../components/session/SessionCard";
import LogoutAllButton from "../../components/session/LogoutAllButton";
import Loader from "../../components/animation/Loader";
import Toast from "../../components/ui/Toast";
import Navbar from "../../components/Navbar/PatientNavbar";
import { Link } from "react-router-dom";
import AsyncMotionButton from "../../components/buttonmotion/AsyncMotionButton";
import { getMySessionApi } from "../../api/session.api";
import { toggleTwoStepControllerApi } from "../../api/auth.api";

export default function SessionSecurity() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [loading, setLoading] = useState(true); // page-level fetch
  const [twoStepEnabled, setTwoStepEnabled] = useState(false);
  const [toast, setToast] = useState(null);
  const [twoStepLoading, setTwoStepLoading] = useState(false); // toggle-specific loading
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  
  const toggleTwoStep = async (pwd = null) => {
    if (twoStepLoading) return false;

    try {
      setTwoStepLoading(true);
      setPasswordError("");

    
      const payload = pwd != null ? { password: pwd } : undefined;
      const res = await toggleTwoStepControllerApi(payload);

      const enabled = res?.data?.enabled ?? false;

      setTwoStepEnabled(Boolean(enabled));

      setToast({
        type: "success",
        message: enabled
          ? "Two-Step Verification enabled"
          : "Two-Step Verification disabled",
      });

      setPassword("");
      return true;
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Verification failed";

      setPasswordError(message);
      return false;
    } finally {
      setTwoStepLoading(false);
    }
  };

  const handleToggleClick = () => {
    if (twoStepEnabled) {
      // ask for confirmation before disabling
      setShowDisableConfirm(true);
    } else {
      // enable directly
      toggleTwoStep();
    }
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);

        const res = await getMySessionApi();

        // sessions + current id
        setSessions(res?.data?.sessions || []);
        setCurrentSessionId(res?.data?.currentSessionId || "");

        // initialize two-step state if backend provides it (defensive)
        const initialTwoStep = res?.data?.twoStepEnabled ?? false;
        setTwoStepEnabled(Boolean(initialTwoStep));
      } catch (error) {
        console.error("Failed to fetch sessions", error);
        setToast({
          type: "error",
          message: error?.response?.data?.message || "Failed to fetch sessions",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#212121]/80 backdrop-blur-sm">
        <Loader />
      </div>
    );
  }

  return (
    <>
      {/* Notifications */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 p-4 md:p-6 space-y-8 pb-24">
        <Navbar activePage="Security" />

        <main className="max-w-5xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            {/* Left side */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="text-emerald-500 w-8 h-8" />
                <h2 className="text-2xl font-bold text-white">Security & Sessions</h2>
              </div>

              <p className="text-gray-400">
                Manage your active sessions and log out of devices you don&apos;t recognize.
              </p>
            </div>

            {/* Right side buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Two-Step Verification Toggle (uses AsyncMotionButton) */}
              <AsyncMotionButton
                onClick={handleToggleClick}
                loading={twoStepLoading}
                loadingText="Updating..."
                icon={twoStepEnabled ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                className={`
                  inline-flex items-center justify-center gap-2
                  px-4 py-2 rounded-xl
                  text-sm font-semibold
                  transition duration-200 shadow-sm
                  w-full sm:w-auto
                  ${
                    twoStepEnabled
                      ? "bg-red-600/20 border border-red-500/30 text-red-300 hover:bg-red-600/30"
                      : "bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30"
                  }
                `}
              >
                {twoStepEnabled ? "Disable Two-Step" : "Enable Two-Step"}
              </AsyncMotionButton>

              {/* Change Password */}
              <Link
                to="/patient/change-password"
                className="
                  inline-flex items-center justify-center gap-2
                  px-4 py-2 rounded-xl
                  bg-gray-900/60 border border-gray-700
                  text-sm font-semibold text-teal-300
                  hover:bg-gray-900 hover:border-teal-400/40 hover:text-teal-200
                  transition duration-200
                  shadow-sm
                  w-full sm:w-auto
                "
              >
                🔒 Change Password
              </Link>
            </div>
          </motion.div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {sessions?.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  isCurrent={session._id === currentSessionId}
                  onLogout={() => setSessions((prev) => prev.filter((s) => s._id !== session._id))}
                />
              ))}
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 pt-6 border-t border-gray-800"
          >
            <LogoutAllButton />
          </motion.div>
        </main>
      </div>

      {/* Disable confirmation modal */}
      <AnimatePresence>
        {showDisableConfirm && (
          <motion.div
            onClick={() => !twoStepLoading && setShowDisableConfirm(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative w-full max-w-md rounded-3xl border border-red-500/20 bg-gradient-to-b from-gray-900 to-gray-950 p-7 md:p-8 shadow-2xl"
            >
              {/* glowing top accent */}
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-60" />

              {/* header */}
              <div className="flex items-start gap-3">
                <motion.div
                  initial={{ rotate: -15, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="p-2.5 rounded-xl bg-red-500/10 text-red-400"
                >
                  <AlertTriangle className="w-5 h-5" />
                </motion.div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Disable Two-Step Verification
                  </h3>
                  <p className="text-red-300 text-sm mt-1">
                    This will reduce your account security.
                  </p>
                </div>
              </div>

              <p className="text-gray-400 text-sm mt-5 mb-4">
                Enter your password to confirm this sensitive action.
              </p>

              {/* password input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  autoFocus
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && password.trim() && !twoStepLoading) {
                      toggleTwoStep(password).then((success) => {
                        if (success) setShowDisableConfirm(false);
                      });
                    }
                  }}
                  className="w-full rounded-xl bg-gray-800/80 border border-gray-700 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 pr-10 transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {passwordError && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm mt-2"
                >
                  {passwordError}
                </motion.p>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Required to protect your account from unauthorized changes.
              </p>

              {/* actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    if (twoStepLoading) return;
                    setShowDisableConfirm(false);
                    setPassword("");
                    setPasswordError("");
                    setShowPassword(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition"
                >
                  Cancel
                </button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={!password.trim() || twoStepLoading}
                  onClick={async () => {
                    const success = await toggleTwoStep(password.trim());
                    if (success) {
                      setShowDisableConfirm(false);
                      setShowPassword(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50 transition shadow-lg shadow-red-900/30"
                >
                  {twoStepLoading ? "Verifying..." : "Disable"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}