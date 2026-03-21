import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState,useRef } from 'react';
import AnimatedQuote from '../../components/animation/AnimatedQuote';
import { useSocket} from "../../hooks/useSocket";
import usePatientTokenSocket from "@/hooks/usePatientTokenSocket";
import StickyMiniToken from "../../components/token/StickyMiniToken";
import { getMyTokenApi,getMyUpcomingTokensApi,cancelTokenApi,createTokenApi,getAllDepartmentsApi,previewTokenNumberApi } from "../../api/token.api";
import { showToast } from "../../utils/toastBus.js";
import Loader from "../../components/animation/Loader";
import Bulletins from "../../components/Bulletins/Bulletins";
import TokenHeroCard from "../../components/queue/TokenHeroCard.jsx"
import CreateTokenModal from '../../components/tokenmodal/CreateTokenModal.jsx';
import CancelTokenModal from '../../components/tokenmodal/CancelTokenModal.jsx';
import VideoCallCore from "@/components/webrtc/VideoCallCore";
import {getConsulationApi} from "@/api/consulation.api.js"
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
  const [consultationType, setConsultationType] = useState("LOCAL");
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');

  const [expectedTokenNumber, setExpectedTokenNumber] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewCacheRef = useRef(new Map());
  const debounceTimerRef = useRef(null);

  const [roomId,setRoomId]=useState("");
  const [open, setOpen] = useState(false);

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
  if (!departmentId || !appointmentDate || !priority || !consultationType) {
    showToast({
      type: "error",
      message: "Please fill all the fields",
    });
    return;
  }

  setCreating(true); 

  try {
    const res =await createTokenApi({ departmentId, appointmentDate, priority,consultationType});
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
usePatientTokenSocket({
  socketRef,
  token,
  setToken,
  showToast,
});

  async function getConsulation(){
    try {
      const value=token?._id 
      if(!value){
        showToast({
          type: "error",
          message: "No Token Found",
        });
        return;
      } 
      setOpen(true)
      const res=await getConsulationApi(value);
        showToast({
          type: "success",
          message: res?.data?.message||"Doctor has started the consulation",
        });
      setRoomId(res?.data?.roomId)
      
    } catch (error) {
        showToast({
          type: "error",
          message: error?.response?.data?.message||"Doctor has Not started the consulation",
        });
        console.log(error)
    }
  }


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
  consultationType,
  setConsultationType,
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
          <TokenHeroCard
            token={token}
            isCalled={isCalled}
            isNear={isNear}
            setShowCreateTokenModal={setShowCreateTokenModal}
            onLocationClick={getConsulation}
          />

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
                        {token
                          ? token?.consultationType === "REMOTE"
                            ? "Join Video Consultation"
                            : "Room 402, 2nd Floor"
                          : "--"}
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

          {isCalled && (
            <div className="flex flex-col items-center gap-6">
              {( open && isCalled) && (
                <VideoCallCore
                  roomId={roomId}
                  role="patient"
                  isOpen={open}
                  onClose={() => setOpen(false)}
                  token={token}
                />
              )}
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