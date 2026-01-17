import React, { useState,useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { motion,AnimatePresence } from 'framer-motion';
import { 
  UserCheck, Users, Clock, ChevronRight,User,
  Activity,ArrowUpRight, Timer, TrendingUp, Zap,Coffee,Play} from 'lucide-react';
import {useAuth} from "../../hooks/useAuth"
import Navbar from "../../components/Navbar/DoctorNavbar";
import Toast from "../../components/ui/Toast";
import {getDoctorQueueSummary,getMyDoctorProfileApi,makeDoctorOnAvailableApi,makeDoctorOnLeaveApi} from "../../api/doctor.api";
import { useTokenSocket } from "../../hooks/useTokenSocket";
import { useSocket } from "../../hooks/useSocket";
import Bulletins from "../../components/Bulletins/Bulletins";
import AsyncMotionButton from "../../components/buttonmotion/AsyncMotionButton";

const Dashboard = () => {

    const { user } = useAuth();
    const navigate = useNavigate();
    const [queue, setQueue] = useState({
            totalToday: 0,
            completed: 0,
            remaining: 0,
            nextWaiting: [],
        });

    const completed = Number(queue.completed) || 0;
    const total = Number(queue.totalToday) || 0;
    const progressPercent =
      total > 0
        ? Math.min(100, Math.max(0, Math.round((completed / total) * 100)))
        : 0;

    const [toast, setToast] = useState(null);
    const [formData, setFormData] = useState();

    const { socketRef, isConnected } = useSocket();

    const [token, setToken] = useState(() => {
      const storedToken = localStorage.getItem("currentToken");
      return storedToken ? JSON.parse(storedToken) : null;
    });

    // Button animation
    const [loading, setLoading] = useState({
      next: false,
      availability: false,
      analytics: false,
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

    // Doctor Availability
  const handleDoctorAvailability = async () => {
    try {
      let res;

      if (formData?.user?.isAvailable) {
        // Doctor wants to take a break
        res = await makeDoctorOnLeaveApi();
        setToast({
          type: "success",
          message: res?.data?.message || "You are now on break",
        });
      } else {
        // Doctor wants to resume
        res = await makeDoctorOnAvailableApi();
        setToast({
          type: "success",
          message: res?.data?.message || "You are now available",
        });
      }

      // 🔄 Refresh doctor profile 
      const profileRes = await getMyDoctorProfileApi();
      const profile = profileRes?.data?.profile;
      if (!profile) return;

      setFormData({
        user: profile.user ?? {},
        specialization: profile.specialization ?? "",
        qualifications: profile.qualifications ?? [],
        experienceYears: profile.experienceYears ?? 0,
        consultationFee: profile.consultationFee ?? 0,
        slotDurationMinutes: profile.slotDurationMinutes ?? 10,
        opdTimings: profile.opdTimings ?? [],
        bio: profile.bio ?? "",
      });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Something went wrong, try again later.",
      });
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  // Dashboard Summary (total ,queue ,nextwaiting,remaining)
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const res = await getDoctorQueueSummary();
        if (isMounted) setQueue(res?.data?.data);
      } catch (error) {
        if (isMounted) {
          setToast({
            type: "error",
            message:
              error?.response?.data?.message ||
              "Failed To Fetch The Dashboard Summary",
          });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);
  
  // Doctor Profile APi
   useEffect(() => {
      let isMounted = true;
  
      async function fetchData() {
        try {
          const res = await getMyDoctorProfileApi();
          const profile = res?.data?.profile;
          if (!profile || !isMounted) return;
  
          setFormData({
            user: profile.user ?? {},
            specialization: profile.profile?.specialization ?? "",
            qualifications: profile.profile?.qualifications ?? [],
            experienceYears: profile.profile?.experienceYears ?? 0,
            departmentId: profile.profile?.department?._id,
            // 🔒 READ-ONLY (from Department)
            consultationFee: profile.profile?.department?.consultationFee ?? 0,
            slotDurationMinutes: profile.profile?.department?.slotDurationMinutes ?? 10,

            opdTimings: profile.profile?.opdTimings ?? [],
            bio: profile.profile?.bio ?? "",
          });
  
        } catch (error) {
          console.error("Failed to fetch doctor profile:", error);
        }
      }
  
      fetchData();
      return () => { isMounted = false; };
    }, []);


    // socket Handling
    useTokenSocket({
      socketRef,
      departmentId: formData?.departmentId,
      /* =========================
        TOKEN CALLED (Doctor)
      ========================= */
      onCalled: ({ tokenId, tokenNumber, patientName }) => {
        if (!tokenId) return;
        console.log();
        setToken({
          _id: tokenId,
          tokenNumber,
          patientName,
          status: "CALLED",
        });
      },

      /* =========================
        TOKEN COMPLETED
      ========================= */
      onCompleted: ({ tokenId }) => {
        if (!tokenId) return;

        setToken(prev =>
          prev && prev._id === tokenId ? null : prev
        );
      },

      /* =========================
        TOKEN SKIPPED
      ========================= */
      onSkipped: ({ tokenId }) => {
        if (!tokenId) return;

        setToken(prev =>
          prev && prev._id === tokenId ? null : prev
        );
      },

      /* =========================
        NO SHOW
      ========================= */
      onNoShow: ({ tokenId }) => {
        if (!tokenId) return;

        setToken(prev =>
          prev && prev._id === tokenId ? null : prev
        );
      },
    });

    // Estimated Finish
  const [estimatedFinish, setEstimatedFinish] = useState(null);

  useEffect(() => {
    const minutesToAdd = formData?.slotDurationMinutes;

    if (!minutesToAdd || isNaN(minutesToAdd)) {
      setEstimatedFinish(null);
      return;
    }

    const now = new Date();
    const finish = new Date(now.getTime() + minutesToAdd * 60 * 1000);

    const formattedTime = finish.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    setEstimatedFinish(formattedTime);
  }, [formData?.slotDurationMinutes]);

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

        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors duration-300">
          <Navbar activePage="Home" />

          <motion.main 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
          >
            
            {/* ================= HEADER SECTION ================= */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                    <Activity className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-gray-950 rounded-full"></span>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    Dr. {user?.name.toUpperCase()}
                  </h1>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    {formData?.specialization?.toUpperCase()} Specialist <span className="w-1 h-1 rounded-full bg-gray-300"></span> Room 402
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                {/* Status Label */}
                <span className="pl-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Status:
                </span>
                {/* Availability (display-only, not clickable) */}
                <span
                  className={`px-4 py-2 text-xs font-bold rounded-xl border shadow-sm
                    ${
                      formData?.user?.isAvailable
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                        : "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                    }
                  `}
                >
                  {formData?.user?.isAvailable ? "AVAILABLE" : "NOT AVAILABLE"}
                </span>
                <span className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
                {/* Connection Indicator + Text (grouped) */}
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    {isConnected && (
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                    )}
                    <span
                      className={`relative inline-flex h-2 w-2 rounded-full ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                  </span>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      isConnected ? "text-gray-400" : "text-red-400"
                    }`}
                  >
                    {isConnected ? "Live Connected" : "Disconnected"}
                  </p>
                </div>
              </div>
            </header>

            {/* ================= STATS GRID ================= */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Patients', value:queue.totalToday, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                { label: 'Completed', value: queue.completed, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                { label: 'In Queue', value: queue.remaining, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10' },
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4"
                >
                  <div className={`p-3 rounded-2xl ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* ================= NOW SERVING (Main Action) ================= */}
              <section className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em]">
                    Live Session
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                      {isConnected? "Live Updates":"Offline"}
                    </span>
                  </div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative"
                >
                  {/* Animated Background Border Gradient */}
                  <div className="absolute -inset-[1px] rounded-[2.5rem] bg-gradient-to-r from-emerald-500/20 via-teal-500/40 to-emerald-500/20 blur-sm group-hover:blur-md transition-all duration-500" />

                  <div className="relative bg-white dark:bg-gray-900 rounded-[2.5rem] p-1 border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                      
                      {/* LEFT: Token Hero Section */}
                      <div className="lg:col-span-4 p-8 bg-gray-50/50 dark:bg-gray-800/30 rounded-[2.2rem] flex flex-col justify-between border border-transparent dark:border-gray-800/50">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-100/50 dark:bg-emerald-500/10 w-fit px-3 py-1 rounded-full">
                            Current Token
                          </p>
                          <motion.h3 
                            layoutId="token-number"
                            className="text-8xl font-black tracking-tighter text-gray-900 dark:text-white"
                          >
                          {token?.tokenNumber||0}
                          </motion.h3>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                          <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-center">
                            <User size={18} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-gray-900 dark:text-white leading-none">
                              {token?.patientName||token?.patient?.name?.toUpperCase()||'No Patient'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Timer size={12} /> {formData?.slotDurationMinutes} min/Patient
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: Intelligence & Actions */}
                      <div className="lg:col-span-8 p-8 flex flex-col justify-between">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          
                          {/* Metrics Grid */}
                          <div className="space-y-6">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-500/10">
                                <Zap size={14} className="text-teal-600 dark:text-teal-400" />
                              </div>
                              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                System Efficiency
                              </p>
                            </div>

                            <div className="flex gap-10">
                              <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Avg Consult</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{formData?.slotDurationMinutes}<span className="text-xs text-gray-400 ml-1">min</span></p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Queue Size</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{queue?.remaining}<span className="text-xs text-gray-400 ml-1">pts</span></p>
                              </div>
                            </div>
                          </div>

                          {/* Estimate Section */}
                          <div className="bg-gray-50/50 dark:bg-gray-800/20 p-5 rounded-3xl border border-gray-100 dark:border-gray-800/50 flex flex-col justify-center">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Estimated Finish</p>
                            <div className="flex items-baseline gap-2">
                              {estimatedFinish && token?._id ? (
                                <>
                                  <p className="text-3xl font-black text-teal-600 dark:text-teal-400">
                                    {estimatedFinish.split(" ")[0]}
                                  </p>
                                  <p className="text-sm font-bold text-gray-500 uppercase">
                                    {estimatedFinish.split(" ")[1]}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-400">—</p>
                              )}
                            </div>

                            <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "65%" }}
                                className="h-full bg-teal-500" 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-50 dark:border-gray-800">
                          <div className="hidden md:block">
                            <p className="text-xs text-gray-400 font-medium"><span className="font-mono text-gray-600 dark:text-gray-300"></span></p>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/doctor/queue')}
                            className="w-full md:w-auto px-8 py-4 rounded-2xl bg-gray-950 dark:bg-white text-white dark:text-gray-900 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl transition-all"
                          >
                            Open Session
                            <ArrowUpRight size={18} />
                          </motion.button>
                        </div>
                      </div>

                    </div>
                  </div>
                </motion.div>
              </section>
              {/* ================= NEXT UP (Sidebar) ================= */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Next in Line</h2>
                  <button className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">View All</button>
                </div>

                <div className="space-y-3">
                  {/* Handle the "No Patients" vs "List" states */}
                  {queue?.nextWaiting && queue.nextWaiting.length > 0 ? (
                    queue.nextWaiting.map((item, index) => {
                      // Logic for the "Next Up" vs "Upcoming" styles
                      const isNextUp = index === 0;
                      
                      return (
                        <motion.div
                          key={item.token}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ x: 8 }}
                          className={`group relative overflow-hidden p-4 rounded-[2rem] border transition-all duration-300 flex items-center justify-between
                            ${isNextUp 
                              ? "bg-white dark:bg-slate-900 border-teal-500/30 shadow-lg shadow-teal-500/5 ring-1 ring-teal-500/20" 
                              : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 shadow-sm"
                            }`}
                        >
                          {/* State Indicator: Glowing pulse for the person who is literally "Next" */}
                          {isNextUp && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500">
                              <div className="absolute inset-0 bg-teal-500 animate-pulse opacity-50" />
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            {/* Token Badge */}
                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border transition-colors
                              ${isNextUp 
                                ? "bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20" 
                                : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                              }`}
                            >
                              <span className={`text-[9px] font-black uppercase tracking-tighter ${isNextUp ? 'text-teal-600' : 'text-slate-400'}`}>
                                Token
                              </span>
                              <span className={`text-lg font-black leading-none ${isNextUp ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-white'}`}>
                                {item.token}
                              </span>
                            </div>

                            {/* Patient Details */}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                                  {item.name}
                                </p>
                                {isNextUp && (
                                  <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-ping" />
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border
                                  ${item.priority === 'EMERGENCY' 
                                    ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' 
                                    : item.priority === 'SENIOR' 
                                    ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' 
                                    : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'}
                                `}>
                                  {item.priority}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-tight">
                                  Waiting: {item?.waitingTime}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <ChevronRight 
                              size={20} 
                              className={`transition-all duration-300 ${isNextUp ? 'text-teal-500 transform translate-x-1' : 'text-slate-300 dark:text-slate-700 group-hover:text-teal-500'}`} 
                            />
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    /* --- State 2: Empty/Zero State --- */
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-[2.5rem] bg-slate-50/30 dark:bg-slate-900/10"
                    >
                      <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl shadow-sm flex items-center justify-center mb-4">
                        <Users className="text-slate-200 dark:text-slate-700" size={32} />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-black text-sm uppercase tracking-widest">
                        Queue Clear
                      </p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                        No patients are currently waiting.
                      </p>
                    </motion.div>
                  )}
                </div>
              </section>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. SHIFT PROGRESS CARD */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                      <Timer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Shift Progress
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <h4 className="text-2xl font-black text-gray-800 dark:text-white">
                        {progressPercent}%
                      </h4>

                      <p className="text-xs text-gray-500 font-medium">
                        {queue.remaining} patients remaining
                      </p>
                    </div>

                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        key={progressPercent} 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* 2. DEPARTMENT ANNOUNCEMENTS (Bulletin) */}
                <motion.div variants={itemVariants}  >
                  <Bulletins departmentId={formData?.departmentId}/>
                </motion.div>

                {/* 3. QUICK ACTIONS / ROOM STATUS */}
              <motion.div
                variants={itemVariants}
                layout
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 140, damping: 20 }}
                className="
                  relative overflow-hidden
                  p-0.5 h-[240px]
                  rounded-[2.2rem]
                  bg-slate-950
                  shadow-2xl
                  group
                "
              >
                {/* Ambient Glow */}
                <div
                  className={`
                    absolute inset-0 opacity-20 blur-[80px] transition-colors duration-700
                    ${formData?.user?.isAvailable ? "bg-emerald-500" : "bg-amber-500"}
                  `}
                />

                {/* Inner Glass Container */}
                <div className="
                  relative z-10 h-full
                  flex flex-col
                  p-4 rounded-[2rem]
                  bg-slate-900/50
                  backdrop-blur-3xl
                  border border-white/5
                ">
                  
                  {/* HEADER */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col gap-1">
                      <h4 className="text-white/40 font-black text-[10px] uppercase tracking-[0.3em]">
                        System Hub
                      </h4>

                      <div className="flex items-center gap-2">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            formData?.user?.isAvailable ? "bg-emerald-400" : "bg-amber-400"
                          } shadow-[0_0_10px_rgba(52,211,153,0.5)]`}
                        />
                        <span className="text-white font-bold text-xs uppercase tracking-tighter">
                          {formData?.user?.isAvailable ? "Active Session" : "On Standby"}
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/20">
                      <Zap size={14} />
                    </div>
                  </div>

                  {/* BUTTON GRID */}
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    {/* AVAILABILITY TOGGLE BUTTON */}
                    <AsyncMotionButton
                      loading={loading.availability}
                      loadingText={formData?.user?.isAvailable ? "TAKING BREAK…" : "RESUMING…"}
                      onClick={() =>
                        withLoading("availability", handleDoctorAvailability)
                      }
                      className={`
                        relative flex flex-col items-center justify-center gap-3
                        py-4 rounded-[1.9rem]
                        border transition-all duration-500
                        ${
                          formData?.user?.isAvailable
                            ? "bg-emerald-500/10 border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]"
                            : "bg-amber-500/10 border-amber-500/20 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]"
                        }
                      `}
                      icon={
                        <div
                          className={`
                            p-2.5 rounded-2xl transition-colors duration-500
                            ${
                              formData?.user?.isAvailable
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            }
                          `}
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={formData?.user?.isAvailable ? "coffee" : "play"}
                              initial={{ rotate: -45, opacity: 0, scale: 0.5 }}
                              animate={{ rotate: 0, opacity: 1, scale: 1 }}
                              exit={{ rotate: 45, opacity: 0, scale: 0.5 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                              {formData?.user?.isAvailable ? (
                                <Coffee size={22} />
                              ) : (
                                <Play size={22} fill="currentColor" />
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      }
                    >
                      <div className="text-center">
                        <p className="text-white text-[11px] font-black uppercase tracking-widest">
                          {formData?.user?.isAvailable ? "Take Break" : "Resume"}
                        </p>
                        <p
                          className={`text-[9px] font-bold uppercase opacity-40 ${
                            formData?.user?.isAvailable
                              ? "text-emerald-200"
                              : "text-amber-200"
                          }`}
                        >
                          Shift Status
                        </p>
                      </div>
                    </AsyncMotionButton>
                    {/* ANALYTICS BUTTON */}
                    <AsyncMotionButton
                      loading={loading.analytics}
                      loadingText="OPENING…"
                      onClick={() =>
                        withLoading("analytics") //handleViewAnalytics
                      }
                      className="
                        relative flex flex-col items-center justify-center gap-3
                        py-4 rounded-[1.9rem]
                        bg-white/5 hover:bg-white/10
                        border border-white/10
                        transition-all
                      "
                      icon={
                        <div className="
                          p-2.5 rounded-2xl
                          bg-white/5 border border-white/5
                          text-cyan-400
                          transition-colors
                        ">
                          <TrendingUp size={22} />
                        </div>
                      }
                    >
                      <div className="text-center">
                        <p className="text-white text-[11px] font-black uppercase tracking-widest">
                          Stats
                        </p>
                        <p className="text-cyan-200 text-[9px] font-bold uppercase opacity-40">
                          View Analytics
                        </p>
                      </div>
                    </AsyncMotionButton>
                  </div>

                  {/* FOOTER */}
                  <div className="mt-3 pt-2 border-t border-white/5 flex justify-center">
                    <p className="text-[8px] text-white/20 font-bold uppercase tracking-[0.4em]">
                      Automated Management System
                    </p>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* ================= FOOTER NOTE ================= */}
            <footer className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs font-medium text-gray-400 flex items-center gap-2 italic">
                <Clock size={12} />
                Auto-refreshing queue every 30 seconds
              </p>
              <div className="flex gap-4">
                <button className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Settings</button>
                <button className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Support</button>
              </div>
            </footer>

          </motion.main>
        </div>
    </>
    
  );
};

export default Dashboard;