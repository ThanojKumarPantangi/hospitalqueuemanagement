import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  X,
  UserCheck,
  AlertTriangle,
  Calendar,
  Clock,
  ClipboardList,
  Activity,
  Pill,
  FileText,
  BadgeCheck,
  Stethoscope,
  ChevronDown,
  Building2,
  BadgeIndianRupee,
  Thermometer,
  Heart
} from "lucide-react";

// --- Animations ---
const overlayVars = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVars = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 28 } 
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

const sectionContentVars = {
  hidden: { opacity: 0, y: -10, height: 0, overflow: "hidden" },
  visible: { 
    opacity: 1, 
    y: 0, 
    height: "auto", 
    transition: { duration: 0.3, ease: "easeOut" } 
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    height: 0, 
    transition: { duration: 0.2, ease: "easeIn" } 
  },
};

// --- Sub-components for cleaner UI ---
const DetailRow = ({ label, value, icon: Icon, color = "text-slate-400" }) => (
  <div className="flex items-start gap-3">
    <div className={`mt-0.5 ${color}`}><Icon size={16} /></div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  </div>
);

const VitalCard = ({ label, value, unit, icon: Icon, colorClass }) => (
  <div className="flex-1 min-w-[100px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex flex-col items-center text-center gap-1">
    <div className={`p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm ${colorClass}`}>
      <Icon size={14} />
    </div>
    <span className="text-[10px] font-bold uppercase text-slate-400">{label}</span>
    <span className="text-sm font-black text-slate-800 dark:text-white">
      {value} <span className="text-[10px] text-slate-400 font-medium">{unit}</span>
    </span>
  </div>
);

