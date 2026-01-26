import React from "react";
import BaseModal from "./BaseModal";
import Badge from "../badge/badge"; // Keeping your original import
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ban, 
  CalendarDays, 
  Clock, 
  ShieldAlert, 
  X, 
  Trash2, 
  AlertCircle,
  Activity,
  History
} from "lucide-react";

const CancelTokenModal = ({
  open,
  onClose,
  token,
  upcomingTokens,
  cancellingId,
  handleCancelToken,
}) => {
  const noAppointments = !token && upcomingTokens.length === 0;

  // ---------------- Animation Variants ----------------
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.08,
        delayChildren: 0.1 
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { type: "spring", stiffness: 100, damping: 15 } 
    },
    exit: { opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }
  };

  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-3xl">
      <div className="flex flex-col h-full max-h-[85vh] bg-white dark:bg-[#0B0F19]">
        
        {/* --- Cinematic Header Section --- */}
        <div className="relative shrink-0 px-8 pt-10 pb-8 z-10 overflow-hidden border-b border-gray-100 dark:border-gray-800">
            {/* Background Decorative Elements (Red/Rose Theme) */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute top-0 left-0 w-40 h-40 bg-orange-500/10 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <motion.div 
                        initial={{ rotate: -10, scale: 0.8 }}
                        animate={{ rotate: 0, scale: 1 }}
                        className="h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-rose-500/30 ring-4 ring-rose-50 dark:ring-rose-900/20"
                    >
                        <ShieldAlert size={30} strokeWidth={2.5} />
                    </motion.div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                            Manage <span className="text-rose-600 dark:text-rose-400">Visits</span>
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                            Review and cancel your scheduled appointments
                        </p>
                    </div>
                </div>

                {/* Stats Pills */}
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-full border border-gray-100 dark:border-gray-800">
                    <StatusPill 
                        icon={<Activity size={13} />} 
                        label={token ? "1 Active" : "0 Active"} 
                        active={!!token}
                        color="rose"
                    />
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                    <StatusPill 
                        icon={<History size={13} />} 
                        label={`${upcomingTokens?.length || 0} Upcoming`} 
                        active={upcomingTokens?.length > 0}
                        color="gray"
                    />
                </div>
            </div>
        </div>

        {/* --- Scrollable Content Area --- */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-gray-50/50 dark:bg-[#0f121a]">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="p-6 md:p-8 space-y-8"
          >
            
            {noAppointments ? (
                /* Empty State */
                <motion.div 
                    variants={itemVariants}
                    className="flex flex-col items-center justify-center py-16 text-center"
                >
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        <Ban size={40} className="text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Appointments Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
                        You don&apos;t have any active or upcoming appointments at the moment.
                    </p>
                </motion.div>
            ) : (
                <>
                    {/* 1. Active Token Section */}
                    <AnimatePresence mode="popLayout">
                        {token && (
                            <motion.section variants={itemVariants} layout>
                                <SectionHeader title="Active Now" icon={<Activity size={14} />} />
                                
                                <div className="mt-3 relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 to-orange-600 p-[1px] shadow-lg shadow-rose-500/20">
                                    <div className="bg-white dark:bg-[#131722] rounded-[15px] p-5 flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden">
                                        {/* Background Decoration */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                        
                                        <div className="flex items-center gap-4 z-10 w-full sm:w-auto">
                                            <div className="h-14 w-14 shrink-0 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                                <Clock size={24} className="animate-pulse-slow" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                                                        Live
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-mono">
                                                        ID: {token.tokenNumber}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                                    {token.departmentName}
                                                </h3>
                                                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <Badge date={new Date()} />
                                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                    <span className="font-medium text-rose-600 dark:text-rose-400">{token.status}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            disabled={cancellingId === token._id || token.status === "CALLED"}
                                            onClick={() => handleCancelToken(token._id)}
                                            className="w-full sm:w-auto z-10 px-5 py-3 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider border border-rose-200 dark:border-rose-900/30 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {cancellingId === token._id ? (
                                                <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                            ) : (
                                                <X size={16} />
                                            )}
                                            {cancellingId === token._id ? "Processing" : "Cancel"}
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>

                    {/* 2. Upcoming Tokens Section */}
                    {upcomingTokens.length > 0 && (
                        <motion.section variants={itemVariants} layout>
                            <SectionHeader title="Upcoming Visits" icon={<CalendarDays size={14} />} />
                            
                            <div className="mt-3 space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {upcomingTokens.map((t) => (
                                        <motion.div
                                            key={t._id}
                                            layout
                                            variants={itemVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            className="group bg-white dark:bg-[#131722] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors shadow-sm"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-10 w-10 mt-1 sm:mt-0 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                                                        <CalendarDays size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-base">
                                                            {t.departmentName}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                <span className="font-mono font-bold text-gray-400">#{t.tokenNumber}</span>
                                                            </div>
                                                            <div className="hidden sm:block w-px h-3 bg-gray-300 dark:bg-gray-700" />
                                                            <Badge date={t.appointmentDate} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <motion.button
                                                    whileHover={{ scale: 1.02, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                                                    whileTap={{ scale: 0.98 }}
                                                    disabled={cancellingId === t._id}
                                                    onClick={() => handleCancelToken(t._id)}
                                                    className="shrink-0 px-4 py-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-lg text-xs font-bold uppercase tracking-wide border border-transparent hover:border-red-200 dark:hover:border-red-900/30 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {cancellingId === t._id ? (
                                                        <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                    <span>Cancel</span>
                                                </motion.button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.section>
                    )}
                </>
            )}

            {/* Helper Info */}
            {!noAppointments && (
                <motion.div variants={itemVariants} className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 flex gap-3">
                    <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        <span className="font-bold">Note:</span> Cancellation cannot be undone. If you cancel a token, you will lose your current position in the queue and must create a new booking.
                    </p>
                </motion.div>
            )}

          </motion.div>
        </div>

        {/* --- Footer --- */}
        <div className="shrink-0 p-6 bg-white/80 dark:bg-[#0B0F19]/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-20">
             <motion.button
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-gray-900 dark:bg-gray-800 text-white font-bold tracking-wide shadow-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-all"
             >
                Close Manager
             </motion.button>
        </div>

      </div>
    </BaseModal>
  );
};

export default CancelTokenModal;

/* --- UI Helper Components --- */

const SectionHeader = ({ title, icon }) => (
    <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-rose-500 dark:text-rose-400">{icon}</span>
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {title}
        </h3>
    </div>
);

const StatusPill = ({ active, icon, label, color }) => (
  <div className={`
    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all
    ${active 
        ? `bg-white dark:bg-gray-800 text-${color}-600 dark:text-${color}-400 shadow-sm` 
        : "text-gray-400 grayscale opacity-70"}
  `}>
    {icon}
    <span>{label}</span>
  </div>
);