import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldOff,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Bell,
  Loader2,
  Circle,
  Activity,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";

import SessionCard from "../../components/session/SessionCard";
import LogoutAllButton from "../../components/session/LogoutAllButton";
import Toast from "../../components/ui/Toast";
import Navbar from "../../components/Navbar/PatientNavbar";
import { Link } from "react-router-dom";
import AsyncMotionButton from "../../components/buttonmotion/AsyncMotionButton";

// APIs (keep your existing endpoints)
import {
  getMySessionApi,
  getSecurityEventsApi,
  markSecurityEventAsReadApi,
  markAllSecurityEventsAsReadApi,
} from "../../api/session.api";
import { toggleTwoStepControllerApi } from "../../api/auth.api";

/* -------------------------------------------------------------------------- */
/*                             Constants & Variants                            */
/* -------------------------------------------------------------------------- */

const TABS = {
  SESSIONS: "sessions",
  ACTIVITY: "activity",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

/* -------------------------------------------------------------------------- */
/*                               Premium Loader                                */
/* -------------------------------------------------------------------------- */
/* Inline, non-blocking loader used by both tabs so layout doesn't jump.     */
function PremiumLoader({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="absolute inset-0 rounded-full border-t-2 border-b-2 border-emerald-500/70"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="absolute inset-2 rounded-full border-l-2 border-r-2 border-blue-500/70"
        />
        <ShieldCheck className="w-6 h-6 text-gray-700 dark:text-gray-300 animate-pulse" />
      </div>

      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mt-6 text-sm text-gray-500 dark:text-gray-400 font-medium"
      >
        {text}
      </motion.p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            SessionSecurityTab                               */
/* -------------------------------------------------------------------------- */
function SessionSecurityTab() {
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

  // Toggle two-step verification
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
      const message = err?.response?.data?.message || err?.message || "Verification failed";
      setPasswordError(message);
      return false;
    } finally {
      setTwoStepLoading(false);
    }
  };

  // Handler used by top button; shows modal if disabling
  const handleToggleClick = () => {
    if (twoStepEnabled) {
      setShowDisableConfirm(true);
    } else {
      toggleTwoStep();
    }
  };

  // Fetch sessions + two-step initial state
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);

        const res = await getMySessionApi();

        setSessions(res?.data?.sessions || []);
        setCurrentSessionId(res?.data?.currentSessionId || "");
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

  // Inline loader (non-blocking)
  if (loading) {
    return <PremiumLoader text="Loading secure sessions..." />;
  }

  return (
    <>
      {/* toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="min-h-[40vh]">
        <main className="max-w-5xl mx-auto space-y-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left side */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="text-emerald-500 w-8 h-8" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security & Sessions</h2>
              </div>

              <p className="text-gray-500 dark:text-gray-400">
                Manage your active sessions and log out of devices you don&apos;t recognize.
              </p>
            </div>

            {/* Right side buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <AsyncMotionButton
                onClick={handleToggleClick}
                loading={twoStepLoading}
                loadingText="Updating..."
                icon={twoStepEnabled ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition duration-200 shadow-sm w-full sm:w-auto ${
                  twoStepEnabled
                    ? "bg-red-600/10 border border-red-500/20 text-red-600 hover:bg-red-600/20"
                    : "bg-emerald-600/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-600/20"
                }`}
              >
                {twoStepEnabled ? "Disable Two-Step" : "Enable Two-Step"}
              </AsyncMotionButton>

              <Link
                to="/patient/change-password"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-200 shadow-sm w-full sm:w-auto"
              >
                🔒 Change Password
              </Link>
            </div>
          </motion.div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {sessions?.map((session) => (
                <motion.div key={session._id} variants={itemVariants} initial="hidden" animate="visible" exit="exit" layout>
                  <SessionCard
                    session={session}
                    isCurrent={session._id === currentSessionId}
                    onLogout={() => setSessions((prev) => prev.filter((s) => s._id !== session._id))}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800">
            {/* Keep LogoutAllButton visually consistent with other actions */}
            <div className="w-full md:w-auto">
              <LogoutAllButton className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm w-full md:w-auto" />
            </div>
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
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative w-full max-w-md rounded-3xl border border-red-500/20 bg-gradient-to-b from-gray-900 to-gray-950 p-7 md:p-8 shadow-2xl"
            >
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-60" />

              <div className="flex items-start gap-3">
                <motion.div initial={{ rotate: -10 }} animate={{ rotate: 0 }} className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </motion.div>

                <div>
                  <h3 className="text-lg font-semibold text-white">Disable Two-Step Verification</h3>
                  <p className="text-red-300 text-sm mt-1">This will reduce your account security.</p>
                </div>
              </div>

              <p className="text-gray-400 text-sm mt-5 mb-4">Enter your password to confirm this sensitive action.</p>

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
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {passwordError && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm mt-2">
                  {passwordError}
                </motion.p>
              )}

              <p className="text-xs text-gray-500 mt-2">Required to protect your account from unauthorized changes.</p>

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

/* -------------------------------------------------------------------------- */
/*                            SecurityActivityTab                              */
/* -------------------------------------------------------------------------- */
function SecurityActivityTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSecurityEventsApi();
      setEvents(res.data.events || res.data || []);
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleMarkAsRead = async (id) => {
    try {
      // Optimistic UI update
      setEvents((prev) => prev.map((event) => (event._id === id ? { ...event, isRead: true } : event)));
      await markSecurityEventAsReadApi(id);
    } catch (err) {
      console.error("Failed to mark as read", err);
      // revert by refetch
      fetchEvents();
    }
  };

  const handleMarkAll = async () => {
    try {
      setMarkingAll(true);
      await markAllSecurityEventsAsReadApi();
      setEvents((prev) => prev.map((e) => ({ ...e, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = events.filter((e) => !e.isRead).length;

  if (loading) {
    return <PremiumLoader text="Analyzing activity logs..." />;
  }

  return (
    <div className="min-h-[40vh]">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Security Activity</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Recent account and login activity</p>
              </div>
            </div>

            {unreadCount > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkAll}
                disabled={markingAll}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-sm disabled:opacity-70"
              >
                {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Mark all read
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Content */}
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <Bell className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No security activity found</p>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
            <AnimatePresence mode="popLayout">
              {events.map((event) => (
                <motion.div key={event._id} variants={itemVariants} layout whileHover={{ y: -2 }} className={`p-5 rounded-2xl border transition-all duration-200 shadow-sm ${event.isRead ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800" : "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50"}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-4">
                      <div className={`mt-1 p-2.5 rounded-xl transition-colors duration-200 ${event.isRead ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" : "bg-blue-600 dark:bg-blue-500 text-white shadow-sm"}`}>
                        {event.isRead ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                      </div>

                      <div>
                        <p className={`font-medium text-base transition-colors duration-200 ${event.isRead ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-gray-100"}`}>
                          {event.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{event.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2.5 font-medium">{new Date(event.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
                      </div>
                    </div>

                    {!event.isRead && (
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleMarkAsRead(event._id)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 shrink-0">
                        Mark read
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Parent SecuritySection                        */
/* -------------------------------------------------------------------------- */
export default function SecuritySection() {
  const [activeTab, setActiveTab] = useState(TABS.SESSIONS);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 pb-12">
      <Navbar activePage="Security" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header and Small Box Tab Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Security</h1>
            <p className="text-sm text-gray-500 mt-1">Manage account security settings and review activity.</p>
          </div>

          <div className="inline-flex bg-gray-200/60 dark:bg-gray-800/60 rounded-xl p-1 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab(TABS.SESSIONS)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === TABS.SESSIONS ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
            >
              Sessions & Settings
            </button>

            <button
              onClick={() => setActiveTab(TABS.ACTIVITY)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === TABS.ACTIVITY ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
            >
              Activity
            </button>
          </div>
        </div>

        {/* Tab contents with smooth scale/fade animation */}
        <div>
          <AnimatePresence mode="wait">
            {activeTab === TABS.SESSIONS && (
              <motion.div key="sessions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24 }}>
                <SessionSecurityTab />
              </motion.div>
            )}

            {activeTab === TABS.ACTIVITY && (
              <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.24 }}>
                <SecurityActivityTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}