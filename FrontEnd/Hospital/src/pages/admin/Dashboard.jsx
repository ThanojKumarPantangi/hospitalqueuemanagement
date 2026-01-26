import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Users,
  Stethoscope,
  Ticket,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Clock,
  ArrowRight,
  MoreHorizontal,
  Sparkles,
  ShieldCheck,
  RefreshCcw,
  Dot,
  TrendingUp,
  Search,
  X,
  CalendarPlus,
  ArrowUpDown,
  Check,
} from "lucide-react";

import { showToast } from "../../utils/toastBus.js";
import AdminCreateTokenModal from "../../components/tokenmodal/AdminCreateTokenModal";
import {
  getAdminDashboardSummaryApi,
  getDepartmentsStatusApi,
} from "../../api/admin.api";
import { createTokenApi, previewTokenNumberApi } from "../../api/token.api";

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { y: 16, opacity: 0, filter: "blur(4px)" },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 120, damping: 16 },
  },
};

const subtleFade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35 } },
};

const pulseVariants = {
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
  },
};

const hoverLift = {
  whileHover: { y: -4, transition: { type: "spring", stiffness: 250, damping: 18 } },
  whileTap: { scale: 0.98 },
};

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState([]);
  const [departmentsSummary, setDepartmentsSummary] = useState([]);

  // UI-only state
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const [open, setOpen] = useState(false);

  // ✅ Search + filters (UI only)
  const [deptSearch, setDeptSearch] = useState("");
  const [deptStatusFilter, setDeptStatusFilter] = useState("ALL"); // ALL | OPEN | CLOSED
  const [sortWaiting, setSortWaiting] = useState("NONE"); // NONE | DESC

  // modal states
  const [departmentId, setDepartmentId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [priority, setPriority] = useState("NORMAL");

  const [expectedTokenNumber, setExpectedTokenNumber] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewCacheRef = useRef(new Map());
  const debounceTimerRef = useRef(null);

  const MAX_ADVANCE_DAYS = 5;

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + MAX_ADVANCE_DAYS);

  const [creating, setCreating] = useState(false);

  // create Token
  const createToken = async (payload) => {
    const { patientId, departmentId, appointmentDate, priority } = payload || {};

    if (!patientId || !departmentId || !appointmentDate || !priority) {
      showToast({ type: "error", message: "Please fill all the fields" });
      return;
    }

    setCreating(true);

    try {
      const res = await createTokenApi({
        patientId,
        departmentId,
        appointmentDate,
        priority,
      });

      setOpen(false);

      showToast({
        type: "success",
        message: res?.data?.message || "Token created successfully",
      });

      previewCacheRef.current.clear();
      setExpectedTokenNumber(null);
      setAppointmentDate("");
      setDepartmentId("");
    } catch (err) {
      showToast({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Error creating token. Please try again later.",
      });
    } finally {
      setCreating(false);
    }
  };

  // ✅ Fetch function (reusable for refresh button)
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [summary, departments] = await Promise.all([
        getAdminDashboardSummaryApi(),
        getDepartmentsStatusApi(),
      ]);

      setDashboardData(summary?.data);
      setDepartmentsSummary(departments?.data ?? []);
      setLastUpdatedAt(new Date());
    } catch (err) {
      console.log(err);
      showToast({
        type: "error",
        message: "Failed to load dashboard data",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Preview Token Handler
  useEffect(() => {
    if (!departmentId || !appointmentDate) {
      setExpectedTokenNumber(null);
      return;
    }

    const cacheKey = `${departmentId}|${appointmentDate}`;

    // Return cached value immediately
    if (previewCacheRef.current.has(cacheKey)) {
      setExpectedTokenNumber(previewCacheRef.current.get(cacheKey));
      return;
    }

    // Clear previous debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setPreviewLoading(true);

        const res = await previewTokenNumberApi({
          departmentId,
          appointmentDate,
        });

        const tokenNumber = res.data.expectedTokenNumber;

        previewCacheRef.current.set(cacheKey, tokenNumber);
        setExpectedTokenNumber(tokenNumber);
      } catch (err) {
        setExpectedTokenNumber(null);
        console.log(err);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [departmentId, appointmentDate]);

  useEffect(() => {
    if (!open) {
      setDepartmentId("");
      setAppointmentDate("");
      setPriority("NORMAL");
      setExpectedTokenNumber(null);
    }
  }, [open]);

  // --------------------------
  // Derived UI helpers
  // --------------------------
  const systemStatus = useMemo(() => {
    const waiting = dashboardData?.waitingTokens ?? 0;
    const available = dashboardData?.availableDoctors ?? 0;

    if (available === 0 && waiting > 0) return "Critical";
    if (waiting > 20) return "Busy";
    return "Operational";
  }, [dashboardData?.waitingTokens, dashboardData?.availableDoctors]);

  const statusMeta = useMemo(() => {
    if (systemStatus === "Critical") {
      return {
        label: "System Status: Critical",
        icon: AlertTriangle,
        pill: "bg-rose-100 text-rose-700 dark:bg-rose-900/25 dark:text-rose-300",
        dot: "bg-rose-500",
      };
    }
    if (systemStatus === "Busy") {
      return {
        label: "System Status: Busy",
        icon: Activity,
        pill: "bg-amber-100 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300",
        dot: "bg-amber-500",
      };
    }
    return {
      label: "System Status: Operational",
      icon: ShieldCheck,
      pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300",
      dot: "bg-emerald-500",
    };
  }, [systemStatus]);

  const stats = [
    {
      type: "single",
      label: "Open Departments",
      value: dashboardData?.openDepartments,
      subLabel: `${dashboardData?.closedDepartments ?? 0} Closed`,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      accentRing: "ring-blue-200 dark:ring-blue-900/40",
      hint: "Departments currently available for consultation",
    },
    {
      type: "doctors",
      label: "Doctors",
      available: dashboardData?.availableDoctors,
      active: dashboardData?.activeDoctors,
      total: dashboardData?.totalDoctors,
      icon: Stethoscope,
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      color: "text-emerald-600",
      accentRing: "ring-emerald-200 dark:ring-emerald-900/40",
      hint: "Availability snapshot across all departments",
    },
    {
      type: "single",
      label: "Patients in Queue",
      value: dashboardData?.waitingTokens,
      subLabel: `${dashboardData?.todayTokens ?? 0} Total Today`,
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      accentRing: "ring-amber-200 dark:ring-amber-900/40",
      hint: "Currently waiting across all departments",
    },
    {
      type: "single",
      label: "Completed Today",
      value: dashboardData?.completedTokens,
      subLabel: "Visits",
      icon: Ticket,
      color: "text-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      accentRing: "ring-purple-200 dark:ring-purple-900/40",
      hint: "Total completed consultations today",
    },
  ];

  const alerts = [
    {
      id: 1,
      text: "Pending doctor approvals",
      count: dashboardData?.pendingDoctors ?? 0,
      type: "critical",
    },
    {
      id: 2,
      text: "Departments without doctors",
      count: 0,
      type: "warning",
    },
    {
      id: 3,
      text: "Patients waiting with no available doctors",
      count:
        dashboardData?.waitingTokens > 0 && dashboardData?.availableDoctors === 0
          ? dashboardData.waitingTokens
          : 0,
      type: "critical",
    },
    {
      id: 4,
      text: "High patient queue",
      count: dashboardData?.waitingTokens > 20 ? dashboardData.waitingTokens : 0,
      type: "critical",
    },
    {
      id: 5,
      text: "Low doctor availability",
      count: dashboardData?.availableDoctors <= 2 ? dashboardData.availableDoctors : 0,
      type: "warning",
    },
    {
      id: 6,
      text: "Departments closed today",
      count: dashboardData?.closedDepartments ?? 0,
      type: "warning",
    },
  ];

  const activeAlerts = alerts.filter((alert) => alert.count > 0);

  const visibleAlerts = useMemo(() => {
    if (showAllAlerts) return activeAlerts;
    return activeAlerts.slice(0, 4);
  }, [activeAlerts, showAllAlerts]);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, []);

  const formattedTime = useMemo(() => {
    if (!lastUpdatedAt) return "—";
    return lastUpdatedAt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastUpdatedAt]);

  // ✅ NEW: Filter + Sort (UI only, API not disturbed)
  const filteredDepartments = useMemo(() => {
    let list = [...(departmentsSummary || [])];

    // Search by name
    const q = deptSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((d) => (d?.name || "").toLowerCase().includes(q));
    }

    // Open/Closed filter
    if (deptStatusFilter === "OPEN") {
      list = list.filter((d) => d?.isOpen === true);
    } else if (deptStatusFilter === "CLOSED") {
      list = list.filter((d) => d?.isOpen === false);
    }

    // Sort waiting high -> low
    if (sortWaiting === "DESC") {
      list.sort((a, b) => {
        const aw = Number(a?.waiting ?? 0);
        const bw = Number(b?.waiting ?? 0);
        return bw - aw;
      });
    }

    return list;
  }, [departmentsSummary, deptSearch, deptStatusFilter, sortWaiting]);

  const totalResults = filteredDepartments.length;

  // --------------------------
  // Skeleton components
  // --------------------------
  const StatSkeleton = () => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <motion.div
            variants={pulseVariants}
            animate="animate"
            className="h-4 w-32 rounded bg-gray-100 dark:bg-gray-800"
          />
          <motion.div
            variants={pulseVariants}
            animate="animate"
            className="h-8 w-24 rounded bg-gray-100 dark:bg-gray-800 mt-3"
          />
          <motion.div
            variants={pulseVariants}
            animate="animate"
            className="h-3 w-40 rounded bg-gray-100 dark:bg-gray-800 mt-3"
          />
        </div>
        <motion.div
          variants={pulseVariants}
          animate="animate"
          className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800"
        />
      </div>
    </div>
  );

  const DeptSkeleton = () => (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-start justify-between mb-4">
        <motion.div
          variants={pulseVariants}
          animate="animate"
          className="h-4 w-32 rounded bg-gray-100 dark:bg-gray-800"
        />
        <motion.div
          variants={pulseVariants}
          animate="animate"
          className="h-2.5 w-2.5 rounded-full bg-gray-100 dark:bg-gray-800"
        />
      </div>
      <div className="space-y-2">
        <motion.div
          variants={pulseVariants}
          animate="animate"
          className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800"
        />
        <motion.div
          variants={pulseVariants}
          animate="animate"
          className="h-4 w-3/4 rounded bg-gray-100 dark:bg-gray-800"
        />
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between">
        <motion.div
          variants={pulseVariants}
          animate="animate"
          className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800"
        />
        <motion.div
          variants={pulseVariants}
          animate="animate"
          className="h-5 w-14 rounded bg-gray-100 dark:bg-gray-800"
        />
      </div>
    </div>
  );

  return (
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ================= HEADER ================= */}
      <motion.header
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: -8, opacity: 0, scale: 0.9 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 14 }}
              className="inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm"
            >
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </motion.div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Overview
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Real-time hospital operations summary
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${statusMeta.pill}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
              <statusMeta.icon className="w-4 h-4" />
              {statusMeta.label}
            </span>

            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300">
              <Clock className="w-4 h-4 text-gray-400" />
              Updated: {formattedTime}
            </span>

            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300">
              <Activity className="w-4 h-4 text-emerald-500" />
              Live Monitoring
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formattedDate}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Admin Dashboard
          </p>
        </div>
      </motion.header>

      {/* ================= STATS CARDS ================= */}
      <motion.section
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div
              key="stats-loading"
              className="contents"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div variants={subtleFade} initial="hidden" animate="visible" exit="hidden">
                <StatSkeleton />
              </motion.div>
              <motion.div variants={subtleFade} initial="hidden" animate="visible" exit="hidden">
                <StatSkeleton />
              </motion.div>
              <motion.div variants={subtleFade} initial="hidden" animate="visible" exit="hidden">
                <StatSkeleton />
              </motion.div>
              <motion.div variants={subtleFade} initial="hidden" animate="visible" exit="hidden">
                <StatSkeleton />
              </motion.div>
            </motion.div>
          ) : (
            stats.map((item) => (
              <motion.div
                key={item.label}
                {...hoverLift}
                className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow"
              >
                <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-indigo-400 via-cyan-300 to-emerald-300 dark:opacity-20" />

                <div className="flex items-start justify-between gap-4 relative">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {item.label}
                    </p>

                    {item.type === "doctors" ? (
                      <div>
                        <div className="mt-2 flex items-end gap-2">
                          <p className="text-4xl font-bold text-emerald-600">
                            {item.available ?? 0}
                          </p>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                            available
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Active: {item.active ?? 0}
                          </span>

                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
                            <Dot className="w-4 h-4" />
                            Total: {item.total ?? 0}
                          </span>
                        </div>

                        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {item.hint}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="mt-2 flex items-end gap-2">
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {item.value ?? 0}
                          </p>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                            today
                          </span>
                        </div>

                        {item.subLabel && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {item.subLabel}
                          </p>
                        )}

                        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {item.hint}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className={`p-3 rounded-2xl ${item.bg} ring-1 ${item.accentRing} shadow-sm`}>
                    <item.icon className={`w-6 h-6 ${item.color ?? "text-emerald-600"}`} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.section>

      {/* ✅ FIXED: grid will not stretch sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ================= ALERTS ================= */}
        <motion.section
          variants={itemVariants}
          className="lg:col-span-1 h-full max-h-[calc(100vh-260px)] overflow-auto pr-1"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 h-full relative overflow-hidden">
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full blur-3xl opacity-25 bg-gradient-to-br from-rose-400 via-amber-300 to-purple-400 dark:opacity-15" />

            <div className="flex items-center justify-between mb-6 relative">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Attention Needed
              </h2>

              <div className="flex items-center gap-2">
                <button
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  title="Refresh"
                  onClick={fetchData}
                >
                  <RefreshCcw className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  title="More"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="alerts-loading"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <motion.div
                      key={idx}
                      variants={pulseVariants}
                      animate="animate"
                      className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800"
                    />
                  ))}
                </motion.div>
              ) : activeAlerts.length > 0 ? (
                <motion.div
                  key="alerts-active"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <ul className="space-y-3 relative">
                    {visibleAlerts.map((alert) => (
                      <motion.li
                        key={alert.id}
                        {...hoverLift}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 pr-3">
                          {alert.text}
                        </span>

                        <span
                          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                            alert.type === "critical"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {alert.count}
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                  <div className="mt-6 space-y-3">
                    {activeAlerts.length > 4 && (
                      <button
                        className="w-full text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center gap-1 transition-colors bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl py-2.5"
                        onClick={() => setShowAllAlerts((prev) => !prev)}
                      >
                        {showAllAlerts ? "Show less" : "Show all"}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    <button className="w-full text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center gap-1 transition-colors">
                      View notifications <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="alerts-ok"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col items-center justify-center h-44 text-center relative"
                >
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 160, damping: 14 }}
                    className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3"
                  >
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </motion.div>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    All Systems Normal
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    No pending actions required.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* ================= DEPARTMENT SNAPSHOT ================= */}
        <motion.section variants={itemVariants} className="lg:col-span-2">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  Live Department Status
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Quick snapshot of serving + waiting counts per department
                </p>
              </div>

              {/* ✅ Create Appointment button with icon */}
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                bg-white/70 dark:bg-gray-900/60 backdrop-blur
                border border-gray-200 dark:border-gray-800
                text-gray-700 dark:text-gray-200
                hover:bg-white dark:hover:bg-gray-900
                hover:border-indigo-300 dark:hover:border-indigo-600
                hover:text-indigo-600 dark:hover:text-indigo-400
                shadow-sm hover:shadow-md
                transition-all duration-200"
              >
                <CalendarPlus className="w-4 h-4" />
                Create Appointment
              </button>
            </div>

            {/* ✅ Search + Filters Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="Search departments..."
                  className="w-full pl-9 pr-9 py-2 rounded-xl text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition"
                />
                {deptSearch && (
                  <button
                    onClick={() => setDeptSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Clear"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Filters + Sort */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Open/Closed Toggle */}
                <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1">
                  <button
                    onClick={() => setDeptStatusFilter("ALL")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      deptStatusFilter === "ALL"
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {deptStatusFilter === "ALL" && <Check className="inline w-3.5 h-3.5 mr-1" />}
                    All
                  </button>

                  <button
                    onClick={() => setDeptStatusFilter("OPEN")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      deptStatusFilter === "OPEN"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {deptStatusFilter === "OPEN" && <Check className="inline w-3.5 h-3.5 mr-1" />}
                    Open
                  </button>

                  <button
                    onClick={() => setDeptStatusFilter("CLOSED")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      deptStatusFilter === "CLOSED"
                        ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {deptStatusFilter === "CLOSED" && <Check className="inline w-3.5 h-3.5 mr-1" />}
                    Closed
                  </button>
                </div>

                {/* Sort Waiting High -> Low */}
                <button
                  onClick={() => setSortWaiting((prev) => (prev === "DESC" ? "NONE" : "DESC"))}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    sortWaiting === "DESC"
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40"
                      : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  title="Sort by waiting count"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  Waiting: High → Low
                </button>

                {/* Total Results */}
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2">
                  Total results:{" "}
                  <span className="text-gray-900 dark:text-gray-100">
                    {totalResults}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Departments scroll container */}
          <div className="max-h-[calc(100vh-260px)] overflow-auto pr-2 no-scrollbar">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <motion.div
                    key="dept-loading"
                    className="contents"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <motion.div
                        key={idx}
                        variants={subtleFade}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      >
                        <DeptSkeleton />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : filteredDepartments.length === 0 ? (
                  <motion.div
                    key="dept-empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                      <Building2 className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      No departments found
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                      Try changing the search keyword or filters.
                    </p>
                  </motion.div>
                ) : (
                  filteredDepartments.map((dept) => (
                    <motion.div
                      key={dept?._id}
                      {...hoverLift}
                      layout
                      initial={false}
                      className={`group relative overflow-hidden rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md ${
                        dept?.isOpen
                          ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:ring-2 hover:ring-emerald-200/60 dark:hover:ring-emerald-900/30"
                          : "bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-90 hover:ring-2 hover:ring-gray-200/60 dark:hover:ring-gray-800/60"
                      }`}
                    >
                      <div
                        className={`pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl opacity-30 ${
                          dept?.isOpen
                            ? "bg-gradient-to-br from-emerald-400 via-cyan-300 to-blue-400 dark:opacity-15"
                            : "bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 dark:opacity-10"
                        }`}
                      />

                      {/* Header */}
                      <div className="flex justify-between items-start mb-4 relative">
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate pr-2">
                            {dept?.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {dept?.isOpen ? "Accepting patients now" : "Currently paused"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span
                              className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${
                                dept?.isOpen ? "bg-emerald-500 animate-ping" : "bg-gray-400"
                              }`}
                            />
                            <span
                              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                                dept?.isOpen ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                              }`}
                            />
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              dept?.isOpen
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
                                : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                            }`}
                          >
                            {dept?.isOpen ? "OPEN" : "CLOSED"}
                          </span>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="space-y-2 relative">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Serving
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {dept?.serving ?? "--"}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Waiting
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {dept?.waiting ?? "--"}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="pt-2">
                          {(() => {
                            const waiting = Number(dept?.waiting ?? 0);
                            const maxLoad = 30;
                            const percent = Math.min(100, Math.max(0, (waiting / maxLoad) * 100));

                            return (
                              <>
                                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                  <motion.div
                                    initial={false}
                                    animate={{ width: `${percent}%` }}
                                    transition={{ duration: 0.55, ease: "easeOut" }}
                                    className={`h-full ${
                                      dept?.isOpen
                                        ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                                        : "bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600"
                                    }`}
                                  />
                                </div>

                                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                                  <span>Load</span>
                                  <span>
                                    {waiting}/{maxLoad}
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center relative">
                        <span className="text-xs font-medium text-gray-400">Status</span>

                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                            dept?.isOpen
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {dept?.isOpen ? "Open" : "Closed"}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>
      </div>

      <AdminCreateTokenModal
        open={open}
        onClose={() => setOpen(false)}
        departments={departmentsSummary}
        departmentId={departmentId}
        setDepartmentId={setDepartmentId}
        appointmentDate={appointmentDate}
        setAppointmentDate={setAppointmentDate}
        expectedTokenNumber={expectedTokenNumber}
        previewLoading={previewLoading}
        MAX_ADVANCE_DAYS={MAX_ADVANCE_DAYS}
        today={today}
        formatDate={formatDate}
        priority={priority}
        setPriority={setPriority}
        creating={creating}
        createToken={createToken}
      />
    </motion.div>
  );
};

export default Dashboard;