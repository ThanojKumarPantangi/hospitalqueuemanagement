import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MonitorPlay,
  Users,
  Clock,
  Stethoscope,
  Filter,
  Hash,
  User,
  Activity,
  Building2,
  RefreshCcw,
  Wifi,
  WifiOff,
  ChevronRight,
  BadgeCheck,
  AlertTriangle,
  PauseCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
  ArrowUpRight,
  Dot,
} from "lucide-react";

import { getDepartmentsStatusApi } from "../../api/admin.api";
import { useAdminMonitorSocket } from "../../hooks/useAdminMonitorSocket";
import { useSocket } from "../../hooks/useSocket";

const AdminQueueMonitor = () => {
  const { socketRef, isConnected } = useSocket();

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [departments, setDepartments] = useState([]);

  // UI-only state (does not disturb API logic)
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("PRIORITY"); // PRIORITY | NAME | WAITING | SERVING
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [highlightDeptId, setHighlightDeptId] = useState(null);

  // UI-only micro states
  const [viewMode, setViewMode] = useState("GRID"); // GRID | COMPACT
  const [showLegend, setShowLegend] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  // holds socket updates if HTTP not loaded yet
  const pendingUpdatesRef = useRef(new Map());

  /* -------------------------------------------------------
     FETCH DEPARTMENTS (HTTP)
     IMPORTANT: never overwrite socket-updated doctor/patient
  ------------------------------------------------------- */
  const fetchDepartmentsStatus = async () => {
    const res = await getDepartmentsStatusApi();

    setDepartments((prev) => {
      const prevMap = new Map(prev.map((d) => [d._id, d]));

      return res.data.map((dept) => {
        const old = prevMap.get(dept._id);
        const pending = pendingUpdatesRef.current.get(dept._id);

        return {
          _id: dept._id,
          name: dept.name?.toUpperCase(),
          isOpen: dept.isOpen,

          serving: dept.serving ?? "-",
          waiting: dept.waiting ?? 0,

          // 🔥 DO NOT overwrite socket doctor
          doctor:
            pending?.doctor ||
            (old?.doctor && old.doctor !== "Assigned"
              ? old.doctor
              : dept.isOpen
              ? "Assigned"
              : "-"),

          // 🔥 DO NOT overwrite socket patient
          currentPatient:
            pending?.currentPatient ||
            (old?.currentPatient && old.currentPatient !== "-"
              ? old.currentPatient
              : "-"),

          avgWait: dept.isOpen ? `${dept.slotDurationMinutes}m` : "-",
        };
      });
    });

    setLastUpdatedAt(new Date());
  };

  const manualRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchDepartmentsStatus();
    } catch (err) {
      console.error("Manual refresh failed", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  /* -------------------------------------------------------
     SOCKET LISTENER
  ------------------------------------------------------- */
  useAdminMonitorSocket({
    socketRef,

    onTokenCalled: (data) => {
      console.log("Admin: Token called", data);

      setHighlightDeptId(data.departmentId);
      setTimeout(() => setHighlightDeptId(null), 1400);

      setDepartments((prev) => {
        if (!prev || prev.length === 0) {
          pendingUpdatesRef.current.set(data.departmentId, {
            isOpen: true,
            serving: data.tokenNumber,
            doctor: data.doctorName,
            currentPatient: data.patientName,
          });
          return prev;
        }

        let found = false;

        const updated = prev.map((dept) => {
          if (dept._id !== data.departmentId) return dept;

          found = true;
          return {
            ...dept,
            isOpen: true,
            serving: data.tokenNumber,
            doctor: data.doctorName,
            currentPatient: data.patientName,
          };
        });

        if (!found) {
          pendingUpdatesRef.current.set(data.departmentId, {
            isOpen: true,
            serving: data.tokenNumber,
            doctor: data.doctorName,
            currentPatient: data.patientName,
          });
        }

        return updated;
      });

      // re-sync waiting count safely
      setTimeout(fetchDepartmentsStatus, 300);
    },
  });

  /* -------------------------------------------------------
     INITIAL LOAD
  ------------------------------------------------------- */
  useEffect(() => {
    fetchDepartmentsStatus().catch(console.error);
  }, []);

  /* -------------------------------------------------------
     FILTER + SEARCH + SORT (UI only)
  ------------------------------------------------------- */
  const filteredDepts = useMemo(() => {
    const base = departments.filter((dept) => {
      if (filterStatus === "ALL") return true;
      if (filterStatus === "OPEN") return dept.isOpen;
      if (filterStatus === "CLOSED") return !dept.isOpen;
      return true;
    });

    const searched = base.filter((dept) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        dept?.name?.toLowerCase()?.includes(q) ||
        dept?.doctor?.toLowerCase()?.includes(q) ||
        dept?.currentPatient?.toLowerCase()?.includes(q)
      );
    });

    const withPriority = [...searched];

    const priorityScore = (d) => {
      // higher score = higher priority in UI
      let score = 0;

      if (d.isOpen) score += 50;
      if (typeof d.waiting === "number") score += Math.min(d.waiting, 40);

      // if serving is number, show higher
      if (typeof d.serving === "number") score += 10;

      // highlight very high waiting
      if (typeof d.waiting === "number" && d.waiting >= 20) score += 20;

      return score;
    };

    withPriority.sort((a, b) => {
      if (sortBy === "NAME") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "WAITING") return (b.waiting || 0) - (a.waiting || 0);
      if (sortBy === "SERVING") {
        const as = typeof a.serving === "number" ? a.serving : -1;
        const bs = typeof b.serving === "number" ? b.serving : -1;
        return bs - as;
      }
      // PRIORITY
      return priorityScore(b) - priorityScore(a);
    });

    return withPriority;
  }, [departments, filterStatus, search, sortBy]);

  const openCount = useMemo(
    () => departments.filter((d) => d.isOpen).length,
    [departments]
  );

  const closedCount = useMemo(
    () => departments.filter((d) => !d.isOpen).length,
    [departments]
  );

  const totalWaiting = useMemo(() => {
    return departments.reduce((sum, d) => {
      const w = typeof d.waiting === "number" ? d.waiting : 0;
      return sum + w;
    }, 0);
  }, [departments]);

  const maxWaiting = useMemo(() => {
    return departments.reduce((mx, d) => {
      const w = typeof d.waiting === "number" ? d.waiting : 0;
      return Math.max(mx, w);
    }, 0);
  }, [departments]);

  /* -------------------------------------------------------
     ANIMATIONS (Enhanced)
  ------------------------------------------------------- */
  const pageVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
  };

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.06 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.985 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 14, scale: 0.985 },
  };

  const softPop = {
    hidden: { opacity: 0, y: 8, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  const pulseRing = {
    initial: { opacity: 0.18, scale: 0.92 },
    animate: {
      opacity: [0.26, 0.08, 0.26],
      scale: [0.96, 1.03, 0.96],
      transition: { duration: 1.15, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const shimmer = {
    initial: { opacity: 0 },
    animate: { opacity: [0, 0.22, 0], transition: { duration: 1.15 } },
  };

  const formatTimeAgo = (date) => {
    if (!date) return "—";
    const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (diff < 10) return "Just now";
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  const getQueueRisk = (dept) => {
    if (!dept.isOpen) return "CLOSED";
    if (dept.waiting >= 20) return "HIGH";
    if (dept.waiting >= 10) return "MEDIUM";
    return "LOW";
  };

  const riskBadge = (risk) => {
    if (risk === "HIGH") {
      return {
        label: "High Load",
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        className:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-900/40",
      };
    }
    if (risk === "MEDIUM") {
      return {
        label: "Moderate",
        icon: <Activity className="w-3.5 h-3.5" />,
        className:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-900/40",
      };
    }
    if (risk === "LOW") {
      return {
        label: "Stable",
        icon: <BadgeCheck className="w-3.5 h-3.5" />,
        className:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40",
      };
    }
    return {
      label: "Closed",
      icon: <PauseCircle className="w-3.5 h-3.5" />,
      className:
        "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    };
  };

  const waitingProgress = (waiting) => {
    const w = typeof waiting === "number" ? waiting : 0;
    if (!maxWaiting || maxWaiting === 0) return 0;
    return Math.min(100, Math.round((w / maxWaiting) * 100));
  };

  return (
    <motion.div
      className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_45%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.08),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_45%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.10),transparent_45%)] p-6 space-y-8"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ================= HEADER / TOP BAR ================= */}
      <motion.div
        variants={headerVariants}
        className="rounded-[28px] border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm overflow-hidden"
      >
        {/* Glow overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.25]" />

        {/* Top strip */}
        <div className="px-6 pt-6 pb-5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            {/* Left: Title */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gray-900 dark:bg-white shadow-sm">
                  <MonitorPlay className="w-5 h-5 text-white dark:text-gray-900" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white truncate">
                      Admin Queue Monitor
                    </h1>

                    <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black tracking-widest border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-300">
                      <Sparkles className="w-3.5 h-3.5" />
                      LIVE VIEW
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Observer dashboard • Smooth animations • Live socket updates
                  </p>
                </div>
              </div>

              {/* Connection + last updated */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                    isConnected
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40"
                      : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40"
                  }`}
                >
                  {isConnected ? (
                    <Wifi className="w-3.5 h-3.5" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5" />
                  )}
                  {isConnected ? "LIVE CONNECTED" : "DISCONNECTED"}
                  <Dot className="w-4 h-4 opacity-60" />
                  <span className="font-black">{formatTimeAgo(lastUpdatedAt)}</span>
                </div>

                <button
                  onClick={manualRefresh}
                  className="
                    inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95
                    bg-white/80 dark:bg-gray-800/40 
                    border border-gray-200 dark:border-white/10 
                    text-gray-600 dark:text-gray-400 
                    hover:bg-gray-50 dark:hover:bg-gray-800 
                    hover:text-gray-900 dark:hover:text-white
                    backdrop-blur-md shadow-sm hover:shadow-md
                  "
                >
                  <RefreshCcw
                    className={`w-3.5 h-3.5 ${
                      isRefreshing ? "animate-spin text-indigo-500" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600"
                    }`}
                  />
                  <span>Refresh</span>
                </button>

                {/* Motion toggle */}
                <button
                  onClick={() => setReduceMotion((p) => !p)}
                  className={`
                    inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-95 backdrop-blur-md shadow-sm
                    ${reduceMotion
                      ? "bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900" // Active (Contrast)
                      : "bg-white/80 dark:bg-gray-800/40 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800" // Inactive (Ghost)
                    }
                  `}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{reduceMotion ? "Reduced Motion" : "Full Motion"}</span>
                </button>

                {/* View mode */}
                <button
                  onClick={() => setViewMode((v) => (v === "GRID" ? "COMPACT" : "GRID"))}
                  className="
                    ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95
                    bg-white/80 dark:bg-gray-800/40 
                    border border-gray-200 dark:border-white/10 
                    text-gray-600 dark:text-gray-400 
                    hover:bg-gray-50 dark:hover:bg-gray-800 
                    hover:text-gray-900 dark:hover:text-white
                    backdrop-blur-md shadow-sm hover:shadow-md
                  "
                >
                  <ArrowUpRight className={`w-3.5 h-3.5 transition-transform duration-300 ${viewMode === "GRID" ? "rotate-0" : "rotate-45"}`} />
                  <span>{viewMode === "GRID" ? "Compact View" : "Grid View"}</span>
                </button>
              </div>
            </div>

            {/* Right: Quick stats */}
            <motion.div
              variants={softPop}
              className="grid grid-cols-3 gap-3 w-full xl:w-[520px]"
            >
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-[0.10] dark:opacity-[0.12]" />
                <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase">
                  Departments
                </p>
                <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
                  {departments.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  Total units
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 relative overflow-hidden">
                <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase">
                  Open / Closed
                </p>
                <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
                  {openCount}
                  <span className="text-gray-300 dark:text-gray-700">/</span>
                  {closedCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  Status split
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 relative overflow-hidden">
                <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase">
                  Total Waiting
                </p>
                <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
                  {totalWaiting}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Across queues
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Controls row */}
        <div className="px-6 pb-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="w-4 h-4" />
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search department, doctor, patient..."
                  className="w-full pl-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition"
                />

                {search.trim().length > 0 && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* tiny helper */}
              <div className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <ChevronRight className="w-3.5 h-3.5" />
                Tip: search works for department name, doctor name, and patient name
              </div>
            </div>

            {/* Filter + Sort + Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Filter Pills */}
              <div className="flex p-1 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                {["ALL", "OPEN", "CLOSED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      filterStatus === status
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md"
                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Sort
                </p>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 outline-none"
                >
                  <option value="PRIORITY">Priority</option>
                  <option value="NAME">Name</option>
                  <option value="WAITING">Waiting</option>
                  <option value="SERVING">Serving</option>
                </select>
              </div>

              {/* Legend toggle */}
              <button
                onClick={() => setShowLegend((p) => !p)}
                className={`
                  group inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-95
                  ${showLegend 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400" 
                    : "bg-white/80 dark:bg-gray-800/40 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  } backdrop-blur-md shadow-sm hover:shadow-md
                `}
              >
                <SlidersHorizontal className={`w-4 h-4 transition-transform duration-300 ${showLegend ? "rotate-180" : ""}`} />
                <span>{showLegend ? "Hide Legend" : "Show Legend"}</span>
              </button>
            </div>
          </div>

          {/* Legend */}
          <AnimatePresence>
            {showLegend && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4"
              >
                <p className="text-xs font-black tracking-widest text-gray-400 uppercase">
                  Status legend
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40">
                    <BadgeCheck className="w-4 h-4" />
                    Stable (0–9 waiting)
                  </span>

                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40">
                    <Activity className="w-4 h-4" />
                    Moderate (10–19 waiting)
                  </span>

                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40">
                    <AlertTriangle className="w-4 h-4" />
                    High load (20+ waiting)
                  </span>

                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                    <PauseCircle className="w-4 h-4" />
                    Closed queue
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subtle divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
      </motion.div>

      {/* ================= QUEUE GRID ================= */}
      <motion.div
        layout
        variants={reduceMotion ? undefined : gridVariants}
        initial={reduceMotion ? undefined : "hidden"}
        animate={reduceMotion ? undefined : "visible"}
        className={`grid ${
          viewMode === "GRID"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
        } gap-6`}
      >
        <AnimatePresence mode="popLayout">
          {filteredDepts?.map((dept) => {
            const risk = getQueueRisk(dept);
            const badge = riskBadge(risk);
            const isHighlighted = highlightDeptId === dept._id;

            return (
              <motion.div
                key={dept._id}
                variants={reduceMotion ? undefined : cardVariants}
                initial={reduceMotion ? undefined : "hidden"}
                animate={reduceMotion ? undefined : "visible"}
                exit={reduceMotion ? undefined : "exit"}
                layout
                whileHover={reduceMotion ? undefined : { y: -4 }}
                transition={
                  reduceMotion
                    ? undefined
                    : { type: "spring", stiffness: 240, damping: 22 }
                }
                className={`relative overflow-hidden rounded-3xl border shadow-sm ${
                  dept?.isOpen
                    ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                    : "bg-gray-100 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 opacity-80"
                }`}
              >
                {/* Live Highlight Glow */}
                {isHighlighted && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    {...pulseRing}
                    style={{
                      background:
                        "radial-gradient(circle at 20% 10%, rgba(16,185,129,0.18), transparent 55%)",
                    }}
                  />
                )}

                {/* Top Accent Bar */}
                <div
                  className={`h-1.5 w-full ${
                    !dept.isOpen
                      ? "bg-gray-300 dark:bg-gray-700"
                      : dept.waiting > 15
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        Department
                      </p>
                      <h3 className="mt-1 font-black text-gray-900 dark:text-white truncate">
                        {dept?.name}
                      </h3>

                      {/* Doctor + Patient */}
                      <div className="mt-2 space-y-1">
                        {dept.isOpen ? (
                          <>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span className="font-semibold">
                                {dept?.doctor || "-"}
                              </span>
                            </p>

                            {dept?.currentPatient &&
                              dept.currentPatient !== "-" && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" />
                                  <span className="font-semibold">
                                    {dept.currentPatient}
                                  </span>
                                </p>
                              )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <PauseCircle className="w-3.5 h-3.5" />
                            Queue closed
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status + Risk */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          dept.isOpen
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40"
                            : "bg-gray-200 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                        }`}
                      >
                        {dept.isOpen ? "LIVE" : "CLOSED"}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${badge.className}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Serving Card */}
                  <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4 overflow-hidden">
                    {/* shimmer effect when highlighted */}
                    {isHighlighted && (
                      <motion.div
                        variants={shimmer}
                        initial="initial"
                        animate="animate"
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                        }}
                      />
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5" />
                          Currently Serving
                        </p>

                        <p
                          className={`mt-2 text-4xl font-black ${
                            dept?.isOpen
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-400 dark:text-gray-600"
                          }`}
                        >
                          {dept?.serving}
                        </p>
                      </div>

                      <div
                        className={`p-3 rounded-2xl border ${
                          dept?.isOpen
                            ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                            : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <MonitorPlay
                          className={`w-6 h-6 ${
                            dept?.isOpen
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                    </div>

                    {/* micro hint */}
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <ChevronRight className="w-3.5 h-3.5" />
                        Live feed updates automatically
                      </span>
                      <span className="font-semibold">
                        {dept.isOpen ? "Active" : "Paused"}
                      </span>
                    </div>

                    {/* waiting progress bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        <span>Queue pressure</span>
                        <span>{waitingProgress(dept.waiting)}%</span>
                      </div>

                      <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${waitingProgress(dept.waiting)}%` }}
                          transition={{ duration: 0.45, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            dept.waiting >= 20
                              ? "bg-amber-500"
                              : dept.waiting >= 10
                              ? "bg-blue-500"
                              : "bg-emerald-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer metrics */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Waiting
                      </p>
                      <p
                        className={`mt-2 text-xl font-black ${
                          dept.waiting > 20
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {dept?.waiting}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {dept.isOpen
                          ? dept.waiting > 0
                            ? "Patients in queue"
                            : "No waiting"
                          : "Queue inactive"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Avg Time
                      </p>
                      <p className="mt-2 text-xl font-black text-gray-900 dark:text-white">
                        {dept?.avgWait}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Estimated slot duration
                      </p>
                    </div>
                  </div>
                </div>

                {/* Corner watermark */}
                <div className="absolute -right-10 -bottom-10 opacity-[0.06] dark:opacity-[0.08] pointer-events-none">
                  <Building2 className="w-40 h-40 text-gray-900 dark:text-white" />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {filteredDepts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 text-center"
        >
          <div className="mx-auto w-14 h-14 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
            <Filter className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-black text-gray-900 dark:text-white">
            No departments found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try changing the filter, sorting option, or search query.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setFilterStatus("ALL");
                setSearch("");
                setSortBy("PRIORITY");
              }}
              className="px-4 py-2 rounded-2xl text-sm font-bold border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Reset view
            </button>
            <button
              onClick={manualRefresh}
              className="px-4 py-2 rounded-2xl text-sm font-bold bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90 transition"
            >
              Refresh data
            </button>
          </div>
        </motion.div>
      )}

      {/* Footer hint */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500">
        This monitor updates live via socket events. Data may refresh periodically
        to sync waiting counts.
      </div>
    </motion.div>
  );
};

export default AdminQueueMonitor;
