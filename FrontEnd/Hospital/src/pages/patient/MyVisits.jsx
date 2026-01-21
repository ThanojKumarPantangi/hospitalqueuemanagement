import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  UserCheck,
  AlertTriangle,
  Clock,
  ChevronRight,
  Search,
  History,
  Sparkles,
  Filter,
  Stethoscope,
  Building2,
  Pill,
} from "lucide-react";

import CustomCalendar from "../../components/Calendar/CustomCalendar";
import Navbar from "../../components/Navbar/PatientNavbar";
import Loader from "../../components/animation/Loader";
import { showToast } from "../../utils/toastBus.js";
import { getPatientVisitsApi } from "../../api/visit.api";
import VisitDetailsModal from "../../components/visit/VisitDetailsModal";

/* ===================== STATUS CONFIG ===================== */

const statusConfig = {
  COMPLETED: {
    label: "Completed",
    icon: UserCheck,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: AlertTriangle,
    color: "text-rose-600 bg-rose-50 dark:bg-rose-500/10",
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300",
  },
  NO_SHOW: {
    label: "No Show",
    icon: Clock,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  },
};

/* ===================== ANIMATIONS ===================== */

const pageVars = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const blockVars = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 160, damping: 18 } },
};

const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: { y: -3, scale: 1.01 },
  tap: { scale: 0.99 },
};

const shimmer = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

