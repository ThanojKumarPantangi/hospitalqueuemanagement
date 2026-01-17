import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Volume2,
  UserMinus,
  Clock,
  ClipboardList,
  CheckCircle2,
  Search,
  History,
  AlertTriangle,
  UserCheck,
  Calendar,
  ChevronRight,
  Pill,
  User,
  Sparkles,
  ShieldCheck,
  Activity,
  BadgeCheck,
} from "lucide-react";
import Navbar from "../../components/Navbar/DoctorNavbar";
import "./queue.css";
import Toast from "../../components/ui/Toast";
import {
  callNextPatientApi,
  completeCurrentTokenApi,
  skipCurrentTokenApi,
  patientProfileApi,
  getDoctorQueueSummary,
} from "../../api/doctor.api";
import VisitRecordModal from "../../components/visit/VisitModal";
import VisitDetailsModal from "../../components/visit/VisitDetailsModal";
import { getDoctorPatientVisitsApi, createVisitApi } from "../../api/visit.api";
import AsyncMotionButton from "../../components/buttonmotion/AsyncMotionButton";
import PatientProfile from "../../components/patientProfile(Doc,Adm)/patientProfileModal";

const DoctorQueue = () => {
  const [queue, setQueue] = useState({
    totalToday: 0,
    completed: 0,
    remaining: 0,
    nextWaiting: [],
  });

  const [toast, setToast] = useState(null);

  const [view, setView] = useState("check");
  const [searchTerm, setSearchTerm] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

  const [open, setOpen] = useState(false);
  const [patient, setPatient] = useState(null);

  // UI-only enhancements (no API logic change)
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  // Button animation
  const [loading, setLoading] = useState({
    next: false,
    complete: false,
    skip: false,
    addVisit: false,
    patientProfile: false,
  });

  const withLoading = async (key, fn) => {
    if (loading[key]) return;

    try {
      setLoading((s) => ({ ...s, [key]: true }));
      await fn();
    } finally {
      setLoading((s) => ({ ...s, [key]: false }));
    }
  };

  const statusConfig = {
    COMPLETED: {
      label: "Completed",
      icon: UserCheck,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
    },
    CANCELLED: {
      label: "Cancelled",
      icon: AlertTriangle,
      color: "text-rose-600 bg-rose-50 dark:bg-rose-500/10",
    },
    NO_SHOW: {
      label: "No Show",
      icon: Clock,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
    },
  };

  // --------------------------
  // Animations (Upgraded)
  // --------------------------
  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };

  const itemVars = {
    hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 120, damping: 16 },
    },
  };

  const hoverLift = {
    whileHover: { y: -4, transition: { type: "spring", stiffness: 260, damping: 18 } },
    whileTap: { scale: 0.98 },
  };

  const pulse = {
    animate: {
      opacity: [0.6, 1, 0.6],
      transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
    },
  };

  // --------------------------
  // Dashboard Summary (API logic same)
  // --------------------------
  async function fetchDashboardSummary() {
    try {
      setIsLoadingSummary(true);
      const res = await getDoctorQueueSummary();
      setQueue(res?.data?.data);
      setLastUpdatedAt(new Date());
    } catch (error) {
      setToast({
        type: "error",
        message:
          error?.response?.data?.message || "Failed To Fetch The Dashboard Summary",
      });
    } finally {
      setIsLoadingSummary(false);
    }
  }

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  // Present Token
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem("currentToken");
    return storedToken ? JSON.parse(storedToken) : null;
  });

  // Patient Profile Api
  useEffect(() => {
    if (!token?.patient?._id) return;

    let mounted = true;

    const fetchPatient = async () => {
      setPatient(null); // skeleton

      try {
        const res = await patientProfileApi(token.patient._id);
        if (mounted) {
          setPatient(res?.data?.data || res?.data);
        }
      } catch (error) {
        console.error("Failed to load patient profile", error);

        setToast({
          type: "error",
          message: error?.response?.data?.message || "Failed to load patient profile",
        });
      }
    };

    fetchPatient();

    return () => {
      mounted = false;
    };
  }, [token?.patient?._id]);

  // CallNext Token
  async function CallNextToken() {
    try {
      const res = await callNextPatientApi();
      const tokenData = res?.data?.token;

      if (!tokenData) {
        throw new Error("Token not received");
      }

      setOpen(true);

      setToken(tokenData);
      localStorage.setItem("currentToken", JSON.stringify(tokenData));
      fetchDashboardSummary();

      const patientId = tokenData?.patient?._id;
      if (patientId) {
        setIsLoadingVisits(true);
        const visitsRes = await getDoctorPatientVisitsApi(patientId);
        setHistory(visitsRes?.data?.visits || []);
      }

      setToast({
        type: "success",
        message: res?.response?.data?.message || "Next Patient Called Successfully",
      });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to call next patient",
      });
    } finally {
      setIsLoadingVisits(false);
    }
  }

  async function restorePatientVisits(patientId) {
    try {
      setIsLoadingVisits(true);
      const res = await getDoctorPatientVisitsApi(patientId);
      setHistory(res?.data?.visits || []);
    } catch (err) {
      console.error("Failed to restore visits", err);
    } finally {
      setIsLoadingVisits(false);
    }
  }

  useEffect(() => {
    const storedToken = localStorage.getItem("currentToken");
    if (!storedToken) return;

    const tokenData = JSON.parse(storedToken);
    setToken(tokenData);

    const patientId = tokenData?.patient?._id;
    if (patientId) {
      restorePatientVisits(patientId);
    }
  }, []);

  // Complete Token
  async function CompleteToken() {
    try {
      const res = await completeCurrentTokenApi();

      setToast({
        type: "success",
        message: res?.response?.data?.message || "Completed Successfully",
      });

      setHistory([]);

      const clearCurrentToken = () => {
        setToken(null);
        localStorage.removeItem("currentToken");
      };
      clearCurrentToken();
      fetchDashboardSummary();
    } catch (error) {
      setToast({
        type: "error",
        message: error?.response?.data?.message || "Not Completed Successfully",
      });
    }
  }

  // Skip Token
  async function SkipToken() {
    try {
      const res = await skipCurrentTokenApi();

      setToast({
        type: "success",
        message: res?.response?.data?.message || "Skipped Successfully",
      });

      setHistory([]);

      const clearCurrentToken = () => {
        setToken(null);
        localStorage.removeItem("currentToken");
      };
      clearCurrentToken();

      fetchDashboardSummary();
    } catch (error) {
      setToast({
        type: "error",
        message: error?.response?.data?.message || "Something went wrong",
      });
    }
  }

  const [savingVisit, setSavingVisit] = useState(false);

  // Create Visit History Api
  async function handleSaveVisit(visitData) {
    if (savingVisit) return;
    setSavingVisit(true);

    try {
      const res = await createVisitApi({
        tokenId: token?._id,
        ...visitData,
      });

      setToast({
        type: "success",
        message: res?.data?.message || "Visit record saved successfully",
      });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error?.response?.data?.message ||
          error.message ||
          "Failed to save visit record",
      });
    } finally {
      setSavingVisit(false);
    }
  }

  const filteredHistory = Array.isArray(history)
    ? history.filter((visit) => {
        const term = searchTerm.toLowerCase();

        const diagnosis = visit?.diagnosis?.toLowerCase() || "";

        const date = visit?.date
          ? new Date(visit.date).toDateString().toLowerCase()
          : "";

        return diagnosis.includes(term) || date.includes(term);
      })
    : [];

  // --------------------------
  // UI-only derived labels
  // --------------------------
  const consultLabel = useMemo(() => {
    if (!token?.tokenNumber) return "No active token";
    return `#${token?.tokenNumber}`;
  }, [token?.tokenNumber]);

  const patientNameLabel = useMemo(() => {
    if (!token?.patient?.name) return "—";
    return token?.patient?.name?.toUpperCase();
  }, [token?.patient?.name]);

  const updatedTimeLabel = useMemo(() => {
    if (!lastUpdatedAt) return "—";
    return lastUpdatedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }, [lastUpdatedAt]);

  // --------------------------
  // Skeleton blocks (UI-only)
  // --------------------------
  const StatSkeleton = () => (
    <div className="rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <motion.div variants={pulse} animate="animate" className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800" />
      <motion.div variants={pulse} animate="animate" className="h-10 w-16 rounded bg-gray-100 dark:bg-gray-800 mt-3" />
      <motion.div variants={pulse} animate="animate" className="h-3 w-40 rounded bg-gray-100 dark:bg-gray-800 mt-3" />
    </div>
  );

  return (
    <>
      {/* Notifications */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <Navbar activePage="Queue" />

        <motion.main
          variants={containerVars}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto px-6 pt-8 pb-24"
        >
          {/* ================= TOP BAR ================= */}
          <motion.div
            variants={itemVars}
            className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-center">
                <Activity className="w-5 h-5 text-indigo-500" />
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Doctor Queue
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Live queue & patient workflow • Updated {updatedTimeLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/70 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 backdrop-blur-md shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wide">
                  Premium Workflow UI
                </span>
              </motion.div>

              <button
                onClick={() => fetchDashboardSummary()}
                className="px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-slate-700 dark:text-slate-200 font-black text-xs shadow-sm hover:shadow-md transition"
              >
                Refresh
              </button>
            </div>
          </motion.div>

          {/* ================= MAIN GRID ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            {/* ================= LEFT WORKFLOW ================= */}
            <div className="space-y-6">
              {/* ===== CURRENT TOKEN ===== */}
              <motion.section variants={itemVars} className="relative">
                <div className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-xl">
                  {/* Glow */}
                  <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-25 bg-gradient-to-br from-indigo-400 via-cyan-300 to-emerald-300 dark:opacity-15" />
                  <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-rose-300 via-amber-200 to-purple-300 dark:opacity-10" />

                  <div className="relative flex flex-col md:flex-row justify-between gap-8">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="relative flex h-3 w-3" aria-hidden>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                        </span>

                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                          Now Consulting
                        </p>

                        <span className="ml-2 text-[10px] font-black px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          LIVE
                        </span>
                      </div>

                      <div className="flex items-end gap-3">
                        <h2 className="text-6xl sm:text-7xl font-black text-gray-900 dark:text-white tracking-tight">
                          {token?.tokenNumber ? consultLabel : "—"}
                        </h2>

                        <div className="pb-3">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Token
                          </div>
                          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {token?._id ? "Active session" : "No session"}
                          </div>
                        </div>
                      </div>

                      <p className="text-lg sm:text-xl font-black text-gray-700 dark:text-gray-200 mt-2 truncate">
                        {token?.patient?.name ? patientNameLabel : "No patient selected"}
                      </p>

                      <div className="flex items-center gap-2 mt-3 text-sm text-gray-400 font-medium">
                        <Clock size={14} aria-hidden />
                        <span>{token ? "Consultation running..." : "Waiting for next patient"}</span>
                      </div>

                      {/* mini status row */}
                      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Queue Remaining
                          </div>
                          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                            {queue?.remaining ?? 0}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Completed
                          </div>
                          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                            {queue?.completed ?? 0}
                          </div>
                        </div>

                        <div className="hidden sm:block rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Total Today
                          </div>
                          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                            {queue?.totalToday ?? 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col justify-center gap-3 min-w-[240px]">
                      <AsyncMotionButton
                        loading={loading.complete}
                        loadingText="COMPLETING..."
                        onClick={() => withLoading("complete", CompleteToken)}
                        icon={<CheckCircle2 size={20} />}
                        className="py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black shadow-lg shadow-teal-900/20 transition-all active:scale-95"
                      >
                        Complete Visit
                      </AsyncMotionButton>

                      <AsyncMotionButton
                        loading={loading.skip}
                        loadingText="SKIPPING..."
                        onClick={() => withLoading("skip", SkipToken)}
                        icon={<UserMinus size={20} />}
                        className="py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/30 rounded-2xl font-black border border-rose-100 dark:border-rose-800 transition-colors active:scale-95"
                      >
                        Skip Patient
                      </AsyncMotionButton>

                      <AsyncMotionButton
                        loading={loading.patientProfile}
                        loadingText="OPENING..."
                        onClick={() =>
                          withLoading("patientProfile", async () => {
                            setOpen(true);
                          })
                        }
                        icon={<User size={20} />}
                        className="py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-2xl font-black border border-indigo-100 dark:border-indigo-800 transition-colors active:scale-95"
                      >
                        Patient Profile
                      </AsyncMotionButton>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* ===== NEXT TOKEN + STATS ===== */}
              <motion.section variants={itemVars} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  {...hoverLift}
                  className="md:col-span-2 bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between relative overflow-hidden"
                >
                  <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-blue-400 via-indigo-300 to-cyan-300 dark:opacity-10" />

                  <div className="flex items-center gap-4 relative">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                      <Volume2 size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-800 dark:text-white">
                        Call Next Patient
                      </h3>
                      <p className="text-xs text-gray-400 font-semibold">
                        Announce & move queue forward
                      </p>
                    </div>
                  </div>

                  <AsyncMotionButton
                    loading={loading.next}
                    loadingText="CALLING…"
                    onClick={() => withLoading("next", CallNextToken)}
                    className="px-8 py-3 bg-gray-900 dark:bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg hover:shadow-xl transition-all"
                  >
                    NEXT PATIENT <ChevronRight size={16} />
                  </AsyncMotionButton>
                </motion.div>

                <AnimatePresence mode="wait">
                  {isLoadingSummary ? (
                    <motion.div
                      key="stat-skel"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <StatSkeleton />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="waiting-stat"
                      {...hoverLift}
                      className="bg-emerald-500 rounded-[2rem] p-6 flex items-center justify-between text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden"
                    >
                      <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full blur-3xl opacity-25 bg-white" />
                      <div className="flex items-center gap-3 relative">
                        <Users size={24} className="opacity-90" />
                        <span className="text-xs font-black uppercase tracking-widest">
                          Waiting
                        </span>
                      </div>
                      <span className="text-3xl font-black relative" aria-live="polite">
                        {queue?.remaining}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>

              {/* ===== Visit History ===== */}
              <motion.div variants={itemVars} initial="hidden" animate="visible" className="space-y-6">
                {/* Navigation Toggle */}
                <div className="flex bg-slate-100 dark:bg-gray-800/50 p-1 rounded-2xl border border-slate-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setView("create")}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${
                      view === "create"
                        ? "bg-white dark:bg-gray-700 text-teal-600 shadow-sm"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                    aria-pressed={view === "create"}
                  >
                    ADD VISIT
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("check")}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${
                      view === "check"
                        ? "bg-white dark:bg-gray-700 text-teal-600 shadow-sm"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                    aria-pressed={view === "check"}
                  >
                    CHECK HISTORY
                  </button>
                </div>

                <AnimatePresence mode="sync">
                  {view === "create" ? (
                    <motion.div
                      key="create"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-5"
                    >
                      <motion.div
                        {...hoverLift}
                        className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden"
                      >
                        <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-teal-400 via-cyan-300 to-blue-300 dark:opacity-10" />

                        <div className="flex items-start justify-between gap-4 relative">
                          <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                              Create Visit Record
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                              Add diagnosis, prescriptions and notes for the current token.
                            </p>
                          </div>

                          <span className="inline-flex items-center gap-2 text-[10px] font-black px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <BadgeCheck className="w-4 h-4 text-teal-500" />
                            QUICK ENTRY
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsVisitModalOpen(true)}
                          className="
                            w-full
                            mt-6
                            py-4
                            rounded-2xl
                            text-[11px]
                            font-black
                            tracking-widest
                            bg-teal-500
                            text-white
                            hover:bg-teal-600
                            active:scale-[0.98]
                            transition
                            shadow-lg
                            shadow-teal-500/30
                          "
                        >
                          ADD VISIT
                        </button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="check"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      {/* Search Bar */}
                      <div className="relative group">
                        <Search
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-500 transition-colors pointer-events-none"
                          aria-hidden
                        />
                        <input
                          type="text"
                          placeholder="Search diagnosis or date..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          aria-label="Search visit history"
                          className="w-full bg-white dark:bg-gray-900 pl-12 pr-6 py-4 rounded-2xl text-sm font-bold border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-teal-500/30 outline-none dark:text-white transition-all shadow-sm"
                        />
                      </div>

                      {/* History List */}
                      <div
                        className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar"
                        role="list"
                        aria-label="Visit history list"
                      >
                        {isLoadingVisits ? (
                          <div className="grid gap-4">
                            {Array.from({ length: 4 }).map((_, idx) => (
                              <motion.div
                                key={idx}
                                variants={pulse}
                                animate="animate"
                                className="h-24 rounded-[2rem] bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800"
                              />
                            ))}
                          </div>
                        ) : filteredHistory.length > 0 ? (
                          <div className="grid gap-4">
                            {filteredHistory.map((v, index) => {
                              const status = statusConfig[v.status] || {
                                color:
                                  "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
                                icon: ClipboardList,
                              };
                              const StatusIcon = status.icon;

                              return (
                                <motion.div
                                  key={v._id}
                                  layoutId={v._id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  onClick={() => setSelectedVisit(v)}
                                  className="group cursor-pointer relative overflow-hidden bg-white dark:bg-slate-900/40 rounded-[2rem] p-5 border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-teal-500/10 hover:border-teal-500/30 dark:hover:border-teal-500/50 transition-all duration-300"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                  <div className="relative flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-5 w-full">
                                      <div className={`flex-shrink-0 p-4 rounded-2xl shadow-inner ${status.color}`}>
                                        <StatusIcon size={24} strokeWidth={2.5} />
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight truncate">
                                          {v.department?.name?.toUpperCase() || "MEDICAL VISIT"}
                                        </h3>

                                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1">
                                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold text-sm">
                                            <User size={14} className="text-teal-600" />
                                            <span>Dr. {v.doctor?.name?.toUpperCase()}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-medium">
                                            <Calendar size={14} />
                                            {new Date(v.createdAt).toLocaleDateString(undefined, {
                                              dateStyle: "medium",
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-none pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                                      <div className="flex flex-col items-start md:items-end">
                                        <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                          <Pill size={10} />
                                          Medications
                                        </div>
                                        <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                                          {v.prescriptions?.length || 0} Prescribed
                                        </p>
                                      </div>

                                      <AsyncMotionButton
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedVisit(v);
                                        }}
                                        className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-xs font-black uppercase tracking-wider group-hover:bg-teal-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-teal-500/30 transition-all duration-300"
                                      >
                                        View Report <ChevronRight size={16} />
                                      </AsyncMotionButton>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800/50">
                            <div className="w-20 h-20 mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mb-4">
                              <History className="text-teal-500/50" size={32} strokeWidth={1.5} />
                            </div>
                            <h4 className="text-slate-900 dark:text-white font-black text-lg">
                              No visits found
                            </h4>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[220px] mx-auto mt-2 font-medium leading-relaxed">
                              Your medical history will appear here once a report is generated.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* ================= RIGHT: LIVE QUEUE ================= */}
            <motion.section
              variants={itemVars}
              className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col max-h-[calc(100vh-8rem)] sticky top-20 lg:top-24"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <ClipboardList size={16} /> Live Patient List
                </h3>

                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                  AUTO SYNC
                </span>
              </div>

              <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar" aria-label="Live queue">
                <AnimatePresence mode="sync">
                  {queue?.nextWaiting.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 dark:bg-gray-800/40 rounded-[1.8rem] border border-dashed border-gray-200 dark:border-gray-700"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center mb-4 shadow-sm">
                        🕒
                      </div>

                      <p className="font-black text-gray-700 dark:text-gray-200">
                        No tokens in queue
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        Waiting patients will appear here automatically
                      </p>
                    </motion.div>
                  ) : (
                    (queue?.nextWaiting || []).map((item, idx) => (
                      <motion.div
                        key={item.token}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
                        whileHover={{ y: -2 }}
                        className="group relative bg-white dark:bg-slate-900/50 p-4 rounded-[2rem]
                                  border border-slate-200/60 dark:border-slate-800
                                  shadow-sm hover:shadow-xl hover:shadow-teal-500/10 
                                  hover:border-teal-500/30 transition-all duration-300
                                  flex items-center justify-between overflow-hidden"
                      >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-teal-500/6 to-transparent" />

                        <div className="relative flex items-center gap-5">
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <div className="absolute inset-0 bg-teal-500/10 dark:bg-teal-500/20 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform" />
                            <div
                              className="relative w-full h-full rounded-2xl bg-white dark:bg-slate-800 
                                          border border-slate-100 dark:border-slate-700
                                          flex flex-col items-center justify-center shadow-sm"
                            >
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-tighter leading-none mb-1">
                                Token
                              </span>
                              <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                                {item.token}
                              </span>
                            </div>
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-black text-slate-900 dark:text-slate-100 text-lg leading-tight mb-1.5 truncate">
                              {item.name}
                            </h4>

                            <div className="flex items-center gap-3 flex-wrap">
                              <span
                                className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                                  item.priority === "EMERGENCY"
                                    ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20"
                                    : item.priority === "SENIOR"
                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                {item.priority}
                              </span>

                              <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-bold text-[11px]">
                                <Clock size={12} strokeWidth={3} />
                                {item.time}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="relative flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            WAIT
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          </div>
        </motion.main>

        {/* Visit Modal Pop Up */}
        <VisitRecordModal
          isOpen={isVisitModalOpen}
          onClose={() => setIsVisitModalOpen(false)}
          onSave={handleSaveVisit}
          saving={savingVisit}
        />

        <VisitDetailsModal
          isOpen={!!selectedVisit}
          onClose={() => setSelectedVisit(null)}
          visit={selectedVisit}
          statusConfig={statusConfig}
        />

        <PatientProfile
          isOpen={open}
          onClose={() => setOpen(false)}
          patient={patient}
          size="md"
        />
      </div>
    </>
  );
};

export default DoctorQueue;
