import { motion} from 'framer-motion';
import { useEffect, useState ,useRef} from "react";
import Badge from "../../components/badge/badge.jsx";
import { showToast } from '../../utils/toastBus.js';
import Loader from "../../components/animation/Loader.jsx";
import StickyMiniToken from "../../components/token/StickyMiniToken";

import { useSocket } from "../../hooks/useSocket";
import usePatientTokenSocket from "@/hooks/usePatientTokenSocket";
import TokenHeroCard from "../../components/queue/TokenHeroCard.jsx"
import CreateTokenModal from '../../components/tokenmodal/CreateTokenModal.jsx';
import CancelTokenModal from '../../components/tokenmodal/CancelTokenModal.jsx';

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
    const [cancellingId, setCancellingId] = useState(null);
    const [showSticky, setShowSticky] = useState(false);

    const [creating, setCreating] = useState(false);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [priority,setPriority]=useState('NORMAL');
    const [consultationType, setConsultationType] = useState("LOCAL");
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
  usePatientTokenSocket({
    socketRef,
    token,
    setToken,
    showToast,
  });

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
        message: "Token created successfully",
      });
      setAppointmentDate('');
      setDepartmentId('');
      const todayStr = formatDate(new Date());
      if (appointmentDate === todayStr) {
        setToken(res.data.token ?? res.data);
      }
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
      

      <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 p-4 md:p-6 pb-24">

        <main className="max-w-5xl mx-auto space-y-8">

            {/* ================= HEADER ================= */}
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
            <TokenHeroCard
              token={token}
              isCalled={isCalled}
              isNear={isNear}
              setShowCreateTokenModal={setShowCreateTokenModal}
            />

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

            {/* ================= TOKEN HISTORY ================= */}
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

            {/* ================= Create Modal Handler =================*/}
            <CreateTokenModal
              open={showCreateTokenModal}
              onClose={() => setShowCreateTokenModal(false)}
              {...bookingProps}
            />
            {/* ================= Cancel Modal Handler =================*/}
            <CancelTokenModal
              open={showCancelModal}
              onClose={() => setShowCancelModal(false)}

              token={token}
              upcomingTokens={upcomingTokens}
              cancellingId={cancellingId}
              handleCancelToken={handleCancelToken}
            />

            {/* ================= FOOTER ACTIONS ================= */}
            <footer className="flex flex-col sm:flex-row gap-4">

              {/* Left button */}
              <motion.button
              type="button"
              onClick={() => setShowCreateTokenModal(true)}
              initial={{ opacity: 0, x: -120 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{once:true}}
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
              viewport={{once:true}}
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