const MyVisits = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const MIN_LOADER_TIME = 2500;

  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();

    const fetchVisits = async () => {
      try {
        const res = await getPatientVisitsApi();
        if (isMounted) {
          setVisits(Array.isArray(res?.data?.visits) ? res.data.visits : []);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          showToast({
            type: "error",
            message: error?.response?.data?.message || "Failed to load visit history",
          });
        }
      } finally {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(MIN_LOADER_TIME - elapsed, 0);

        setTimeout(() => {
          if (isMounted) setLoading(false);
        }, remaining);
      }
    };

    fetchVisits();
    return () => {
      isMounted = false;
    };
  }, []);

  /* ===================== FILTER LOGIC ===================== */

  const filteredVisits = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return visits.filter((v) => {
      const matchesSearch =
        v.doctor?.name?.toLowerCase().includes(q) ||
        v.department?.name?.toLowerCase().includes(q);

      const matchesDate =
        !selectedDate ||
        new Date(v.createdAt).toISOString().slice(0, 10) === selectedDate;

      return matchesSearch && matchesDate;
    });
  }, [visits, searchQuery, selectedDate]);

  /* ===================== SUMMARY (UI ONLY) ===================== */

  const summary = useMemo(() => {
    const total = visits.length;

    const completed = visits.filter((v) => v.status === "COMPLETED").length;
    const cancelled = visits.filter((v) => v.status === "CANCELLED").length;
    const noShow = visits.filter((v) => v.status === "NO_SHOW").length;

    const medsTotal = visits.reduce((acc, v) => acc + (v.prescriptions?.length || 0), 0);

    return { total, completed, cancelled, noShow, medsTotal };
  }, [visits]);

  /* ===================== LOADER ===================== */

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[#212121]/80 backdrop-blur-sm">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar activePage="Visit History" />

      <motion.main
        variants={pageVars}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 pt-10 pb-24"
      >
        {/* ===================== HEADER ===================== */}
        <motion.header
          variants={blockVars}
          className="relative overflow-hidden rounded-[2.75rem] border border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-7 md:p-10 mb-10"
        >
          {/* Glow / Accent */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-teal-400 via-cyan-300 to-indigo-400 dark:opacity-15" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-rose-300 via-amber-200 to-purple-300 dark:opacity-10" />

          <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-900/30">
                <History size={16} />
                <span className="text-xs font-black uppercase tracking-widest">
                  Medical Records
                </span>
                <Sparkles size={14} className="opacity-70" />
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-4">
                My{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">
                  Visit History
                </span>
              </h1>

              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-2 max-w-xl leading-relaxed">
                Search past consultations, filter by date, and open a detailed report anytime.
              </p>
            </div>

            {/* Right Summary Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="rounded-2xl bg-slate-50 dark:bg-gray-800/40 border border-slate-100 dark:border-gray-800 p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Building2 size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Total</span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {summary.total}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-gray-800/40 border border-slate-100 dark:border-gray-800 p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <UserCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Completed
                  </span>
                </div>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {summary.completed}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-gray-800/40 border border-slate-100 dark:border-gray-800 p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <AlertTriangle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Cancelled
                  </span>
                </div>
                <p className="text-2xl font-black text-rose-600 mt-1">
                  {summary.cancelled}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-gray-800/40 border border-slate-100 dark:border-gray-800 p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Pill size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Meds
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {summary.medsTotal}
                </p>
              </div>
            </div>
          </div>
        </motion.header>

        {/* ===================== SEARCH & FILTER ===================== */}
        <motion.section variants={blockVars} className="mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
            {/* Search */}
            <motion.div variants={shimmer} className="relative">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-indigo-500/10 blur-xl opacity-40 pointer-events-none" />
              <div className="relative flex items-center gap-3 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-[2rem] px-4 py-3.5 shadow-sm">
                <div className="h-10 w-10 rounded-2xl bg-slate-50 dark:bg-gray-800 flex items-center justify-center border border-slate-100 dark:border-gray-700">
                  <Search className="text-slate-400" size={18} />
                </div>

                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Search
                  </p>
                  <input
                    type="text"
                    placeholder="Doctor or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">
                  <Filter size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">
                    Smart Filter
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Calendar */}
            <motion.div variants={shimmer} className="flex justify-start lg:justify-end">
              <div className="w-full lg:w-auto">
                <CustomCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
              </div>
            </motion.div>
          </div>

          {/* Active filters hint */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <AnimatePresence mode="popLayout">
              {searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  className="px-3 py-1.5 rounded-2xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-900/30 text-teal-700 dark:text-teal-300"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Search: {searchQuery}
                  </span>
                </motion.div>
              )}

              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  className="px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 text-slate-700 dark:text-slate-200"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Date: {selectedDate}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* ===================== VISIT LIST STATES ===================== */}
        <motion.section variants={blockVars} className="grid gap-6">
          {/* 🟡 No visit history */}
          {visits.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center text-center py-20"
            >
              <div className="h-20 w-20 rounded-[2rem] bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 flex items-center justify-center shadow-sm mb-5">
                <History size={34} className="text-slate-300 dark:text-slate-600" />
              </div>

              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                No visit history yet
              </h3>

              <p className="text-sm text-slate-500 mt-2 max-w-sm font-semibold leading-relaxed">
                Once you consult a doctor, your medical visits will appear here automatically.
              </p>
            </motion.div>
          )}

          {/* 🟠 No results after filters */}
          {visits.length > 0 && filteredVisits.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-center py-16"
            >
              <div className="h-16 w-16 rounded-[1.75rem] bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 flex items-center justify-center shadow-sm mb-4">
                <Search size={26} className="text-slate-300 dark:text-slate-600" />
              </div>

              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                No matching visits found
              </h3>

              <p className="text-sm text-slate-500 mt-1 font-semibold">
                Try adjusting your search or date filter.
              </p>
            </motion.div>
          )}

          {/* 🟢 Normal visit list */}
          <AnimatePresence mode="popLayout">
            {filteredVisits.map((v, index) => {
              const status = statusConfig[v.status] || statusConfig.COMPLETED;
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={v._id}
                  layout
                  layoutId={v._id}
                  initial={{ opacity: 0, y: 12, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 170, damping: 18, delay: index * 0.02 }}
                  whileHover="hover"
                  whileTap="tap"
                  variants={cardHover}
                  onClick={() => setSelectedVisit(v)}
                  className="
                    group
                    cursor-pointer
                    relative
                    overflow-hidden
                    bg-white dark:bg-gray-900
                    rounded-[2.25rem]
                    p-6
                    border border-slate-100 dark:border-gray-800
                    shadow-sm
                    hover:shadow-2xl hover:shadow-teal-500/10
                    transition-all
                  "
                >
                  {/* hover glow */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl opacity-30 bg-gradient-to-br from-teal-400 via-cyan-300 to-indigo-400 dark:opacity-15" />
                  </div>

                  <div className="relative flex flex-col md:flex-row justify-between gap-6">
                    {/* Left */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-4 rounded-2xl ${status.color} border border-white/40 dark:border-transparent shadow-sm`}
                      >
                        <StatusIcon size={24} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-lg text-slate-900 dark:text-white truncate">
                            {v.department?.name?.toUpperCase()}
                          </h3>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status.chip}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <p className="text-slate-500 dark:text-slate-300 text-sm font-semibold mt-1 flex items-center gap-2">
                          <Stethoscope size={14} className="text-teal-600 dark:text-teal-400" />
                          Dr. {v.doctor?.name?.toUpperCase()}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-semibold">
                          <Calendar size={12} />
                          {new Date(v.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                        </div>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <div className="hidden md:block text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Medicines
                        </p>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                          {v.prescriptions?.length || 0} Prescribed
                        </p>
                      </div>

                      <motion.button
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="
                          flex items-center gap-2
                          px-6 py-3
                          bg-slate-50 dark:bg-gray-800
                          border border-slate-100 dark:border-gray-700
                          rounded-2xl
                          text-xs font-black uppercase tracking-wider
                          text-slate-800 dark:text-white
                          group-hover:bg-teal-600 group-hover:text-white
                          group-hover:shadow-lg group-hover:shadow-teal-500/25
                          transition-all
                        "
                      >
                        View Report <ChevronRight size={14} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.section>
      </motion.main>

      <VisitDetailsModal
        isOpen={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
        visit={selectedVisit}
        statusConfig={statusConfig}
      />
    </div>
  );
};

export default MyVisits;