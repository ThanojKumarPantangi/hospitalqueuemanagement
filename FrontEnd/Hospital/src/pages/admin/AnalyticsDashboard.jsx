import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  AlertCircle,
  ArrowRight,
  LayoutGrid,
  List,
  BarChart2,
} from "lucide-react";

// ✅ Use your real API + real toast
import { analyticsApi } from "../../api/analytics.api";
import { showToast } from "../../utils/toastBus";

/* ----------------------------------------------------------------------------------
   1. UTILITIES & ANIMATION VARIANTS
   ---------------------------------------------------------------------------------- */

const cn = (...classes) => classes.filter(Boolean).join(" ");

const niceNumber = (n) => {
  if (n === null || n === undefined) return "-";
  if (typeof n !== "number") return n;
  return new Intl.NumberFormat("en-IN").format(n);
};

const formatDateInput = (date) => {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 50, damping: 15 },
  },
};

// const chartVariants = {
//   hidden: { opacity: 0, scale: 0.95 },
//   visible: {
//     opacity: 1,
//     scale: 1,
//     transition: { duration: 0.5, ease: "easeOut" },
//   },
// };

/* ----------------------------------------------------------------------------------
   2. UI SUB-COMPONENTS
   ---------------------------------------------------------------------------------- */

/**
 * A reusable loading skeleton that shimmers.
 */
const Skeleton = ({ className, delay = 0 }) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-md bg-gray-200/50 dark:bg-white/5",
      className
    )}
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
  </div>
);

/**
 * A glass-morphic card container with optional header actions.
 */
