import React, { useMemo, useState } from "react";
import BaseModal from "./BaseModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  QrCode,
  User,
  Search,
  MapPin,
  Phone,
  CheckCircle2,
  X,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ScanLine,
  Activity,
  CreditCard,
  Clock,
  Stethoscope,
  Fingerprint,
  ArrowRight
} from "lucide-react";

import AdminPatientQrScanner from "../../pages/admin/AdminPatientQrScanner";
import { lookupUserByPhoneOrEmailApi } from "../../api/admin.api";

const AdminCreateTokenModal = ({
  open,
  onClose,

  // departments
  departments = [],
  departmentId,
  setDepartmentId,

  // date
  appointmentDate,
  setAppointmentDate,
  MAX_ADVANCE_DAYS,
  today,
  formatDate,

  // priority
  priority,
  setPriority,

  // preview
  expectedTokenNumber,
  previewLoading,

  // create
  creating,
  createToken,
}) => {
  // ---------------- Logic State (Untouched) ----------------
  const [patientId, setPatientId] = useState("");
  const [patientInfo, setPatientInfo] = useState(null);

  const [showScanner, setShowScanner] = useState(false);

  const [lookupValue, setLookupValue] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const stepReadyPatient = Boolean(patientId);
  const stepReadyDept = Boolean(departmentId);
  const stepReadyDate = Boolean(appointmentDate);
  const stepReadyPriority = Boolean(priority);

  const canConfirm =
    stepReadyPatient && stepReadyDept && stepReadyDate && stepReadyPriority;

  const selectedDepartment = useMemo(() => {
    return departments.find((d) => d._id === departmentId);
  }, [departments, departmentId]);

  // QR Scanner callback
  const handleQrFound = (data) => {
    setPatientId(data?.patientId || "");
    setPatientInfo({
      name: data?.name || "Unknown",
      phone: data?.phone || "—",
      patientId: data?.patientId || "",
    });
    setShowScanner(false);
  };

  // Confirm booking
  const handleConfirm = () => {
    if (!canConfirm) return;
    createToken({
      patientId,
      departmentId,
      appointmentDate,
      priority,
    });
  };

  const handleLookupPatient = async () => {
    if (!lookupValue.trim()) return;
    try {
      setLookupLoading(true);
      setLookupError("");
      const isEmail = lookupValue.includes("@");
      const payload = isEmail
        ? { email: lookupValue.trim() }
        : { phone: lookupValue.trim() };

      const res = await lookupUserByPhoneOrEmailApi(payload);
      const data = res.data;

      setPatientId(data?.patientId || "");
      setPatientInfo({
        name: data?.name || "Unknown",
        phone: data?.phone || "—",
        patientId: data?.patientId || "",
      });
    } catch (err) {
      setPatientInfo(null);
      setPatientId("");
      const msg =
        err?.response?.data?.message || err?.message || "Lookup failed";
      setLookupError(msg);
    } finally {
      setLookupLoading(false);
    }
  };

  // ---------------- Enhanced Animation Variants ----------------
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.12,
        delayChildren: 0.1 
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { type: "spring", stiffness: 100, damping: 15 } 
    },
  };

  const cardHover = {
    hover: { y: -4, shadow: "0px 10px 20px rgba(0,0,0,0.1)" },
    tap: { scale: 0.98 }
  };

  return (
    <>
      {/* Fullscreen Scanner Overlay */}
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-3xl h-[80vh] relative rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            >
              <AdminPatientQrScanner
                onFound={handleQrFound}
                onClose={() => setShowScanner(false)}
              />
              {/* Floating Close Button */}
              <button
                onClick={() => setShowScanner(false)}
                className="absolute top-6 right-6 p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 text-white transition-all z-50 group"
              >
                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BaseModal open={open} onClose={onClose} maxWidth="max-w-4xl">
        <div className="flex flex-col h-full max-h-[92vh] bg-white dark:bg-[#0B0F19]">
          
          {/* --- Cinematic Header Section --- */}
          <div className="relative shrink-0 px-8 pt-10 pb-8 z-10 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute top-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <motion.div 
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-50 dark:ring-indigo-900/20"
                >
                  <CalendarIcon size={30} strokeWidth={2.5} />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                    New Appointment
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    System Online
                  </p>
                </div>
              </div>

              {/* Enhanced Progress Stepper */}
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-full border border-gray-100 dark:border-gray-800">
                <StatusPill active={stepReadyPatient} icon={<User size={13} />} label="Patient" />
                <div className="w-4 h-[2px] bg-gray-200 dark:bg-gray-700 rounded-full" />
                <StatusPill active={stepReadyDept} icon={<Stethoscope size={13} />} label="Dept" />
                <div className="w-4 h-[2px] bg-gray-200 dark:bg-gray-700 rounded-full" />
                <StatusPill active={stepReadyDate} icon={<Clock size={13} />} label="Time" />
              </div>
            </div>
          </div>

          {/* --- Scrollable Content Area --- */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-gray-50/50 dark:bg-[#0f121a]">
            <motion.div 
                variants={containerVariants} 
                initial="hidden" 
                animate="visible" 
                className="p-6 md:p-8 space-y-10"
            >
              
              {/* ---------------- SECTION 1: Patient ---------------- */}
              <motion.section variants={itemVariants} className="relative group">
                <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                <SectionHeader 
                    step="01" 
                    title="Patient Identification" 
                    subtitle="Locate patient via QR scan or database search"
                />

                <div className="mt-5 bg-white dark:bg-[#131722] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                  <AnimatePresence mode="wait">
                    {patientInfo ? (
                      /* PATIENT FOUND CARD */
                      <motion.div 
                        key="found" 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.95 }} 
                        className="p-1.5"
                      >
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-900/30">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                              <div className="relative">
                                <div className="h-16 w-16 rounded-full bg-white dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md">
                                  <User size={32} />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white dark:border-gray-900 text-white p-1 rounded-full">
                                    <CheckCircle2 size={12} fill="currentColor" className="text-emerald-500 stroke-white" />
                                </div>
                              </div>
                              <div className="text-center sm:text-left">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                  {patientInfo.name}
                                </h3>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-gray-600 dark:text-gray-400 mt-2">
                                  <span className="flex items-center gap-1.5 bg-white/60 dark:bg-black/20 px-2 py-1 rounded-md">
                                    <Phone size={14} className="text-emerald-500" /> {patientInfo.phone}
                                  </span>
                                  <span className="flex items-center gap-1.5 bg-white/60 dark:bg-black/20 px-2 py-1 rounded-md font-mono">
                                    <Fingerprint size={14} className="text-emerald-500" /> {patientInfo.patientId}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button 
                                onClick={() => { setPatientId(""); setPatientInfo(null); }} 
                                className="group flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-500 hover:text-red-500 rounded-xl text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all active:scale-95"
                            >
                              <span className="group-hover:hidden">Verified</span>
                              <span className="hidden group-hover:inline">Change</span>
                              <X size={14} className="hidden group-hover:block" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      /* SEARCH / SCAN INTERFACE */
                      <motion.div 
                        key="search" 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="divide-y divide-gray-100 dark:divide-gray-800"
                      >
                        {/* Primary: Quick Scan */}
                        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-end">
                          <div className="flex-1 w-full space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <QrCode size={14} className="text-indigo-500" />
                                Scan ID Card
                            </label>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <ScanLine size={20} className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                              </div>
                              <input 
                                value={patientId} 
                                onChange={(e) => { setPatientId(e.target.value); setPatientInfo(null); }} 
                                placeholder="Scan QR or paste PID..." 
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono text-sm text-gray-900 dark:text-white placeholder-gray-400" 
                              />
                            </div>
                          </div>
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowScanner(true)} 
                            className="shrink-0 w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition-all"
                          >
                            <QrCode size={20} />
                            <span>Launch Scanner</span>
                          </motion.button>
                        </div>

                        {/* Secondary: Database Lookup */}
                        <div className="p-6 md:p-8 bg-gray-50/50 dark:bg-gray-900/30">
                          <div className="flex flex-col md:flex-row gap-6 items-end">
                            <div className="flex-1 w-full space-y-3">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Search size={14} /> Database Lookup</span>
                                {lookupError && (
                                    <span className="text-red-500 normal-case flex items-center gap-1 animate-pulse">
                                        <AlertTriangle size={12} /> {lookupError}
                                    </span>
                                )}
                              </label>
                              <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                  <Phone size={20} className="text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                                </div>
                                <input 
                                    value={lookupValue} 
                                    onChange={(e) => { setLookupValue(e.target.value); setLookupError(""); }} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleLookupPatient()} 
                                    placeholder="Enter phone number or email address..." 
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#0f121a] border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-sm text-gray-900 dark:text-white placeholder-gray-400 shadow-sm" 
                                />
                              </div>
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={lookupLoading || !lookupValue.trim()} 
                                onClick={handleLookupPatient} 
                                className="shrink-0 w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                            >
                              {lookupLoading ? <span className="animate-spin text-violet-600"><Clock size={20} /></span> : <Search size={20} />}
                              <span>Search</span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.section>

              {/* ---------------- SECTION 2: Department ---------------- */}
              <motion.section 
                variants={itemVariants} 
                className={`relative group ${!stepReadyPatient ? "opacity-40 grayscale blur-[1px] pointer-events-none select-none transition-all duration-500" : "transition-all duration-500"}`}
              >
                <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                <SectionHeader 
                    step="02" 
                    title="Select Department" 
                    subtitle="Choose the medical specialty for this visit"
                />

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((dept) => {
                    const isSelected = departmentId === dept._id;
                    return (
                      <motion.button 
                        key={dept._id} 
                        variants={cardHover}
                        initial="rest"
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => setDepartmentId(dept._id)} 
                        className={`
                            relative overflow-hidden p-5 rounded-2xl border-2 text-left transition-all duration-300
                            ${isSelected 
                                ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-lg shadow-violet-500/10" 
                                : "border-gray-100 dark:border-gray-800 bg-white dark:bg-[#131722] hover:border-violet-300 dark:hover:border-violet-700"}
                        `}
                      >
                        {/* Background Splash for Selected */}
                        {isSelected && (
                            <motion.div 
                                layoutId="dept-bg" 
                                className="absolute -right-10 -top-10 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl" 
                            />
                        )}
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className={`p-3 rounded-xl transition-colors ${isSelected ? "bg-violet-500 text-white shadow-md shadow-violet-500/30" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                            <Activity size={20} />
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-violet-500 bg-violet-500" : "border-gray-300 dark:border-gray-700"}`}>
                            {isSelected && <CheckCircle2 size={14} className="text-white" />}
                          </div>
                        </div>
                        
                        <div className="relative z-10">
                            <h4 className={`font-bold text-base ${isSelected ? "text-violet-900 dark:text-violet-100" : "text-gray-900 dark:text-white"}`}>
                                {dept.name}
                            </h4>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? "text-violet-600 dark:text-violet-300" : "text-gray-500"}`}>
                                    Consultation
                                </span>
                                <div className="h-px flex-1 bg-current opacity-20" />
                                <span className={`font-black text-sm ${isSelected ? "text-violet-700 dark:text-white" : "text-gray-900 dark:text-white"}`}>
                                    ₹{dept.consultationFee}
                                </span>
                            </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.section>

              {/* ---------------- SECTION 3: Date & Time ---------------- */}
              <motion.section 
                variants={itemVariants} 
                className={`relative group ${!stepReadyDept ? "opacity-40 grayscale blur-[1px] pointer-events-none select-none transition-all duration-500" : "transition-all duration-500"}`}
              >
                <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                <SectionHeader 
                    step="03" 
                    title="Appointment Date" 
                    subtitle="Select a date to check availability"
                />

                {/* Calendar Strip */}
                <div className="mt-5 p-1 -mx-2">
                    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 snap-x custom-scrollbar">
                    {Array.from({ length: MAX_ADVANCE_DAYS + 1 }).map((_, i) => {
                        const date = new Date(today);
                        date.setDate(today.getDate() + i);
                        const value = formatDate(date);
                        const isSelected = appointmentDate === value;

                        return (
                        <motion.button 
                            key={i} 
                            whileHover={{ y: -4 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setAppointmentDate(value)} 
                            className={`
                                shrink-0 snap-start w-[88px] h-28 p-2 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-between relative overflow-hidden
                                ${isSelected 
                                    ? "bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white shadow-xl shadow-gray-900/20" 
                                    : "bg-white dark:bg-[#131722] border-gray-200 dark:border-gray-800 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}
                            `}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">
                                {i === 0 ? "Today" : i === 1 ? "Tmrw" : date.toLocaleDateString("en-US", { weekday: "short" })}
                            </span>
                            <span className="text-3xl font-black tracking-tighter">
                                {date.getDate()}
                            </span>
                            <span className="text-[10px] font-medium mb-1 opacity-60">
                                {date.toLocaleDateString("en-US", { month: "short" })}
                            </span>
                            
                            {/* Selection Indicator Dot */}
                            {isSelected && (
                                <motion.div layoutId="active-date" className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500" />
                            )}
                        </motion.button>
                        );
                    })}
                    </div>
                </div>

                {/* Live Ticket Preview */}
                <AnimatePresence>
                  {departmentId && appointmentDate && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, y: 10 }} 
                        animate={{ opacity: 1, height: "auto", y: 0 }} 
                        exit={{ opacity: 0, height: 0 }} 
                        className="overflow-hidden"
                    >
                        <div className="relative mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-0.5 shadow-xl shadow-indigo-500/20">
                            <div className="bg-white dark:bg-[#0B0F19] rounded-[14px] p-5 flex items-center justify-between relative overflow-hidden">
                                {/* Decorative BG */}
                                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />
                                
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <Sparkles size={24} className={previewLoading ? "animate-spin-slow" : ""} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase text-indigo-500 tracking-wider mb-0.5">Live Estimate</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            Token for <span className="text-indigo-600 dark:text-indigo-400">{selectedDepartment?.name}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right relative z-10">
                                    <div className="text-[10px] text-gray-400 font-mono mb-1">EXPECTED NO.</div>
                                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tighter">
                                        #{previewLoading ? "..." : expectedTokenNumber ?? "--"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>

              {/* ---------------- SECTION 4: Priority ---------------- */}
              <motion.section 
                variants={itemVariants} 
                className={`relative group ${!stepReadyDate ? "opacity-40 grayscale blur-[1px] pointer-events-none select-none transition-all duration-500" : "transition-all duration-500"}`}
              >
                <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                <SectionHeader 
                    step="04" 
                    title="Priority Status" 
                    subtitle="Assign urgency level to this appointment"
                />

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['NORMAL', 'SENIOR', 'EMERGENCY'].map((p) => {
                    const isSelected = priority === p;
                    
                    // Dynamic styling based on type
                    let activeClass = "";
                    let icon = null;
                    
                    if (p === 'NORMAL') {
                        activeClass = "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400";
                        icon = <User size={16} />;
                    } else if (p === 'SENIOR') {
                        activeClass = "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400";
                        icon = <Stethoscope size={16} />;
                    } else {
                        activeClass = "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 shadow-lg shadow-rose-500/20 animate-pulse-slow";
                        icon = <AlertTriangle size={16} />;
                    }

                    return (
                      <button 
                        key={p} 
                        type="button" 
                        onClick={() => setPriority(p)} 
                        className={`
                            relative py-4 px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 group
                            ${isSelected 
                                ? activeClass 
                                : "bg-white dark:bg-[#131722] border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-300 dark:hover:border-gray-700"}
                        `}
                      >
                        {isSelected && icon}
                        <span className="text-xs font-black uppercase tracking-widest">{p}</span>
                        {isSelected && (
                            <motion.div 
                                layoutId="prio-dot" 
                                className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-current" 
                            />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.section>

              <div className="h-12" /> {/* Bottom Spacer */}
            </motion.div>
          </div>

          {/* --- Sticky Footer Actions --- */}
          <div className="shrink-0 p-6 bg-white/80 dark:bg-[#0B0F19]/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-20 flex gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <button 
                onClick={onClose} 
                className="px-8 py-4 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
                Cancel
            </button>

            <motion.button 
                whileHover={canConfirm && !creating ? { scale: 1.02, translateY: -2 } : {}} 
                whileTap={canConfirm && !creating ? { scale: 0.98 } : {}} 
                disabled={!canConfirm || creating} 
                onClick={handleConfirm} 
                className={`
                    flex-1 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl transition-all relative overflow-hidden group
                    ${canConfirm 
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/40" 
                        : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"}
                `}
            >
              <div className="relative z-10 py-4 flex items-center justify-center gap-3">
                {creating ? (
                    <>
                        <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" />
                        <span>Processing...</span>
                    </>
                ) : (
                    <>
                        <span>Confirm Booking</span>
                        {canConfirm && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                    </>
                )}
              </div>
              
              {/* Animated Shine Effect */}
              {canConfirm && !creating && (
                <motion.div 
                    animate={{ x: ["-100%", "200%"] }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "linear", delay: 1 }} 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12" 
                />
              )}
            </motion.button>
          </div>

        </div>
      </BaseModal>
    </>
  );
};

export default AdminCreateTokenModal;

/* --- UI Helper Components --- */

const SectionHeader = ({ step, title, subtitle }) => (
    <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-300 dark:text-gray-700 select-none">/{step}</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 pl-8 font-medium">{subtitle}</p>
    </div>
);

const StatusPill = ({ active, icon, label }) => (
  <div className={`
    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all duration-300
    ${active 
        ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm" 
        : "text-gray-400 grayscale opacity-70"}
  `}>
    {active ? <CheckCircle2 size={12} className="text-green-500" /> : icon}
    <span className="hidden sm:inline">{label}</span>
  </div>
);