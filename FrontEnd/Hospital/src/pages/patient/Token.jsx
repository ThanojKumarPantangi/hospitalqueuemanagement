import { motion, AnimatePresence } from 'framer-motion';
import {Calendar as CalendarIcon, User,Users, AlertTriangle,Building2,Zap,Bell,Timer,UserCheck,QrCode,MapPin,Ticket,ChevronRight,RefreshCcw, } from 'lucide-react';
import { useEffect, useState ,useRef} from "react";

import Badge from "../../components/badge/badge.jsx";
import Navbar from "../../components/Navbar/PatientNavbar";
import Toast from "../../components/ui/Toast";
import Loader from "../../components/Loader";
import StickyMiniToken from "../../components/token/StickyMiniToken";

import { useSocket } from "../../hooks/useSocket";
import { useTokenSocket } from "../../hooks/useTokenSocket";

import {
  getMyTokenApi,
  getMyUpcomingTokensApi,
  cancelTokenApi,
  createTokenApi,
  previewTokenNumberApi,
  getAllDepartmentsApi,
  getTokenHistoryApi,
} from "../../api/token.api";

const Token = () => {
    const { socketRef, isConnected } = useSocket();
    const [allTokens, setAllTokens] = useState([]);
    const [historyFilter, setHistoryFilter] = useState("COMPLETED"); 


    const [token, setToken] = useState(null);
    const [upcomingTokens, setUpcomingTokens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);
    const [showSticky, setShowSticky] = useState(false);

    const [creating, setCreating] = useState(false);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [priority,setPriority]=useState('NORMAL');
    const [departments, setDepartments] = useState([]);
    const [departmentId, setDepartmentId] = useState('');

    const [showCreateTokenModal, setShowCreateTokenModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

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
  
  /* ---------------- TOKEN HISTORY---------------- */
  useEffect(() => {
  const fetchTokenHistory = async () => {
    try {
      const res = await getTokenHistoryApi();
      setAllTokens(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch token history", err);
    }
  };

  fetchTokenHistory();
}, []);
  
  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [t, upcoming] = await Promise.all([
          getMyTokenApi(),
          getMyUpcomingTokensApi(),
        ]);

        setToken(t?.data || null);
        setUpcomingTokens(Array.isArray(upcoming.data.data) ? upcoming.data.data : []);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

    // --- 2. Scroll Listener for Sticky Mini-Token ---
  useEffect(() => {
  let visible = false;

  const handleScroll = () => {
    const shouldShow = window.scrollY > 370;

    if (shouldShow !== visible) {
      visible = shouldShow;
      setShowSticky(shouldShow);
    }
  };

  handleScroll(); 
  window.addEventListener("scroll", handleScroll, { passive: true });

  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  /* ---------------- SOCKET ---------------- */
  useTokenSocket({
  socketRef,
  token,

  onCalled: ({ tokenId }) => {
  if (!tokenId) return;

  setToken(prev => {
    if (!prev || prev._id !== tokenId) return prev;

    setToast({
      type: "success",
      message: `Your token #${prev.tokenNumber} is being called.`,
    });

    return { ...prev, status: "CALLED" };
  });
},


  onSkipped: ({ tokenId }) => {
    if (!tokenId) return;

    setToken(prev =>
      prev && prev._id === tokenId
        ? { ...prev, status: "SKIPPED" }
        : prev
    );

    if (token?._id === tokenId) {
      setToast({
        type: "error",
        message: `Your token #${token.tokenNumber} was skipped.`,
      });
    }
  },

  onCompleted: ({ tokenId }) => {
    if (!tokenId) return;

    if (token?._id === tokenId) {
      setToast({
        type: "success",
        message: `Your token #${token.tokenNumber} is completed.`,
      });
      setToken(null);
    }
  },

  onNoShow: ({ tokenId }) => {
    if (token?._id === tokenId) {
      setToken(null);
    }
  },

  onQueueUpdate: ({ tokenId, waitingCount }) => {
    if (!tokenId || typeof waitingCount !== "number") return;

    setToken(prev =>
      prev && prev._id === tokenId
        ? { ...prev, waitingCount }
        : prev
    );
  },
});

  //create Token
  const createToken = async () => {
    if (!departmentId || !appointmentDate || !priority) {
      setToast({
        type: "error",
        message: "Please fill all the fields",
      });
      return;
    }
  
    setCreating(true); 
  
    try {
      const res =await createTokenApi({ departmentId, appointmentDate, priority});
      setShowCreateTokenModal(false);
      setToast({
        type: "success",
        message: "Token created successfully",
      });
      setAppointmentDate('');
      setDepartmentId('');
      const todayStr = formatDate(new Date());
      if (appointmentDate === todayStr) {
        setToken(res.data.token ?? res.data);
      }
    } catch (err) {
      setToast({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Error creating token. Please try again later.",
      });
    } finally {
      setCreating(false); 
    }
  };
  
  // Cancel Token Handler
  const handleCancelToken = async (tokenId) => {
    if (!tokenId || cancellingId) return;
  
    try {
      setCancellingId(tokenId);
  
      await cancelTokenApi(tokenId);
  
      // Today token
      if (token && token._id === tokenId) {
        setToken(null);
      }
  
      // Future tokens
      setUpcomingTokens(prev =>
        prev.filter(t => t._id !== tokenId)
      );
  
      setToast({
        type: "success",
        message: "Appointment cancelled successfully",
      });
  
    } catch (err) {
      setToast({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Unable to cancel appointment Try again later",
      });
    } finally {
      setCancellingId(null);
    }
  };

  // Fetch all the departments
    useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await  getAllDepartmentsApi();
        setDepartments(res.data);
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };
  
    fetchDepartments();
  }, [showCreateTokenModal]);

  // Preview Token Handler
  useEffect(() => {
    if (!departmentId || !appointmentDate) {
      setExpectedTokenNumber(null);
      return;
    }
  
    const cacheKey = `${departmentId}|${appointmentDate}`;
  
    // ✅ 1. Return cached value immediately (NO API CALL)
    if (previewCacheRef.current.has(cacheKey)) {
      setExpectedTokenNumber(previewCacheRef.current.get(cacheKey));
      return;
    }
  
    // ❌ Clear previous debounce if user clicks fast
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  
    // ⏳ Debounce API call
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setPreviewLoading(true);
  
        const res = await previewTokenNumberApi({
          departmentId,
          appointmentDate,
        });
  
        const tokenNumber = res.data.expectedTokenNumber;
  
        // ✅ Save in cache
        previewCacheRef.current.set(cacheKey, tokenNumber);
  
        setExpectedTokenNumber(tokenNumber);
      } catch (err) {
        // Silent fail – preview should never block booking
        setExpectedTokenNumber(null);
        console.log(err)
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

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Loader />
      </div>
    );
  }

  const isCalled = token?.status === "CALLED";
  const isNear = token?.waitingCount <= 3 && !isCalled;
  
  const filteredTokens = allTokens.filter((t) => {
    if (historyFilter === "COMPLETED") return t.status === "COMPLETED";
    if (historyFilter === "CANCELLED") return t.status === "CANCELLED";
    if (historyFilter === "SKIPPED") return t.status === "SKIPPED";
    return false;
});

  return (
    <>
        <StickyMiniToken
            token={token}
            show={showSticky}
        />
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 p-4 md:p-6 pb-24">
        <Navbar activePage="My Tokens" />

        <main className="max-w-5xl mx-auto space-y-8">

            {/* HEADER */}

            <header className="flex justify-between items-end">
            <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            My <span className="text-teal-600">Tokens</span>
            </h1>
            <p className="text-sm text-gray-500">
            Manage your appointments & queue
            </p>
            </div>

            <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <p className="text-[10px] font-bold uppercase text-gray-400">
            {isConnected ? "Live Connected" : "Disconnected"}
            </p>
            </div>
            </header>

            {/* ================= DYNAMIC HERO CARD (TOKEN vs NO-TOKEN) ================= */}

            <motion.section
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`relative overflow-hidden rounded-[2.75rem] p-8 md:p-10 shadow-2xl min-h-[360px] flex items-center ${
            !token
            ? "bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800"
            : isCalled
            ? "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 ring-8 ring-emerald-500/20"
            : isNear
            ? "bg-gradient-to-br from-orange-400 via-rose-500 to-red-600 ring-8 ring-orange-500/20"
            : "bg-gradient-to-br from-slate-800 via-slate-900 to-black"
            }`}
            >
            <AnimatePresence mode="wait">
            {token ? (
            /* ================= ACTIVE TOKEN ================= */
            <motion.div
                key="active"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.45 }}
                className="relative z-10 w-full flex flex-col lg:flex-row lg:items-center justify-between gap-10"
            >
                {/* LEFT BLOCK */}
                <div className="space-y-5">
                {/* STATUS BADGE */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest border border-white/30">
                    <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                    {token.status}
                </div>

                {/* TOKEN NUMBER */}
                <h1 className="text-8xl md:text-9xl font-black tracking-tighter text-white drop-shadow-xl">
                    #{token.tokenNumber}
                </h1>

                {/* MESSAGE */}
                <div className="flex items-center gap-3 text-white/90">
                    <div className={`p-2 rounded-lg ${isCalled ? "bg-emerald-400/30 animate-bounce" : "bg-white/20"}`}>
                    {isCalled ? <Bell size={22} /> : <Timer size={22} />}
                    </div>
                    <p className="text-xl font-semibold italic">
                    {isCalled
                        ? "It’s your turn. Please proceed now."
                        : `About ${token.waitingCount * 5} minutes remaining`}
                    </p>
                </div>
                </div>

                {/* RIGHT GLASS CARD */}
                <motion.div
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-1 max-w-md w-full bg-black/30 backdrop-blur-2xl rounded-[2rem] p-8 border border-white/10"
                >
                {/* HEADER */}
                <div className="flex justify-between items-center mb-8">
                    <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.25em]">
                    Queue Progress
                    </h4>
                    <RefreshCcw size={14} className="text-white/30 animate-spin-slow" />
                </div>

                {/* STEPPER */}
                <div className="relative flex justify-between px-2 mb-10">
                    <div className="absolute top-4 left-0 w-full h-1 bg-white/10 rounded-full" />
                    <motion.div
                    className="absolute top-4 left-0 h-1 bg-emerald-400 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: isCalled ? "100%" : isNear ? "60%" : "20%" }}
                    transition={{ duration: 0.9 }}
                    />

                    {[
                    { label: "Queue", active: true },
                    { label: "Near", active: isNear || isCalled },
                    { label: "Calling", active: isCalled, pulse: isCalled },
                    ].map((s, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                        <div
                        className={`h-8 w-8 rounded-full border-4 border-slate-900 flex items-center justify-center transition-all
                            ${s.active ? "bg-emerald-400" : "bg-white/10"}
                            ${s.pulse ? "animate-pulse scale-110 shadow-[0_0_16px_rgba(52,211,153,0.6)]" : ""}
                        `}
                        >
                        {s.active && <UserCheck size={14} className="text-slate-900" />}
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${s.active ? "text-white" : "text-white/30"}`}>
                        {s.label}
                        </span>
                    </div>
                    ))}
                </div>

                {/* FOOTER */}
                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                    <div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black text-white">{token.waitingCount}</span>
                        <span className="text-emerald-400 text-xs font-bold mb-1">AHEAD</span>
                    </div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Patients Remaining
                    </p>
                    </div>

                    <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-teal-50 transition-all active:scale-95">
                        <QrCode size={16} /> QR
                    </button>
                    <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all active:scale-95">
                        <MapPin size={20} />
                    </button>
                    </div>
                </div>
                </motion.div>
            </motion.div>
            ) : (
            /* ================= EMPTY STATE ================= */
            <motion.div
                key="empty"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full flex flex-col items-center text-center space-y-8"
            >
                <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="h-24 w-24 rounded-[2rem] bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center"
                >
                <Ticket size={48} />
                </motion.div>

                <div className="max-w-md">
                <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-3">
                    No Active Token
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Booking takes less than 30 seconds. Choose a department to begin.
                </p>
                </div>

                <button
                onClick={() => setShowCreateTokenModal(true)}
                className="group flex items-center gap-4 bg-teal-600 hover:bg-teal-700 text-white px-10 py-5 rounded-2xl font-bold shadow-xl transition-all hover:-translate-y-1 active:scale-95"
                >
                Generate Token
                <ChevronRight className="group-hover:translate-x-2 transition-transform" />
                </button>
            </motion.div>
            )}
            </AnimatePresence>
            </motion.section>

            {/* ================= UPCOMING TOKENS  ================= */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white dark:bg-gray-900 rounded-3xl 
                            border border-gray-100 dark:border-gray-800 
                            shadow-sm overflow-hidden"
            >
                {/* Header (fixed) */}
                <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-800 
                                flex justify-between items-center">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                    Upcoming Appointments
                    </h3>

                    {upcomingTokens.length > 0 && (
                    <span className="text-xs font-bold text-teal-600">
                        {upcomingTokens.length} Scheduled
                    </span>
                    )}
                </div>

                {/* Scrollable Content */}
                <div
                    className="
                    max-h-[320px]
                    overflow-y-auto
                    no-scrollbar
                    divide-y divide-gray-50 dark:divide-gray-800
                    "
                >
                    {upcomingTokens.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-400">
                        No upcoming appointments booked
                    </div>
                    ) : (
                    upcomingTokens.map((t) => (
                        <motion.div
                        key={t._id}
                        whileHover={{ backgroundColor: "rgba(20,184,166,0.05)" }}
                        className="p-5 flex items-center justify-between 
                                    transition-colors group"
                        >
                        {/* LEFT */}
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl 
                                            bg-teal-50 dark:bg-teal-900/30 
                                            flex items-center justify-center 
                                            text-teal-600 dark:text-teal-400 font-black">
                            #{t.tokenNumber}
                            </div>

                            <div>
                            <p className="font-bold text-gray-800 dark:text-white text-sm">
                                {t.departmentName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                {new Date(t.appointmentDate).toDateString()}
                            </p>
                            </div>
                        </div>

                        {/* RIGHT */}
                        <div className="flex items-center gap-3">
                            <Badge date={t.appointmentDate} />

                            <button
                            disabled={cancellingId === t._id}
                            onClick={() => handleCancelToken(t._id)}
                            className="text-xs font-black text-red-500 
                                        px-3 py-2 rounded-xl
                                        hover:bg-red-50 dark:hover:bg-red-900/20
                                        transition-all active:scale-95
                                        disabled:opacity-40"
                            >
                            {cancellingId === t._id ? "Cancelling…" : "Cancel"}
                            </button>
                        </div>
                        </motion.div>
                    ))
                    )}
                </div>
            </motion.section>
            {/* TOKEN HISTORY */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="bg-white dark:bg-gray-900 rounded-3xl
                            border border-gray-100 dark:border-gray-800
                            shadow-sm overflow-hidden"
            >
                {/* Header + Filter */}
                <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-800
                                flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                    <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                    Token History
                    </h3>

                    {/* Filter Buttons */}
                    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                    {["COMPLETED", "CANCELLED", "SKIPPED"].map((type) => (
                        <button
                        key={type}
                        onClick={() => setHistoryFilter(type)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all
                            ${
                            historyFilter === type
                                ? "bg-white dark:bg-gray-900 text-teal-600 shadow"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                        {type}
                        </button>
                    ))}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="max-h-[260px] overflow-y-auto no-scrollbar
                                divide-y divide-gray-50 dark:divide-gray-800">
                    {filteredTokens.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-400">
                        No {historyFilter.toLowerCase()} tokens found
                    </div>
                    ) : (
                    filteredTokens.map((t) => (
                        <motion.div
                        key={t._id}
                        whileHover={{ backgroundColor: "rgba(20,184,166,0.05)" }}
                        className="p-5 flex items-center justify-between transition-colors"
                        >
                        {/* LEFT */}
                        <div className="flex items-center gap-4">
                            <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center
                                font-black
                                ${
                                historyFilter === "COMPLETED"
                                    ? "bg-emerald-50 text-emerald-600"
                                    : historyFilter === "CANCELLED"
                                    ? "bg-rose-50 text-rose-500 line-through"
                                    : "bg-amber-50 text-amber-600"
                                }`}
                            >
                            #{t.tokenNumber}
                            </div>

                            <div>
                            <p className="font-bold text-gray-800 dark:text-white text-sm">
                                {t.departmentName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                                {new Date(t.appointmentDate).toDateString()}
                            </p>
                            </div>
                        </div>

                        {/* RIGHT STATUS BADGE */}
                        <span
                            className={`text-[10px] font-black uppercase tracking-widest
                            px-3 py-1 rounded-full
                            ${
                                historyFilter === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-600"
                                : historyFilter === "CANCELLED"
                                ? "bg-rose-100 text-rose-600"
                                : "bg-amber-100 text-amber-600"
                            }`}
                        >
                            {historyFilter}
                        </span>
                        </motion.div>
                    ))
                    )}
                </div>
            </motion.section>

            {/* Create Modal Handler*/}
            <AnimatePresence>
                {showCreateTokenModal && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] overflow-y-auto bg-black/50 backdrop-blur-sm no-scrollbar"
            >
            {/* Wrapper allows vertical movement */}
            <div className="min-h-screen flex items-start justify-center px-4 py-16">
                <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 40 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="w-full max-w-lg overflow-hidden rounded-[3rem] 
                bg-white dark:bg-gray-950 
                border border-gray-200 dark:border-gray-800 
                shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]"
                >
                {/* Top Gradient Bar */}
                <div className="h-2 bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500" />

                {/* Header */}
                <div className="px-10 pt-10 pb-6 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center 
                    rounded-[2rem] bg-gradient-to-br from-teal-500 to-emerald-600 
                    text-white shadow-lg">
                    <CalendarIcon size={32} />
                    </div>

                    <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                    Quick <span className="text-teal-600">Booking</span>
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Secure your spot in the queue instantly
                    </p>
                </div>

                {/* Content */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                    visible: { transition: { staggerChildren: 0.08 } },
                    }}
                    className="px-10 space-y-8"
                >
                    {/* Department Selector (backend-ready UI) */}
                    <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0 },
                    }}
                    className="space-y-3"
                    >
                    <label className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] 
                    text-teal-600 dark:text-teal-400">
                        Select Department
                    </label>

                    <div className="grid gap-2">
                        {departments.map((dept) => (
                        <button
                            key={dept._id}
                            onClick={() => setDepartmentId(dept._id)}
                            className={`flex items-center gap-4 rounded-2xl border-2 p-4 
                            transition-all active:scale-[0.97]
                            ${
                                departmentId === dept._id
                                ? "border-teal-500 bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300"
                                : "border-transparent bg-gray-50 dark:bg-gray-900 text-gray-500"
                            }`}
                        >
                            <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                            <span className="text-sm font-bold">{dept.name.toUpperCase()}</span>
                        </button>
                        ))}

                    </div>
                    </motion.div>

                    {/* Appointment Date (ONLY allowed days) */}
                    <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0 },
                    }}
                    className="space-y-3"
                    >
                    <label className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] 
                    text-teal-600 dark:text-teal-400">
                        Appointment Date
                    </label>

                    <div className="grid grid-cols-3 gap-3">
                        {Array.from({ length: MAX_ADVANCE_DAYS + 1 }).map((_, i) => {
                        const date = new Date(today);
                        date.setDate(today.getDate() + i);
                        const value = formatDate(date);
                        const selected = appointmentDate === value;

                        return (
                            <button
                            key={i}
                            onClick={() => setAppointmentDate(value)}
                            className={`rounded-2xl border p-4 text-center transition-all
                            ${
                                selected
                                ? "bg-teal-500 border-teal-500 text-white shadow-lg scale-[1.03]"
                                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                            >
                            <p className="text-[10px] font-black uppercase opacity-70">
                                {i === 0
                                ? "Today"
                                : i === 1
                                ? "Tomorrow"
                                : date.toLocaleDateString("en-US", { weekday: "short" })}
                            </p>
                            <p className="text-xl font-black">
                                {date.getDate()}
                            </p>
                            </button>
                        );
                        })}
                    </div>

                    {/* 🔹 Expected Token Preview (ADD HERE) */}
                    {departmentId && appointmentDate && (
                        <div
                        className="
                            mt-2
                            rounded-2xl border border-teal-200 dark:border-teal-900/40
                            bg-teal-50 dark:bg-teal-900/20
                            px-5 py-4
                            flex items-center justify-between
                        "
                        >
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">
                            Estimated Token : {appointmentDate}
                            </p>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1">
                            If You Book Now, Your Token May Be
                            </p>
                        </div>

                        <span className="text-3xl font-black text-teal-600 dark:text-teal-400">
                            #{previewLoading ? "…" : expectedTokenNumber ?? "--"}
                        </span>
                        </div>
                    )}
                    </motion.div>

                    {/* Priority */}
                    <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0 },
                    }}
                    className="space-y-3"
                    >
                    <label className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] 
                    text-teal-600 dark:text-teal-400">
                        Visit Priority
                    </label>

                    <div className="flex gap-2">
                        <button
                        onClick={() => setPriority("NORMAL")}
                        className={`flex-1 rounded-xl border-2 py-3 text-xs font-bold transition-all
                        ${
                            priority === "NORMAL"
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                            : "border-transparent bg-gray-50 dark:bg-gray-900 text-gray-400"
                        }`}
                        >
                        Normal
                        </button>

                        <button
                        disabled
                        className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 
                        text-xs font-bold text-gray-300 cursor-not-allowed flex items-center justify-center gap-1"
                        >
                        <User size={12} /> Senior
                        </button>

                        <button
                        disabled
                        className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 
                        text-xs font-bold text-gray-300 cursor-not-allowed flex items-center justify-center gap-1"
                        >
                        <AlertTriangle size={12} /> Emergency
                        </button>
                    </div>
                    </motion.div>
                </motion.div>

                {/* Footer */}
                <div className="mt-8 flex gap-4 bg-gray-50 dark:bg-gray-900/40 px-10 py-8">
                    <button
                    onClick={() => setShowCreateTokenModal(false)}
                    className="flex-1 rounded-2xl py-4 text-xs font-black uppercase tracking-widest
                    text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800
                    transition-all active:scale-95"
                    >
                    Cancel
                    </button>

                    <button
                    disabled={creating}
                    onClick={createToken}
                    className="flex-[1.5] rounded-2xl py-4 text-xs font-black uppercase tracking-widest
                    bg-gray-900 dark:bg-white text-white dark:text-gray-900
                    shadow-xl hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
                    >
                    {creating ? "Creating..." : "Confirm Booking"}
                    </button>
                </div>
                </motion.div>
            </div>
            </motion.div>
            )}
            </AnimatePresence>

            {/* Cancel Modal Handler*/}

            {showCancelModal && (
            <div className="fixed inset-0 z-[60] overflow-y-auto no-scrollbar bg-black/50 backdrop-blur-sm">
            {/* Wrapper allows vertical movement */}
            <div className="min-h-screen flex items-start justify-center px-4 py-16">
            <div
                className="
                w-full max-w-lg overflow-hidden rounded-[2.5rem]
                bg-white dark:bg-gray-900
                border border-gray-200 dark:border-gray-800
                shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]
                transition-all duration-300 ease-out
                scale-100 opacity-100
                "
            >
                {/* Top Gradient Bar */}
                <div className="h-2 w-full bg-gradient-to-r from-red-500 to-orange-500" />

                {/* Header */}
                <div className="px-8 py-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                    Manage Appointments
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Cancel your active or upcoming visits.
                </p>
                </div>

                {/* Content */}
                <div className="px-8 max-h-[420px] overflow-y-auto no-scrollbar space-y-3">
                {(!token && upcomingTokens.length === 0) ? (
                    <div className="py-10 text-center bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-400 font-bold">
                        No active appointments found.
                    </p>
                    </div>
                ) : (
                    <>
                    {/* Active Token */}
                    {token && (
                        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-900/30 flex justify-between items-center">
                        <div>
                            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
                            Active Now
                            </span>
                            <p className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                            #{token.tokenNumber} – {token.departmentName}
                            <Badge date={new Date()} />
                            </p>
                        </div>

                        <button
                            disabled={cancellingId === token._id || token.status === "CALLED"}
                            onClick={() => handleCancelToken(token._id)}
                            className="bg-red-500 hover:bg-red-600 active:bg-red-700
                            text-white px-4 py-2 rounded-xl text-xs font-bold
                            transition-all active:scale-95 disabled:opacity-40"
                        >
                            {cancellingId === token._id ? "..." : "Cancel"}
                        </button>
                        </div>
                    )}

                    {/* Upcoming Tokens */}
                    {upcomingTokens.map((t) => (
                        <div
                        key={t._id}
                        className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50
                        border border-gray-200 dark:border-gray-700
                        flex justify-between items-center"
                        >
                        <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Upcoming Visit
                            </span>
                            <p className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            #{t.tokenNumber} – {t.departmentName}
                            <Badge date={t.appointmentDate} />
                            </p>
                        </div>

                        <button
                            disabled={cancellingId === t._id}
                            onClick={() => handleCancelToken(t._id)}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                            px-4 py-2 rounded-xl text-xs font-black
                            transition-all active:scale-95 disabled:opacity-40"
                        >
                            {cancellingId === t._id ? "Wait..." : "Cancel"}
                        </button>
                        </div>
                    ))}
                    </>
                )}
                </div>

                {/* Footer */}
                <div className="px-8 py-8 bg-gray-50 dark:bg-gray-900/40">
                <button
                    onClick={() => setShowCancelModal(false)}
                    className="w-full py-4 rounded-2xl
                    bg-gray-100 dark:bg-gray-800
                    text-gray-600 dark:text-gray-300
                    font-bold transition-all
                    hover:bg-gray-200 dark:hover:bg-gray-700
                    active:scale-95"
                >
                    Close Manager
                </button>
                </div>
            </div>
            </div>
            </div>
            )}

            {/* FOOTER ACTIONS */}

            <footer className="flex flex-col sm:flex-row gap-4">

            {/* Left button */}
            <motion.button
            type="button"
            onClick={() => setShowCreateTokenModal(true)}
            initial={{ opacity: 0, x: -120 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{  }}
            transition={{ duration: 1, ease: [0.25, 0.25, 0.75, 0.75] }}
            className="flex-1 py-4 rounded-2xl bg-teal-600 text-white font-bold
                    shadow-lg shadow-teal-200 dark:shadow-none
                    hover:bg-teal-700 transition-all active:scale-95"
            >
            New Appointment
            </motion.button>

            {/* Right button */}
            <motion.button
            onClick={() => setShowCancelModal(true)}
            initial={{ opacity: 0, x: 120 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ }}
            transition={{ duration: 1, ease: [0.25, 0.25, 0.75, 0.75] }}
            className="flex-1 py-4 rounded-2xl font-bold border transition-all
                    bg-white dark:bg-gray-900 text-red-500
                    border-red-100 dark:border-red-900/30
                    hover:bg-red-50 active:scale-95"
            >
            Cancel Active Token
            </motion.button>

            </footer>
        </main>
      </div>

      
    </>
  );
};

export default Token;
