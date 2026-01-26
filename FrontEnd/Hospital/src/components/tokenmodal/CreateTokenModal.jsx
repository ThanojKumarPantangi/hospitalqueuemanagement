import React, { useMemo } from "react";
import BaseModal from "./BaseModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  Sparkles,
  CheckCircle2,
  X,
  Activity,
  Clock,
  ArrowRight,
  Stethoscope,
  AlertTriangle,
  User,
  ShieldCheck
} from "lucide-react";

const CreateTokenModal = ({
  open,
  onClose,
  departments = [],
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
}) => {
  // ---------------- Logic State (Derived) ----------------
  const stepReadyDept = Boolean(departmentId);
  const stepReadyDate = Boolean(appointmentDate);
  const stepReadyPriority = Boolean(priority);
  
  // In user flow, we only need these 3 to be ready
  const canConfirm = stepReadyDept && stepReadyDate && stepReadyPriority;

  const selectedDepartment = useMemo(() => {
    return departments.find((d) => d._id === departmentId);
  }, [departments, departmentId]);

  // ---------------- Animation Variants ----------------
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
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
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex flex-col h-full max-h-[92vh] bg-white dark:bg-[#0B0F19]">
        
        {/* --- Cinematic Header Section --- */}
        <div className="relative shrink-0 px-8 pt-10 pb-8 z-10 overflow-hidden">
          {/* Background Decorative Elements (Teal Theme) */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <motion.div 
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-xl shadow-teal-500/30 ring-4 ring-teal-50 dark:ring-teal-900/20"
              >
                <CalendarIcon size={30} strokeWidth={2.5} />
              </motion.div>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                  Quick <span className="text-teal-600 dark:text-teal-400">Booking</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Instant Queue Access
                </p>
              </div>
            </div>

            {/* Progress Stepper */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-full border border-gray-100 dark:border-gray-800">
              <StatusPill active={stepReadyDept} icon={<Stethoscope size={13} />} label="Dept" />
              <div className="w-4 h-[2px] bg-gray-200 dark:bg-gray-700 rounded-full" />
              <StatusPill active={stepReadyDate} icon={<Clock size={13} />} label="Date" />
              <div className="w-4 h-[2px] bg-gray-200 dark:bg-gray-700 rounded-full" />
              <StatusPill active={stepReadyPriority} icon={<Activity size={13} />} label="Priority" />
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
            
            {/* ---------------- SECTION 1: Department ---------------- */}
            <motion.section variants={itemVariants} className="relative group">
              <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              <SectionHeader 
                  step="01" 
                  title="Select Department" 
                  subtitle="Choose the medical specialty for your visit"
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
                              ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-lg shadow-teal-500/10" 
                              : "border-gray-100 dark:border-gray-800 bg-white dark:bg-[#131722] hover:border-teal-300 dark:hover:border-teal-700"}
                      `}
                    >
                      {/* Background Splash for Selected */}
                      {isSelected && (
                          <motion.div 
                              layoutId="dept-bg" 
                              className="absolute -right-10 -top-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl" 
                          />
                      )}
                      
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className={`p-3 rounded-xl transition-colors ${isSelected ? "bg-teal-500 text-white shadow-md shadow-teal-500/30" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                          <Activity size={20} />
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-teal-500 bg-teal-500" : "border-gray-300 dark:border-gray-700"}`}>
                          {isSelected && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                      </div>
                      
                      <div className="relative z-10">
                          <h4 className={`font-bold text-base ${isSelected ? "text-teal-900 dark:text-teal-100" : "text-gray-900 dark:text-white"}`}>
                              {dept.name}
                          </h4>
                          <div className="mt-2 flex items-center gap-2">
                              <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? "text-teal-600 dark:text-teal-300" : "text-gray-500"}`}>
                                  Consultation
                              </span>
                              <div className="h-px flex-1 bg-current opacity-20" />
                              <span className={`font-black text-sm ${isSelected ? "text-teal-700 dark:text-white" : "text-gray-900 dark:text-white"}`}>
                                  ₹{dept.consultationFee}
                              </span>
                          </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 pl-1">
                <ShieldCheck size={14} className="text-teal-500" />
                <span>Live token estimates update automatically.</span>
              </div>
            </motion.section>

            {/* ---------------- SECTION 2: Date ---------------- */}
            <motion.section 
              variants={itemVariants} 
              className={`relative group ${!stepReadyDept ? "opacity-40 grayscale blur-[1px] pointer-events-none select-none transition-all duration-500" : "transition-all duration-500"}`}
            >
              <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              <SectionHeader 
                  step="02" 
                  title="Appointment Date" 
                  subtitle="Select a date to check queue availability"
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
                                  ? "bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-500/20" 
                                  : "bg-white dark:bg-[#131722] border-gray-200 dark:border-gray-800 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}
                          `}
                      >
                          {isSelected && (
                             <motion.div 
                                animate={{ opacity: [0, 0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-white/10"
                             />
                          )}
                          
                          <span className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">
                              {i === 0 ? "Today" : i === 1 ? "Tmrw" : date.toLocaleDateString("en-US", { weekday: "short" })}
                          </span>
                          <span className="text-3xl font-black tracking-tighter">
                              {date.getDate()}
                          </span>
                          <span className="text-[10px] font-medium mb-1 opacity-60">
                              {date.toLocaleDateString("en-US", { month: "short" })}
                          </span>
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
                      <div className="relative mt-2 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-0.5 shadow-xl shadow-teal-500/20">
                          <div className="bg-white dark:bg-[#0B0F19] rounded-[14px] p-5 flex items-center justify-between relative overflow-hidden">
                              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px]" />
                              
                              <div className="relative z-10 flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
                                      <Sparkles size={24} className={previewLoading ? "animate-spin-slow" : ""} />
                                  </div>
                                  <div>
                                      <p className="text-xs font-bold uppercase text-teal-500 tracking-wider mb-0.5">Live Estimate</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                          Queue for <span className="text-teal-600 dark:text-teal-400">{selectedDepartment?.name}</span>
                                      </p>
                                  </div>
                              </div>

                              <div className="text-right relative z-10">
                                  <div className="text-[10px] text-gray-400 font-mono mb-1">EXPECTED TOKEN</div>
                                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 tracking-tighter">
                                      #{previewLoading ? "..." : expectedTokenNumber ?? "--"}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>

            {/* ---------------- SECTION 3: Priority ---------------- */}
            <motion.section 
              variants={itemVariants} 
              className={`relative group ${!stepReadyDate ? "opacity-40 grayscale blur-[1px] pointer-events-none select-none transition-all duration-500" : "transition-all duration-500"}`}
            >
              <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              <SectionHeader 
                  step="03" 
                  title="Visit Priority" 
                  subtitle="Select your booking category"
              />

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                 {/* Normal (Active) */}
                 <button 
                    type="button" 
                    onClick={() => setPriority("NORMAL")} 
                    className={`
                        relative py-4 px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 group
                        ${priority === "NORMAL"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 shadow-md" 
                            : "bg-white dark:bg-[#131722] border-gray-100 dark:border-gray-800 text-gray-500"}
                    `}
                  >
                    <User size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">Normal</span>
                    {priority === "NORMAL" && (
                        <motion.div layoutId="prio-dot" className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>

                  {/* Disabled Options (Visual Only) */}
                  <button disabled className="py-4 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-700 flex items-center justify-center gap-2 cursor-not-allowed opacity-60">
                     <Stethoscope size={16} />
                     <span className="text-xs font-bold uppercase tracking-widest">Senior</span>
                  </button>
                  
                  <button disabled className="py-4 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-700 flex items-center justify-center gap-2 cursor-not-allowed opacity-60">
                     <AlertTriangle size={16} />
                     <span className="text-xs font-bold uppercase tracking-widest">Emergency</span>
                  </button>
              </div>

              {/* Note about disabled options */}
              <div className="mt-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 flex gap-3">
                 <div className="shrink-0 pt-0.5">
                    <ShieldCheck size={16} className="text-blue-500" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Policy Note</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 leading-relaxed">
                        Senior and Emergency priority bookings are currently restricted to counter visits. 
                        Online booking supports Normal Priority only.
                    </p>
                 </div>
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
              onClick={createToken} 
              className={`
                  flex-1 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl transition-all relative overflow-hidden group
                  ${canConfirm 
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-teal-500/40" 
                      : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"}
              `}
          >
            <div className="relative z-10 py-4 flex items-center justify-center gap-3">
              {creating ? (
                  <>
                      <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-4 h-4" />
                      <span>Booking...</span>
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
  );
};

export default CreateTokenModal;

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
        ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm" 
        : "text-gray-400 grayscale opacity-70"}
  `}>
    {active ? <CheckCircle2 size={12} className="text-emerald-500" /> : icon}
    <span className="hidden sm:inline">{label}</span>
  </div>
);