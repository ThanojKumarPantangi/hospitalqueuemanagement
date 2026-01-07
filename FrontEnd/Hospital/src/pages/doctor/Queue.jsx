import React, { useState,useEffect} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,Volume2,UserMinus,Clock,ClipboardList,CheckCircle2,
    Search,History,AlertTriangle,UserCheck,
    Calendar,ChevronRight,Pill,User } from "lucide-react";
import Navbar from "../../components/Navbar/DoctorNavbar";
import "./queue.css";
import Toast from "../../components/ui/Toast";
import { callNextPatientApi,completeCurrentTokenApi,skipCurrentTokenApi,getDoctorQueueSummary} from "../../api/doctor.api";
import VisitRecordModal from "../../components/visit/VisitModal";
import VisitDetailsModal from "../../components/visit/VisitDetailsModal";
import {getDoctorPatientVisitsApi,createVisitApi} from "../../api/visit.api";
import AsyncMotionButton from "../../components/buttonmotion/AsyncMotionButton";



const DoctorQueue = () => {

  const [queue, setQueue] = useState({
        totalToday: 0,
        completed: 0,
        remaining: 0,
        nextWaiting: [],
    });


    const [toast, setToast] = useState(null);

    const [view, setView] = useState('check');
    const [searchTerm, setSearchTerm] = useState('');
    const [history, setHistory] = useState([]);
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  
    // Button animation
    const [loading, setLoading] = useState({
      next: false,
      complete: false,
      skip: false,
      addVisit: false,
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

// Dashboard Summary
async function fetchDashboardSummary() {
  try {
    const res = await getDoctorQueueSummary();
    setQueue(res?.data?.data);
  } catch (error) {
    setToast({
      type: "error",
      message:
        error?.response?.data?.message ||
        "Failed To Fetch The Dashboard Summary",
    });
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

// CallNext Token
async function CallNextToken() {
  try {
    // 1️⃣ Call next patient
    const res = await callNextPatientApi();
    const tokenData = res?.data?.token;

    if (!tokenData) {
      throw new Error("Token not received");
    }

    // 2️⃣ Store token in state + storage
    setToken(tokenData);
    localStorage.setItem("currentToken", JSON.stringify(tokenData));
    fetchDashboardSummary();

    // 3️⃣ Fetch visits using returned patientId
    const patientId = tokenData?.patient?._id;
    if (patientId) {
      const visitsRes = await getDoctorPatientVisitsApi(patientId);
      setHistory(visitsRes?.data?.visits || []);
    }

    // 4️⃣ Toast
    setToast({
      type: "success",
      message:
        res?.response?.data?.message || "Next Patient Called Successfully",
    });
  } catch (error) {
    setToast({
      type: "error",
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to call next patient",
    });
  }
}

async function restorePatientVisits(patientId) {
  try {
    const res = await getDoctorPatientVisitsApi(patientId);
    setHistory(res?.data?.visits || []);
  } catch (err) {
    console.error("Failed to restore visits", err);
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

    setHistory([])

    const clearCurrentToken = () => {
        setToken(null);
        localStorage.removeItem("currentToken");
    };
    clearCurrentToken();
    fetchDashboardSummary();

  } catch (error) {
    setToast({
      type: "error",
      message:
        error?.response?.data?.message || "Not Completed Successfully",
    });
  }
}

//Skip Token
async function SkipToken() {
  try {
    const res = await skipCurrentTokenApi();

    setToast({
      type: "success",
      message: res?.response?.data?.message || "Skipped Successfully",
    });

    setHistory([])

    const clearCurrentToken = () => {
        setToken(null);
        localStorage.removeItem("currentToken");
    };
    clearCurrentToken();

    fetchDashboardSummary();

  } catch (error) {
    setToast({
      type: "error",
      message:
        error?.response?.data?.message || "Something went wrong",
    });
  }
}

// Creat Visit History Api
async function handleSaveVisit(visitData) {
  try {
    
   const res= await createVisitApi({
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
  }
}


const filteredHistory = Array.isArray(history)
  ? history.filter((visit) => {
      const term = searchTerm.toLowerCase();

      const diagnosis =
        visit?.diagnosis?.toLowerCase() || "";

      const date =
        visit?.date
          ? new Date(visit.date).toDateString().toLowerCase()
          : "";

      return (
        diagnosis.includes(term) ||
        date.includes(term)
      );
    })
  : [];


const containerVars = {
hidden: { opacity: 0 },
visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVars = {
hidden: { opacity: 0, y: 16 },
visible: { opacity: 1, y: 0 },
};

  return (
    <>
        {/* Notifications */}
        {toast && (
        <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
        />
        )}

        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
            <Navbar activePage="Queue" />

            <motion.main
                variants={containerVars}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto px-6 pt-8 pb-24"
            >
                {/* ================= MAIN GRID ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">

                {/* ================= LEFT WORKFLOW ================= */}
                <div className="space-y-6">

                    {/* ===== CURRENT TOKEN ===== */}
                    <motion.section variants={itemVars} className="relative">
                        <div className="relative bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-xl">
                            <div className="flex flex-col md:flex-row justify-between gap-8">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                <span className="relative flex h-3 w-3" aria-hidden>
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                                </span>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                    Now Consulting
                                </p>
                                </div>

                                <h2 className="text-7xl font-black text-gray-900 dark:text-white tracking-tight">
                                #{token?.tokenNumber}
                                </h2>
                                <p className="text-xl font-bold text-gray-600 dark:text-gray-300 mt-2">
                                {token?.patient?.name?.toUpperCase()}
                                </p>

                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400 font-medium">
                                <Clock size={14} aria-hidden /> <span>Started 12 mins ago</span>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center gap-3 min-w-[220px]">
                                <AsyncMotionButton
                                    loading={loading.complete}
                                    loadingText="COMPLETING…"
                                    onClick={() => withLoading("complete", CompleteToken)}
                                    icon={<CheckCircle2 size={20} />}
                                    className="py-4 bg-teal-600 text-white rounded-2xl font-bold shadow-lg"
                                    >
                                    Complete Visit
                                </AsyncMotionButton>

                                <AsyncMotionButton
                                    loading={loading.skip}
                                    loadingText="SKIPPING…"
                                    onClick={() => withLoading("skip", SkipToken)}
                                    icon={<UserMinus size={20} />}
                                    className="py-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl font-bold border border-amber-100"
                                    >
                                    Skip Patient
                                </AsyncMotionButton>

                            </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* ===== NEXT TOKEN + STATS ===== */}
                    <motion.section
                        variants={itemVars}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                                <Volume2 size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-800 dark:text-white">
                                Call Next Patient
                                </h3>
                                <p className="text-xs text-gray-400 font-medium">
                                Announce & move queue forward
                                </p>
                            </div>
                            </div>

                            <AsyncMotionButton
                                loading={loading.next}
                                loadingText="CALLING…"
                                onClick={() => withLoading("next", CallNextToken)}
                                className="px-8 py-3 bg-gray-900 dark:bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg"
                            >
                                NEXT PATIENT {<ChevronRight size={16} />}
                            </AsyncMotionButton>

                        </div>

                        <div className="bg-emerald-500 rounded-[2rem] p-6 flex items-center justify-between text-white shadow-lg shadow-emerald-500/20">
                            <div className="flex items-center gap-3">
                            <Users size={24} className="opacity-80" />
                            <span className="text-sm font-black uppercase tracking-widest">
                                Waiting
                            </span>
                            </div>
                            <span className="text-3xl font-black" aria-live="polite">{queue?.remaining}</span>
                        </div>
                    </motion.section>

                    {/* ===== Visit History ===== */}
                    <motion.div
                        variants={itemVars}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6"
                    >
                        {/* Navigation Toggle */}
                        <div className="flex bg-slate-100 dark:bg-gray-800/50 p-1 rounded-2xl border border-slate-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setView('create')}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${ 
                                    view === 'create' 
                                    ? 'bg-white dark:bg-gray-700 text-teal-600 shadow-sm' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                                aria-pressed={view === 'create'}
                            >
                                ADD VISIT
                            </button>
                            <button
                                type="button"
                                onClick={() => setView('check')}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${ 
                                    view === 'check' 
                                    ? 'bg-white dark:bg-gray-700 text-teal-600 shadow-sm' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                                aria-pressed={view === 'check'}
                            >
                                CHECK HISTORY
                            </button>
                        </div>

                        <AnimatePresence mode="sync">
                            {view === 'create' ? (
                                /* --- PART 1: CREATING VISIT HISTORY --- */
                            <motion.div
                                key="create"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-5"
                                >
                                <button
                                    type="button"
                                    onClick={() => setIsVisitModalOpen(true)}
                                    className="
                                    w-full
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
                            ) : (
                                /* --- PART 2: CHECKING VISIT HISTORY --- */
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
                                            className="w-full bg-slate-50 dark:bg-gray-800/50 pl-12 pr-6 py-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-teal-500/20 outline-none dark:text-white transition-all"
                                        />
                                    </div>

                                    {/* History List */}
                                    <div 
                                        className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar" 
                                        role="list" 
                                        aria-label="Visit history list"
                                    >
                                        {filteredHistory.length > 0 ? (
                                            <div className="grid gap-4">
                                                {filteredHistory.map((v, index) => {
                                                    // High-visibility fallback for status
                                                    const status = statusConfig[v.status] || {
                                                    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
                                                    icon: ClipboardList // Fallback icon
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
                                                        {/* Hover Glow Effect */}
                                                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                                        <div className="relative flex flex-col md:flex-row justify-between items-center gap-6">
                                                            {/* Left Side: Icon & Primary Info */}
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
                                                                    {new Date(v.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                                    </div>
                                                                </div>
                                                                </div>
                                                            </div>

                                                            {/* Right Side: Stats & Action */}
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
                                            /* --- Empty State --- */
                                            <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800/50">
                                            <div className="w-20 h-20 mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mb-4">
                                                <History className="text-teal-500/50" size={32} strokeWidth={1.5} />
                                            </div>
                                            <h4 className="text-slate-900 dark:text-white font-black text-lg">No visits found</h4>
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
                    <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded-md">
                        AUTO SYNC
                    </span>
                    </div>

                    <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar" aria-label="Live queue">
                        <AnimatePresence mode="sync">
                            {queue?.nextWaiting.length === 0 ? (
                                /* ================= EMPTY STATE ================= */
                                <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-16
                                            text-center bg-slate-50 dark:bg-gray-800
                                            rounded-[1.5rem] border border-dashed
                                            border-gray-200 dark:border-gray-700"
                                >
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-900
                                                flex items-center justify-center mb-4">
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
                                /* ================= QUEUE LIST ================= */
                                (queue?.nextWaiting || []).map((item) => (
                                    <motion.div
                                        key={item.token}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        whileHover={{ y: -2 }}
                                        className="group relative bg-white dark:bg-slate-900/50 p-4 rounded-[2rem]
                                                    border border-slate-200/60 dark:border-slate-800
                                                    shadow-sm hover:shadow-xl hover:shadow-teal-500/10 
                                                    hover:border-teal-500/30 transition-all duration-300
                                                    flex items-center justify-between"
                                        >
                                        {/* Left Section: Token & Info */}
                                        <div className="flex items-center gap-5">
                                            {/* Token Badge - More prominent and stylized */}
                                            <div className="relative w-16 h-16 flex-shrink-0">
                                            <div className="absolute inset-0 bg-teal-500/10 dark:bg-teal-500/20 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform" />
                                                <div className="relative w-full h-full rounded-2xl bg-white dark:bg-slate-800 
                                                                border border-slate-100 dark:border-slate-700
                                                                flex flex-col items-center justify-center shadow-sm">
                                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-tighter leading-none mb-1">
                                                    Token
                                                    </span>
                                                    <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                                                    {item.token}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Patient Info */}
                                            <div>
                                                <h4 className="font-black text-slate-900 dark:text-slate-100 text-lg leading-tight mb-1.5">
                                                    {item.name}
                                                </h4>
                                                
                                                <div className="flex items-center gap-3">
                                                    {/* Priority Badge */}
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
                                                    <div className="flex items-center gap-3">
                                                        {/* Time with Icon */}
                                                        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-bold text-[11px]">
                                                            <Clock size={12} strokeWidth={3} />
                                                            {item.time}
                                                        </div>
                                                    </div>
                                                    
                                                </div>
                                                
                                            </div>
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
            />

            <VisitDetailsModal 
                isOpen={!!selectedVisit} 
                onClose={() => setSelectedVisit(null)} 
                visit={selectedVisit}
                statusConfig={statusConfig}
            />

        </div>
    </>
  );
};

export default DoctorQueue;