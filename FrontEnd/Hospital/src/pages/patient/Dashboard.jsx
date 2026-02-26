import { motion, AnimatePresence } from 'framer-motion';
import {Bell,Timer,UserCheck,QrCode,Ticket,ChevronRight,RefreshCcw,MapPin,} from 'lucide-react';
import { useEffect, useState,useRef } from 'react';
import Navbar from '../../components/Navbar/PatientNavbar';
import AnimatedQuote from '../../components/animation/AnimatedQuote';
import { useSocket} from "../../hooks/useSocket";
import { useTokenSocket } from "../../hooks/useTokenSocket";
import StickyMiniToken from "../../components/token/StickyMiniToken";
import { getMyTokenApi,getMyUpcomingTokensApi,cancelTokenApi,createTokenApi,getAllDepartmentsApi,previewTokenNumberApi } from "../../api/token.api";
import { showToast } from "../../utils/toastBus.js";
import Loader from "../../components/animation/Loader";
import Bulletins from "../../components/Bulletins/Bulletins";
import CreateTokenModal from '../../components/tokenmodal/CreateTokenModal.jsx';
import CancelTokenModal from '../../components/tokenmodal/CancelTokenModal.jsx';
import "./patient.css";


function PatientDashboard() {
  const {socketRef, isConnected} = useSocket();
  
  // --- State Management ---
  const [token, setToken] = useState(null);
  const [upcomingTokens, setUpcomingTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSticky, setShowSticky] = useState(false);
  const MIN_LOADER_TIME = 2500; 

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [showCreateTokenModal, setShowCreateTokenModal] = useState(false);

  const [creating, setCreating] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [priority,setPriority]=useState('NORMAL');
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');

  const [expectedTokenNumber, setExpectedTokenNumber] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewCacheRef = useRef(new Map());
  const debounceTimerRef = useRef(null);

  // Booking Date Handler
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

  // --- 1. Fetch Initial Token Data ---
  const fetchToken = async ({ withLoader = false } = {}) => {
  let startTime = 0;

  if (withLoader) {
    setLoading(true);
    startTime = Date.now();
  }

  try {
    const res = await getMyTokenApi();
    setToken(res.data);
  } catch (err) {
    console.error("Error fetching token:", err);
  } finally {
    if (withLoader) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(MIN_LOADER_TIME - elapsed, 0);

      setTimeout(() => {
        setLoading(false);
      }, remaining);
    }
  }
};

// -----------------------------
// INITIAL FETCH ON PAGE LOAD
// -----------------------------
useEffect(() => {
  fetchToken({ withLoader: true });
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

  // upcoming Token Handler 
  useEffect(() => {
    if (!showCancelModal) return;
    const controller = new AbortController();
    const fetchUpcomingTokens = async () => {
      try {
        const res = await getMyUpcomingTokensApi({
          signal: controller.signal,
        });
        setUpcomingTokens(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") {
          return;
        }
        console.error("Error fetching upcoming tokens:", err);
      }
    };

    fetchUpcomingTokens();

    return () => {
      controller.abort(); 
    };
  }, [showCancelModal]);

  // Fetch all the departments
  useEffect(() => {
  const fetchDepartments = async () => {
    try {
      const res = await  getAllDepartmentsApi();
      setDepartments(res.data.departments);
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  };

  fetchDepartments();
}, []);

  // Precheck list card animation
  const checklistItem = {
    hidden: {
      opacity: 0,
      y: "-100vh", 
    },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 1.4, 
        ease: [0.25, 0.25, 0.75, 0.75], 
      },
    }),
  };

//create Token
const createToken = async () => {
  if (!departmentId || !appointmentDate || !priority) {
    showToast({
      type: "error",
      message: "Please fill all the fields",
    });
    return;
  }

  setCreating(true); 

  try {
    const res =await createTokenApi({ departmentId, appointmentDate, priority});
    setShowCreateTokenModal(false);
    showToast({
      type: "success",
      message: res?.data?.message ||"Token created successfully",
    });
    setAppointmentDate('');
    setDepartmentId('');
    await fetchToken();
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

    showToast({
      type: "success",
      message: "Appointment cancelled successfully",
    });

  } catch (err) {
    showToast({
      type: "error",
      message:
        err?.response?.data?.message ||
        "Unable to cancel appointment Try again later",
    });
  } finally {
    setCancellingId(null);
  }
};

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

