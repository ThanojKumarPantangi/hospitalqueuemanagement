import React, { useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Phone,
  Calendar,
  Droplets,
  MapPin,
  ShieldCheck,
  HeartPulse,
  Contact,
  Activity,
} from "lucide-react";

/* ---------------- Animation Variants ---------------- */
const overlayVariants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { 
    opacity: 1, 
    backdropFilter: "blur(4px)",
    transition: { duration: 0.3 } 
  },
  exit: { opacity: 0, backdropFilter: "blur(0px)", transition: { duration: 0.2 } },
};

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    rotateX: 10 
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
      mass: 0.8,
      staggerChildren: 0.05, // Stagger effect for children
      delayChildren: 0.1,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10,
    transition: { duration: 0.2 } 
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  },
};

export default function PatientProfileModal({
  isOpen,
  onClose,
  patient = {},
  size = "md",
}) {
  const dialogRef = useRef(null);

  /* -------- DERIVED DATA -------- */
  const data = useMemo(() => {
    if (!isOpen || !patient) return null;
    return {
      id: patient?.user?._id || "-",
      name: patient?.user?.name || "Unknown Patient",
      email: patient?.user?.email || "-",
      phone: patient?.user?.phone || "-",
      role: patient?.user?.role || "PATIENT",
      verified: patient?.user?.isPhoneVerified || false,
      dob: patient?.profile?.dateOfBirth
        ? patient.profile.dateOfBirth.split("T")[0]
        : "-",
      gender: patient?.profile?.gender || "-",
      blood: patient?.profile?.bloodGroup || "-",
      emergency: patient?.profile?.emergencyContact || {},
      address: patient?.profile?.address || "-",
    };
  }, [isOpen, patient]);

  /* ESC Close Listener */
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  /* Backdrop Click */
  const handleBackdropClick = (e) => {
    if (dialogRef.current && !dialogRef.current.contains(e.target)) {
      onClose?.();
    }
  };

  const maxWidthClass =
    size === "sm"
      ? "max-w-md"
      : size === "lg"
      ? "max-w-5xl"
      : "max-w-3xl";

  return (
    <AnimatePresence mode="wait">
      {isOpen && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-gray-900/60"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            ref={dialogRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full ${maxWidthClass} bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]`}
            role="dialog"
            aria-modal="true"
          >
            {/* Header Section */}
            <div className="relative bg-teal-50/50 dark:bg-teal-900/10 p-6 sm:p-8 border-b border-teal-100 dark:border-teal-900/30">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-5 items-center">
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ type: "spring", delay: 0.2 }}
                    className="h-16 w-16 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50"
                  >
                    <User size={32} strokeWidth={1.5} />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                      {data.name}
                    </h2>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs uppercase tracking-wider">
                        {data.role}
                      </span>
                      <span>ID: <span className="font-mono">{data.id.slice(-6)}...</span></span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-black/20 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                  {data.verified && (
                    <motion.div 
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800/50"
                    >
                      <ShieldCheck size={14} />
                      <span className="uppercase tracking-wide">Verified</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-8">
              
              {/* Personal Details */}
              <Section title="Personal Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem icon={Phone} label="Phone Number" value={data.phone} delay={0.1} />
                  <InfoItem icon={Calendar} label="Date of Birth" value={data.dob} delay={0.2} />
                  <InfoItem icon={User} label="Gender" value={data.gender} delay={0.3} />
                  <InfoItem icon={MapPin} label="Address" value={data.address} delay={0.4} fullWidth />
                </div>
              </Section>

              {/* Medical Details */}
              <Section title="Medical Profile">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem 
                    icon={Droplets} 
                    label="Blood Group" 
                    value={data.blood} 
                    highlight 
                    delay={0.5}
                  />
                  {/* Placeholder for future expansion */}
                  <InfoItem 
                    icon={Activity} 
                    label="Status" 
                    value="Active Patient" 
                    delay={0.5}
                  />
                </div>
              </Section>

              {/* Emergency Contact - Distinct Style */}
              {data.emergency?.name && (
                <motion.div variants={itemVariants} className="mt-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-3 flex items-center gap-2">
                    <HeartPulse size={14} /> Emergency Contact
                  </h3>
                  <div className="bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl p-5 border border-rose-100 dark:border-rose-900/30 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <SimpleInfo label="Contact Name" value={data.emergency.name} />
                    <SimpleInfo label="Relation" value={data.emergency.relation} />
                    <SimpleInfo label="Emergency Phone" value={data.emergency.phone} isPhone />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 transition-all shadow-sm active:scale-95"
              >
                Close Profile
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* -------- Sub-Components -------- */

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">
      {title}
    </h3>
    {children}
  </div>
);

const InfoItem = ({ icon: Icon, label, value, highlight, fullWidth}) => (
  <motion.div
    variants={itemVariants}
    className={`
      flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 group
      ${fullWidth ? "col-span-1 md:col-span-2" : ""}
      ${
        highlight
          ? "bg-teal-50/40 border-teal-100 dark:bg-teal-900/20 dark:border-teal-900/50"
          : "bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 hover:border-teal-200 dark:hover:border-teal-800"
      }
    `}
  >
    <div className={`
      p-2.5 rounded-xl shrink-0 transition-colors
      ${highlight 
        ? "bg-teal-100 text-teal-600 dark:bg-teal-800 dark:text-teal-200" 
        : "bg-gray-50 text-gray-400 group-hover:text-teal-500 group-hover:bg-teal-50 dark:bg-gray-800 dark:text-gray-500 dark:group-hover:bg-teal-900/30"
      }
    `}>
      <Icon size={18} strokeWidth={2} />
    </div>
    <div className="flex flex-col">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
        {label}
      </span>
      <span className={`text-sm font-semibold ${highlight ? 'text-teal-900 dark:text-teal-100' : 'text-gray-900 dark:text-gray-100'}`}>
        {value || "N/A"}
      </span>
    </div>
  </motion.div>
);

const SimpleInfo = ({ label, value, isPhone }) => (
  <div>
    <p className="text-[10px] font-bold text-rose-400 dark:text-rose-400/70 uppercase tracking-wider mb-1">
      {label}
    </p>
    <p className={`font-medium ${isPhone ? "font-mono" : ""} text-gray-900 dark:text-white`}>
      {value || "-"}
    </p>
  </div>
);