const PatientVisitDetailsModal = ({
  isOpen,
  onClose,
  visit,
  statusConfig = {},
  // doctor dropdown props
  doctorProfile,
  doctorLoading,
  fetchDoctorProfileById,
}) => {
  const [openSection, setOpenSection] = useState("VISIT"); // VISIT | DOCTOR | null

  // --- Configuration ---
  const defaultStatusConfig = {
    COMPLETED: {
      label: "Completed",
      icon: UserCheck,
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
      border: "border-emerald-200 dark:border-emerald-800"
    },
    CANCELLED: {
      label: "Cancelled",
      icon: AlertTriangle,
      color: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
      border: "border-rose-200 dark:border-rose-800"
    },
    NO_SHOW: {
      label: "No Show",
      icon: Clock,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
      border: "border-amber-200 dark:border-amber-800"
    },
    ...statusConfig,
  };

  const currentStatus = (visit?.status && defaultStatusConfig[visit.status]) || defaultStatusConfig.COMPLETED;
  const StatusIcon = currentStatus.icon;

  // --- Data Extraction ---
  const visitId = visit?._id ?? null;
  const createdAt = visit?.createdAt ?? null;
  const followUpDate = visit?.followUpDate ?? null;
  const doctorId = visit?.doctor?._id;

  const shortId = useMemo(() => visitId ? visitId.slice(-6).toUpperCase() : "N/A", [visitId]);
  
  const formattedDate = useMemo(() => {
    if (!createdAt) return "—";
    return new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [createdAt]);

  const formattedTime = useMemo(() => {
    if (!createdAt) return "—";
    return new Date(createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }, [createdAt]);

  const followUpLabel = useMemo(() => {
    if (!followUpDate) return null;
    return new Date(followUpDate).toLocaleDateString(undefined, { dateStyle: "medium" });
  }, [followUpDate]);

  // --- Handlers ---
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const toggleSection = async (section) => {
    if (openSection === section) {
      setOpenSection(null);
      return;
    }
    setOpenSection(section);
    if (section === "DOCTOR" && !doctorProfile && doctorId) {
      await fetchDoctorProfileById?.(doctorId);
    }
  };

  if (!isOpen || !visit) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          
          {/* Backdrop */}
          <motion.div
            variants={overlayVars}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            variants={modalVars}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              relative w-full max-w-2xl max-h-[90vh] flex flex-col
              bg-white dark:bg-slate-950
              rounded-3xl shadow-2xl
              border border-white/20 dark:border-slate-800
              overflow-hidden
            "
          >
            {/* --- Header --- */}
            <div className="shrink-0 relative z-20 px-6 py-5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${currentStatus.color} ${currentStatus.border}`}>
                    <StatusIcon size={12} />
                    {currentStatus.label}
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-400">#{shortId}</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Visit Summary</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                    <Calendar size={14} className="text-blue-500" /> {formattedDate}
                    <span className="mx-1.5 opacity-30">|</span>
                    <Clock size={14} className="text-orange-500" /> {formattedTime}
                  </p>
                </div>
                {followUpLabel && (
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Follow Up</p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{followUpLabel}</p>
                  </div>
                )}
              </div>
            </div>

            {/* --- Scrollable Body --- */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
              <LayoutGroup>
                <div className="space-y-4">
                  
                  {/* SECTION 1: VISIT DETAILS */}
                  <motion.div 
                    layout 
                    className={`
                      rounded-2xl border overflow-hidden transition-all duration-300
                      ${openSection === "VISIT" 
                        ? "bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/50 shadow-lg shadow-blue-500/5" 
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700"}
                    `}
                  >
                    <button
                      onClick={() => toggleSection("VISIT")}
                      className="w-full flex items-center justify-between px-5 py-4 outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${openSection === "VISIT" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"} transition-colors`}>
                          <ClipboardList size={20} />
                        </div>
                        <div className="text-left">
                           <h3 className="text-sm font-bold text-slate-900 dark:text-white">Clinical Notes</h3>
                           <p className="text-xs text-slate-500">Diagnosis, Symptoms & Vitals</p>
                        </div>
                      </div>
                      <motion.div animate={{ rotate: openSection === "VISIT" ? 180 : 0 }}>
                        <ChevronDown size={18} className="text-slate-400" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {openSection === "VISIT" && (
                        <motion.div variants={sectionContentVars} initial="hidden" animate="visible" exit="exit">
                          <div className="px-5 pb-5 pt-2 space-y-6">
                            
                            {/* Vitals Grid */}
                            {visit?.vitals && Object.values(visit.vitals).some(Boolean) && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {visit.vitals.bp && <VitalCard label="BP" value={visit.vitals.bp} unit="mmHg" icon={Activity} colorClass="text-rose-500" />}
                                {visit.vitals.pulse && <VitalCard label="Pulse" value={visit.vitals.pulse} unit="bpm" icon={Heart} colorClass="text-red-500" />}
                                {visit.vitals.temperature && <VitalCard label="Temp" value={visit.vitals.temperature} unit="°F" icon={Thermometer} colorClass="text-orange-500" />}
                                {visit.vitals.weight && <VitalCard label="Weight" value={visit.vitals.weight} unit="kg" icon={Activity} colorClass="text-indigo-500" />}
                              </div>
                            )}

                            {/* Clinical Text */}
                            <div className="grid sm:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-wider">
                                  <AlertTriangle size={12} /> Reported Symptoms
                                </h4>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-rose-50 dark:bg-rose-900/10 p-3 rounded-xl border border-rose-100 dark:border-rose-900/20">
                                  {visit?.symptoms || "No symptoms recorded."}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                                  <BadgeCheck size={12} /> Diagnosis
                                </h4>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                                  {visit?.diagnosis || "Diagnosis pending."}
                                </p>
                              </div>
                            </div>

                            {/* Prescriptions Table */}
                            <div className="space-y-2">
                              <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <Pill size={12} /> Prescriptions
                              </h4>
                              {visit?.prescriptions?.length > 0 ? (
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                  <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                      <tr>
                                        <th className="px-4 py-3 font-bold text-slate-500 text-xs">Medicine</th>
                                        <th className="px-4 py-3 font-bold text-slate-500 text-xs">Dosage</th>
                                        <th className="px-4 py-3 font-bold text-slate-500 text-xs text-right">Duration</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                      {visit.prescriptions.map((p, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                          <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{p?.medicineName}</td>
                                          <td className="px-4 py-3">
                                            <div className="font-semibold text-slate-700 dark:text-slate-300">{p?.dosage}</div>
                                            {(p?.frequency || p?.instructions) && (
                                              <div className="text-[10px] text-slate-400 mt-0.5">{[p?.frequency, p?.instructions].filter(Boolean).join(" • ")}</div>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">{p?.duration}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                                  No prescriptions added.
                                </div>
                              )}
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* SECTION 2: DOCTOR DETAILS */}
                  <motion.div 
                    layout 
                    className={`
                      rounded-2xl border overflow-hidden transition-all duration-300
                      ${openSection === "DOCTOR" 
                        ? "bg-white dark:bg-slate-900 border-teal-200 dark:border-teal-900/50 shadow-lg shadow-teal-500/5" 
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-200 dark:hover:border-slate-700"}
                    `}
                  >
                    <button
                      onClick={() => toggleSection("DOCTOR")}
                      className="w-full flex items-center justify-between px-5 py-4 outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${openSection === "DOCTOR" ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-500"} transition-colors`}>
                          <Stethoscope size={20} />
                        </div>
                        <div className="text-left">
                           <h3 className="text-sm font-bold text-slate-900 dark:text-white">Doctor Profile</h3>
                           <p className="text-xs text-slate-500">Consultant details & fees</p>
                        </div>
                      </div>
                      <motion.div animate={{ rotate: openSection === "DOCTOR" ? 180 : 0 }}>
                        <ChevronDown size={18} className="text-slate-400" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {openSection === "DOCTOR" && (
                        <motion.div variants={sectionContentVars} initial="hidden" animate="visible" exit="exit">
                          <div className="px-5 pb-5 pt-2">
                             {!doctorId ? (
                                <p className="text-xs text-rose-500 font-medium">Doctor information unavailable.</p>
                             ) : doctorLoading ? (
                                <div className="animate-pulse space-y-3">
                                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                                  <div className="h-16 bg-slate-100 rounded-xl"></div>
                                </div>
                             ) : doctorProfile ? (
                                <div className="space-y-4">
                                   <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                      <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold text-lg">
                                        {doctorProfile.name?.toUpperCase()?.charAt(0)}
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Dr. {doctorProfile.name?.toUpperCase()}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{doctorProfile.specialization} • {doctorProfile.experienceYears} Years Exp.</p>
                                      </div>
                                   </div>

                                   <div className="grid grid-cols-2 gap-3">
                                      <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                         <DetailRow label="Department" value={doctorProfile.department?.name || "—"} icon={Building2} color="text-indigo-500" />
                                      </div>
                                      <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                         <DetailRow label="Consultation Fee" value={`₹${doctorProfile.department?.consultationFee || 0}`} icon={BadgeIndianRupee} color="text-emerald-500" />
                                      </div>
                                   </div>
                                   
                                   {doctorProfile.bio && (
                                     <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">About</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{doctorProfile.bio}</p>
                                     </div>
                                   )}
                                </div>
                             ) : (
                               <p className="text-xs text-slate-400">Profile could not be loaded.</p>
                             )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                </div>
              </LayoutGroup>
            </div>

            {/* --- Footer --- */}
            <div className="shrink-0 p-5 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold text-sm transition-all shadow-lg shadow-slate-200 dark:shadow-none"
              >
                <FileText size={18} />
                Download Report PDF
              </motion.button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PatientVisitDetailsModal;