const GlassCard = ({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
  noPadding = false,
}) => {
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-white/20 bg-white/70 shadow-xl backdrop-blur-xl transition-all hover:shadow-2xl dark:border-white/5 dark:bg-[#12141c]/80 dark:shadow-black/40",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-white/5" />

      <div className="relative flex flex-col h-full">
        {/* Header Section */}
        {(title || action) && (
          <div className="flex items-start justify-between p-6 pb-2">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600 dark:from-blue-400/10 dark:to-indigo-400/10 dark:text-blue-400">
                  <Icon size={20} strokeWidth={2} />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {action && <div className="z-10">{action}</div>}
          </div>
        )}

        {/* Content Section */}
        <div className={cn("flex-1 relative z-10", !noPadding && "p-6 pt-2")}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * High-impact metric card with trend indicator styles.
 */
const StatCard = ({
  label,
  value,
  subValue,
  icon: Icon,
  colorClass,
  loading,
  delay,
}) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/80 to-white/40 p-5 shadow-lg backdrop-blur-md dark:border-white/5 dark:bg-[#12141c]/60 dark:from-[#1A1D26] dark:to-[#12141c]"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <Skeleton className="h-9 w-24 rounded-lg" delay={delay} />
            ) : (
              <motion.h4
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-3xl font-extrabold text-gray-900 dark:text-white"
              >
                {value}
              </motion.h4>
            )}
          </div>
        </div>

        <div
          className={cn(
            "rounded-2xl p-3 shadow-inner ring-1 ring-inset ring-white/10",
            colorClass
          )}
        >
          <Icon size={24} className="text-white" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {loading ? (
          <Skeleton className="h-4 w-32 rounded-full" delay={delay + 0.1} />
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
            {subValue && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 dark:bg-white/5">
                {subValue}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Custom Tooltip for Recharts to match the glass theme.
 */
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/20 bg-white/90 p-4 shadow-xl backdrop-blur-lg dark:border-white/10 dark:bg-gray-900/95">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <span
                className="h-2.5 w-2.5 rounded-full shadow-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 dark:text-gray-200">
                {entry.name}:
              </span>
              <span className="font-mono text-gray-900 dark:text-white">
                {niceNumber(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

/* ----------------------------------------------------------------------------------
   3. MAIN COMPONENT
   ---------------------------------------------------------------------------------- */

export default function AnalyticsDashboard() {
  /* ------------------ STATE MANAGEMENT ------------------ */
  const [loading, setLoading] = useState(true);

  // Filter States
  const [range, setRange] = useState("today");
  const [trendDays, setTrendDays] = useState(7);
  const [peakDate, setPeakDate] = useState(formatDateInput(new Date()));

  // Data States
  const [dailyCount, setDailyCount] = useState(0);
  const [deptLoad, setDeptLoad] = useState([]);
  const [doctorWorkload, setDoctorWorkload] = useState([]);
  const [waiting, setWaiting] = useState({
    avgWaitingMinutes: 0,
    totalCalled: 0,
  });

  const [throughput, setThroughput] = useState({
    totalCreated: 0,
    totalCompleted: 0,
    totalWaiting: 0,
    totalCalled: 0,
  });

  const [cancelRate, setCancelRate] = useState({
    total: 0,
    cancelled: 0,
    noShow: 0,
    cancelRatePercent: 0,
    noShowRatePercent: 0,
  });

  const [doctorUtilization, setDoctorUtilization] = useState([]);
  const [liveQueue, setLiveQueue] = useState([]);
  const [trend, setTrend] = useState([]);
  const [peakHours, setPeakHours] = useState([]);

  // UI Local States
  const [queueSearch, setQueueSearch] = useState("");
  const [queueSortBy, setQueueSortBy] = useState("waiting"); // waiting | called
  const [utilSearch, setUtilSearch] = useState("");

  /* ------------------ API LOGIC (REAL) ------------------ */

  const safeApiCall = async (fn, onSuccess) => {
    try {
      const res = await fn();
      onSuccess(res.data);
    } catch (err) {
      showToast({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Analytics fetch failed. Please try again.",
      });
    }
  };

  const loadAll = async () => {
    setLoading(true);

    await Promise.all([
      safeApiCall(analyticsApi.dailyPatientCount, (data) =>
        setDailyCount(data.count || 0)
      ),

      safeApiCall(analyticsApi.departmentLoad, (data) =>
        setDeptLoad(data.data || [])
      ),

      safeApiCall(() => analyticsApi.doctorWorkload(range), (data) =>
        setDoctorWorkload(data.data || [])
      ),

      safeApiCall(analyticsApi.todayAvgWaitingTime, (data) =>
        setWaiting({
          avgWaitingMinutes: data.avgWaitingMinutes || 0,
          totalCalled: data.totalCalled || 0,
        })
      ),

      safeApiCall(() => analyticsApi.throughput(range), (data) =>
        setThroughput({
          totalCreated: data.totalCreated || 0,
          totalCompleted: data.totalCompleted || 0,
          totalWaiting: data.totalWaiting || 0,
          totalCalled: data.totalCalled || 0,
        })
      ),

      safeApiCall(() => analyticsApi.cancelRate(range), (data) =>
        setCancelRate({
          total: data.total || 0,
          cancelled: data.cancelled || 0,
          noShow: data.noShow || 0,
          cancelRatePercent: data.cancelRatePercent || 0,
          noShowRatePercent: data.noShowRatePercent || 0,
        })
      ),

      safeApiCall(() => analyticsApi.doctorUtilization(range), (data) =>
        setDoctorUtilization(data.data || [])
      ),

      safeApiCall(analyticsApi.liveQueue, (data) =>
        setLiveQueue(data.departments || [])
      ),

      safeApiCall(() => analyticsApi.patientTrend(trendDays), (data) =>
        setTrend(data.data || [])
      ),

      safeApiCall(() => analyticsApi.departmentPeakHours(peakDate), (data) =>
        setPeakHours(data.data || [])
      ),
    ]);

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, trendDays, peakDate]);

  /* ------------------ MEMOIZED DATA PROCESSING ------------------ */

  const throughputChart = useMemo(() => {
    return [
      { name: "Created", value: throughput.totalCreated, color: "#6366f1" },
      { name: "Waiting", value: throughput.totalWaiting, color: "#f59e0b" },
      { name: "Called", value: throughput.totalCalled, color: "#10b981" },
      { name: "Completed", value: throughput.totalCompleted, color: "#3b82f6" },
    ];
  }, [throughput]);

  const cancelPie = useMemo(() => {
    return [
      { name: "Cancelled", value: cancelRate.cancelled, color: "#ef4444" },
      { name: "No Show", value: cancelRate.noShow, color: "#f97316" },
      {
        name: "Attended",
        value: Math.max(
          0,
          cancelRate.total - cancelRate.cancelled - cancelRate.noShow
        ),
        color: "#10b981",
      },
    ];
  }, [cancelRate]);

  const peakGrouped = useMemo(() => {
    const map = new Map();
    for (const row of peakHours) {
      const hour = row.hour;
      map.set(hour, (map.get(hour) || 0) + row.count);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }));
  }, [peakHours]);

  const insights = useMemo(() => {
    const peakDept = deptLoad?.length
      ? [...deptLoad].sort(
          (a, b) => (b.waitingCount || 0) - (a.waitingCount || 0)
        )[0]
      : null;

    const topDoctor = doctorWorkload?.length
      ? [...doctorWorkload].sort(
          (a, b) => (b.patientsHandled || 0) - (a.patientsHandled || 0)
        )[0]
      : null;

    const maxHour = peakGrouped?.length
      ? [...peakGrouped].sort((a, b) => (b.count || 0) - (a.count || 0))[0]
      : null;

    return { peakDept, topDoctor, maxHour };
  }, [deptLoad, doctorWorkload, peakGrouped]);

  const filteredQueue = useMemo(() => {
    const q = queueSearch.trim().toLowerCase();
    let list = [...liveQueue];

    if (q) {
      list = list.filter((d) =>
        String(d.departmentName || "").toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (queueSortBy === "called") return (b.called || 0) - (a.called || 0);
      return (b.waiting || 0) - (a.waiting || 0);
    });

    return list;
  }, [liveQueue, queueSearch, queueSortBy]);

  const filteredUtil = useMemo(() => {
    const q = utilSearch.trim().toLowerCase();
    let list = [...doctorUtilization];
    if (q) {
      list = list.filter((d) =>
        String(d.doctorName || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => (b.patientsHandled || 0) - (a.patientsHandled || 0));
    return list;
  }, [doctorUtilization, utilSearch]);

  /* ----------------------------------------------------------------------------------
     4. COMPONENT RENDER
     ---------------------------------------------------------------------------------- */

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen space-y-8 bg-[#F8FAFC] p-4 text-gray-900 sm:p-8 lg:p-10 dark:bg-[#07090F] dark:text-gray-100"
    >
      {/* --- Header Section --- */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30 text-white">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Analytics
              </h1>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <span>Overview & Real-time Insights</span>
                <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  Live Connection
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center gap-3"
        >
          {/* Range Selector Pills */}
          <div className="flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/5 dark:bg-[#1A1D26] dark:ring-white/10">
            {["today", "week", "month"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "relative rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
                  range === r
                    ? "bg-gray-900 text-white shadow-md dark:bg-white dark:text-black"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                )}
              >
                {range === r && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg bg-transparent"
                    transition={{
                      type: "spring",
                      bounce: 0.2,
                      duration: 0.6,
                    }}
                  />
                )}
                <span className="capitalize relative z-10">{r}</span>
              </button>
            ))}
          </div>

          <button
            onClick={loadAll}
            className="group flex items-center justify-center rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-black/5 transition-all hover:bg-gray-50 hover:shadow-md active:scale-95 dark:bg-[#1A1D26] dark:ring-white/10 dark:hover:bg-[#232732]"
            title="Refresh Data"
          >
            <RefreshCw
              size={20}
              className={cn(
                "text-gray-500 transition-transform duration-700 dark:text-gray-400",
                loading && "animate-spin"
              )}
            />
          </button>
        </motion.div>
      </div>

      {/* --- Key Statistics Grid --- */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Visits Today"
          value={niceNumber(dailyCount)}
          subValue="Check-ins processed"
          icon={Users}
          colorClass="bg-blue-500 text-blue-500"
          loading={loading}
          delay={0}
        />
        <StatCard
          label="Avg. Wait Time"
          value={`${niceNumber(waiting.avgWaitingMinutes)} min`}
          subValue="Queue efficiency"
          icon={Clock}
          colorClass="bg-amber-500 text-amber-500"
          loading={loading}
          delay={0.1}
        />
        <StatCard
          label="Tokens Called"
          value={niceNumber(waiting.totalCalled)}
          subValue="Completed service"
          icon={UserCheck}
          colorClass="bg-emerald-500 text-emerald-500"
          loading={loading}
          delay={0.2}
        />
        <StatCard
          label="Tokens Created"
          value={niceNumber(throughput.totalCreated)}
          subValue={`${range} volume`}
          icon={LayoutGrid}
          colorClass="bg-violet-500 text-violet-500"
          loading={loading}
          delay={0.3}
        />
      </div>

      {/* --- Smart Insights (Highlights) --- */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 gap-5 lg:grid-cols-3"
      >
        {/* Peak Department */}
        <GlassCard
          title="Peak Department"
          subtitle="Current highest load"
          icon={Activity}
          className="bg-gradient-to-br from-rose-50/50 via-white/80 to-white/40 dark:from-rose-900/10 dark:via-[#1A1D26] dark:to-[#12141c]"
        >
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : insights.peakDept ? (
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400">
                  High Demand
                </span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                {insights.peakDept.departmentName}
              </h4>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-500">
                  {niceNumber(insights.peakDept.waitingCount)}
                </span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  waiting
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No significant load detected.
            </div>
          )}
        </GlassCard>

        {/* Top Performer */}
        <GlassCard
          title="Top Performer"
          subtitle="Highest patient turnover"
          icon={UserCheck}
          className="bg-gradient-to-br from-blue-50/50 via-white/80 to-white/40 dark:from-blue-900/10 dark:via-[#1A1D26] dark:to-[#12141c]"
        >
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : insights.topDoctor ? (
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
                  Most Active
                </span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                {insights.topDoctor.doctorName}
              </h4>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-500">
                  {niceNumber(insights.topDoctor.patientsHandled)}
                </span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  patients
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No data available.
            </div>
          )}
        </GlassCard>

        {/* Peak Hour */}
        <GlassCard
          title="Busiest Hour"
          subtitle="Peak influx time"
          icon={Clock}
          className="bg-gradient-to-br from-violet-50/50 via-white/80 to-white/40 dark:from-violet-900/10 dark:via-[#1A1D26] dark:to-[#12141c]"
        >
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : insights.maxHour ? (
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-violet-500" />
                <span className="text-xs font-bold uppercase text-violet-600 dark:text-violet-400">
                  Peak Traffic
                </span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                {insights.maxHour.hour}
              </h4>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-violet-500">
                  {niceNumber(insights.maxHour.count)}
                </span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  new tokens
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No data available.
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* --- Charts Section --- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Department Load Chart */}
        <GlassCard
          title="Department Load"
          subtitle="Current Waiting Tokens"
          icon={BarChart2}
        >
          <div className="h-80 w-full">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deptLoad}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                    className="dark:stroke-white/10"
                  />
                  <XAxis
                    dataKey="departmentName"
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomChartTooltip />}
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  />
                  <Bar
                    dataKey="waitingCount"
                    fill="url(#colorBar)"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  >
                    {deptLoad.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index % 2 === 0 ? "#6366f1" : "#818cf8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Throughput Area Chart */}
        <GlassCard
          title="Throughput Analysis"
          subtitle="Process flow volume"
          icon={TrendingUp}
        >
          <div className="h-80 w-full">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={throughputChart}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#E2E8F0"
                    className="dark:stroke-white/10"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    tick={{ fill: "#64748B", fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomChartTooltip />}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                    {throughputChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Patient Trend Line Chart */}
        <GlassCard
          title="Patient Visits Trend"
          subtitle={`Last ${trendDays} days history`}
          icon={Calendar}
          action={
            <select
              value={trendDays}
              onChange={(e) => setTrendDays(Number(e.target.value))}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white/50 px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
            </select>
          }
        >
          <div className="h-80 w-full">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                    className="dark:stroke-white/10"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                    tickFormatter={(str) => {
                      const d = new Date(str);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Cancel Rate Pie Chart */}
        <GlassCard
          title="Cancellation Analysis"
          subtitle="Appointment outcomes"
          icon={AlertCircle}
        >
          <div className="flex h-80 flex-col items-center justify-center sm:flex-row">
            {loading ? (
              <Skeleton className="h-64 w-64 rounded-full" />
            ) : (
              <>
                <div className="relative h-64 w-64 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cancelPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {cancelPie.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {niceNumber(cancelRate.total)}
                    </span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      Total
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex w-full flex-col justify-center gap-3 sm:mt-0 sm:pl-8">
                  {cancelPie.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-lg bg-gray-50/50 p-2 dark:bg-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-bold text-gray-900 dark:text-white">
                          {niceNumber(item.value)}
                        </span>
                        {(item.name === "Cancelled" || item.name === "No Show") && (
                          <span className="block text-[10px] text-gray-500">
                            {item.name === "Cancelled"
                              ? cancelRate.cancelRatePercent
                              : cancelRate.noShowRatePercent}
                            %
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </GlassCard>
      </div>

      {/* --- Peak Hours & Doctor Workload --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard
          title="Hourly Traffic"
          subtitle="Patient volume by hour"
          icon={Clock}
          action={
            <div className="relative">
              <input
                type="date"
                value={peakDate}
                onChange={(e) => setPeakDate(e.target.value)}
                className="cursor-pointer rounded-lg border border-gray-200 bg-white/50 px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
              />
            </div>
          }
        >
          <div className="h-72 w-full">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={peakGrouped}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                    className="dark:stroke-white/10"
                  />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "#64748B", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    dy={5}
                  />
                  <YAxis
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomChartTooltip />}
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard
          title="Doctor Workload"
          subtitle="Patients handled by doctor"
          icon={UserCheck}
        >
          <div className="h-72 w-full">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={doctorWorkload}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                    className="dark:stroke-white/10"
                  />
                  <XAxis
                    dataKey="doctorName"
                    tick={{ fill: "#64748B", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    dy={5}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: "#64748B", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<CustomChartTooltip />}
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  />
                  <Bar
                    dataKey="patientsHandled"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* --- Data Tables (Live Queue & Utilization) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
        {/* Live Queue Table */}
        <GlassCard
          title="Live Queue"
          subtitle="Department status monitor"
          icon={List}
          noPadding
          action={
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={14}
                />
                <input
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-32 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                />
              </div>
              <button
                onClick={() =>
                  setQueueSortBy((prev) => (prev === "waiting" ? "called" : "waiting"))
                }
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
              >
                <Filter size={12} />
                {queueSortBy === "waiting" ? "Waiting" : "Called"}
              </button>
            </div>
          }
        >
          <div className="max-h-[400px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur dark:bg-[#1A1D26]/95">
                <tr>
                  <th className="py-3 pl-6 pr-3 font-semibold text-gray-900 dark:text-white">
                    Department
                  </th>
                  <th className="py-3 px-3 font-semibold text-gray-900 dark:text-white">
                    Waiting
                  </th>
                  <th className="py-3 pl-3 pr-6 font-semibold text-gray-900 dark:text-white text-right">
                    Called
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                <AnimatePresence>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="p-4">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-4 w-12" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-4 w-12 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredQueue.length > 0 ? (
                    filteredQueue.map((row, i) => (
                      <motion.tr
                        key={row.departmentId || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 pl-6 pr-3 font-medium text-gray-700 dark:text-gray-200">
                          {row.departmentName}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10 dark:bg-rose-400/10 dark:text-rose-400 dark:ring-rose-400/20">
                            {niceNumber(row.waiting)}
                          </span>
                        </td>
                        <td className="py-3 pl-3 pr-6 text-right">
                          <span className="text-gray-500 dark:text-gray-400">
                            {niceNumber(row.called)}
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-8 text-center text-gray-500"
                      >
                        No departments found.
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Doctor Utilization Table */}
        <GlassCard
          title="Staff Performance"
          subtitle="Detailed breakdown"
          icon={UserCheck}
          noPadding
          action={
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                value={utilSearch}
                onChange={(e) => setUtilSearch(e.target.value)}
                placeholder="Filter doctors..."
                className="w-40 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
              />
            </div>
          }
        >
          <div className="max-h-[400px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur dark:bg-[#1A1D26]/95">
                <tr>
                  <th className="py-3 pl-6 pr-3 font-semibold text-gray-900 dark:text-white">
                    Doctor Name
                  </th>
                  <th className="py-3 pl-3 pr-6 font-semibold text-gray-900 dark:text-white text-right">
                    Patients Handled
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                <AnimatePresence>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="p-4">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-4 w-12 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredUtil.length > 0 ? (
                    filteredUtil.map((row, i) => (
                      <motion.tr
                        key={row.doctorId || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 pl-6 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold dark:bg-blue-900/30 dark:text-blue-400">
                              {row.doctorName.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-700 dark:text-gray-200">
                              {row.doctorName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pl-3 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {niceNumber(row.patientsHandled)}
                            </span>
                            <ArrowRight
                              size={14}
                              className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="py-8 text-center text-gray-500"
                      >
                        No data found.
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  );
}