// Token Logic
useTokenSocket({
  socketRef,
  token,

  /* ---------------- CALLED ---------------- */
  onCalled: ({ tokenId, doctorName }) => {
  if (!tokenId) return;

  setToken(prev => {
    if (!prev || prev._id !== tokenId) return prev;

    showToast({
      type: "success",
      message: `Your token #${prev.tokenNumber} is being called by Dr. ${doctorName}.`,
    });
    sessionStorage.setItem("doctorName", doctorName);
    return {
      ...prev,    
      doctorName,  
      status: "CALLED",
    };
  });
},


  /* ---------------- SKIPPED ---------------- */
  onSkipped: ({ tokenId }) => {
    if (!tokenId) return;

    setToken(prev => {
      if (!prev || prev._id !== tokenId) return prev;

      showToast({
        type: "error",
        message: `Your token #${prev.tokenNumber} was skipped.`,
      });
      sessionStorage.removeItem("doctorName");
      return null;
    });
    setToken(null)
  },

  /* ---------------- COMPLETED ---------------- */
  onCompleted: ({ tokenId }) => {
    if (!tokenId) return;

    setToken(prev => {
      if (!prev || prev._id !== tokenId) return prev;

      showToast({
        type: "success",
        message: `Your token #${prev.tokenNumber} is completed.`,
      });
      sessionStorage.removeItem("doctorName");
      return null; // token lifecycle ends
    });
  },

  /* ---------------- NO SHOW ---------------- */
  onNoShow: ({ tokenId }) => {
    if (!tokenId) return;

    setToken(prev => {
      if (!prev || prev._id !== tokenId) return prev;
      sessionStorage.removeItem("doctorName");
      return null;
    });
  },

  /* ---------------- QUEUE UPDATE ---------------- */
  onQueueUpdate: ({
    tokenId,
    minMinutes,
    maxMinutes,
    patientsAhead,
  }) => {
    if (!tokenId) return;

    setToken(prev => {
      if (!prev || prev._id !== tokenId) return prev;

      return {
        ...prev,
        waitingCount:
          typeof patientsAhead === "number"
            ? patientsAhead
            : prev.waitingCount,

        minMinutes:
          typeof minMinutes === "number"
            ? minMinutes
            : prev.minMinutes,

        maxMinutes:
          typeof maxMinutes === "number"
            ? maxMinutes
            : prev.maxMinutes,
      };
    });
  },
});


const doctorName = sessionStorage.getItem("doctorName");


// Booking Props
const bookingProps = {
  departments,
  departmentId,
  setDepartmentId,
  appointmentDate,
  setAppointmentDate,
  expectedTokenNumber,
  previewLoading,
  MAX_ADVANCE_DAYS,
  today,
  formatDate,
  priority,
  setPriority,
  creating,
  createToken,
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
};

  // --- 4. Loading State ---
  if (loading) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[#212121]/80 backdrop-blur-sm">
      <Loader />
    </div>
  );
}

  // --- 5. Dynamic Derived States ---
  const isCalled = token?.status === "CALLED";
  const isNear = token?.waitingCount <= 3 && !isCalled;

  return (
    <>
      <StickyMiniToken
        token={token}
        show={showSticky}
      />


      <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 p-4 md:p-6 space-y-8 pb-24">
        <Navbar activePage="Dashboard" />

        <main className="max-w-5xl mx-auto space-y-8">
          
          {/* WELCOME HEADER */}
          <header className="flex justify-between items-end animate-slide-up">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                Health <span className="text-teal-600">Dashboard</span>
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {token ? `Monitoring your live appointment in ${token?.departmentName?.toUpperCase()}` : "Welcome back! How are you feeling today?"}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 pb-1">
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              </span>

              <p className={`text-[10px] font-bold uppercase tracking-widest ${isConnected ? "text-gray-400" : "text-red-400"}`}>
                {isConnected ? "Live System Connected" : "System Disconnected"}
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
                        {isCalled ? (
                          "It’s your turn. Please proceed now."
                        ) : token?.minMinutes === undefined || token?.maxMinutes === undefined ? (
                          "Please Wait Some Time.You Will Get The Updates"
                        ) : (
                          `About ${token.minMinutes}–${token.maxMinutes} minutes remaining`
                        )}
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


          {/* QUICK INFO GRID (Location & Specialist) */}
          <div className="grid gap-6 md:grid-cols-2 animate-slide-up">
              <section className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-5">
                  <div className="h-14 w-14 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Where to go</p>
                      <p className="text-xl font-black text-gray-800 dark:text-white">
                        {token ? "Room 402, 2nd Floor" : "--"}
                      </p>
                  </div>
              </section>

              <section className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-400 flex items-center justify-center text-white font-bold text-xl">
                      {token ? "DR" : "?"}
                  </div>
                  <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Specialist</p>
                      <p className="text-xl font-black text-gray-800 dark:text-white">
                        {token ? token?.doctorName?.toUpperCase()||doctorName?.toUpperCase(): "Not Assigned"}
                      </p>
                  </div>
              </section>
          </div>

          {/* MOTIVATIONAL QUOTE */}
          <AnimatePresence mode="wait">
            {token && (
              <motion.section
                key="animated-quote-section"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="relative w-full py-12 px-4 overflow-hidden flex justify-center items-center"
              >
                {/* Ambient Background Orbs */}
                <div className="absolute inset-0 pointer-events-none">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], x: [0, 40, 0], y: [0, -30, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-24 -left-24 w-96 h-96 
                              bg-teal-300/20 dark:bg-teal-500/10 
                              rounded-full blur-[120px]"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], x: [0, -50, 0], y: [0, 40, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-24 -right-24 w-96 h-96 
                              bg-emerald-300/20 dark:bg-emerald-500/10 
                              rounded-full blur-[120px]"
                  />
                </div>

                {/* Quote Card */}
                <div className="relative z-10 w-full max-w-3xl">
                  <AnimatedQuote token={token} Namedoc={doctorName} />
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* PRE-CONSULTATION CHECKLIST */}
          <section className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">
              Preparation Checklist
            </h3>

            {/* MAIN CONTAINER ANIMATION */}
            <motion.div
              initial={{ opacity: 0, x: -150 }}     
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 1.2,
                ease: [0.25, 0.25, 0.75, 0.75],
              }}
              className="grid gap-4 sm:grid-cols-2"
            >
              {[
                "Keep Digital ID Ready",
                "Carry Previous Reports",
                "List Current Medications",
                "Note Main Symptoms",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  custom={i}               
                  initial="hidden"
                  animate="visible"
                  variants={checklistItem}
                  className="flex items-center gap-4 p-4 rounded-2xl 
                            bg-gray-50 dark:bg-gray-800/50 
                            text-sm font-bold text-gray-700 dark:text-gray-300 
                            border border-transparent 
                            hover:border-teal-100 dark:hover:border-teal-900/30 
                            transition-all"
                >
                  <div className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/40 
                                  text-teal-600 dark:text-teal-400 
                                  flex items-center justify-center 
                                  text-[10px] font-black">
                    {i + 1}
                  </div>
                  {item}
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* DEPARTMENT ANNOUNCEMENTS (Bulletin) */}
          <motion.div variants={itemVariants}  >
            <Bulletins departmentId={token?.departmentId}/>
          </motion.div>
          
          {/* Create Modal Handler*/}
          <CreateTokenModal
            open={showCreateTokenModal}
            onClose={() => setShowCreateTokenModal(false)}
            {...bookingProps}
          />
          {/* Cancel Modal Handler*/}
          <CancelTokenModal
            open={showCancelModal}
            onClose={() => setShowCancelModal(false)}

            token={token}
            upcomingTokens={upcomingTokens}
            cancellingId={cancellingId}
            handleCancelToken={handleCancelToken}
          />

          
          {/* FOOTER ACTIONS */}
          <footer className="flex flex-col sm:flex-row gap-4">
            
            {/* Left button */}
            <motion.button
              type="button"
              onClick={() => setShowCreateTokenModal(true)}
              initial={{ opacity: 0, x: -120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true}}
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
              viewport={{  once: true}}
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
}

export default PatientDashboard;