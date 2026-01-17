import React, { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  Users,
  Clock,
  IndianRupee,
  Save,
  Sparkles,
  Pencil,
  LayoutGrid,
  Settings2,
  CheckCircle2,
  AlertCircle,
  Timer,
  Wallet,
  ArrowRight,
  MousePointer2,
  History
} from "lucide-react";

// --- Utility Components ---

const Tooltip = ({ text, children }) => (
  <div className="group relative flex items-center">
    {children}
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-max max-w-[200px] px-2 py-1 bg-gray-900 text-white text-[10px] rounded shadow-lg z-50 pointer-events-none">
      {text}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

const SectionHeading = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-6 p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
    <div className="p-2.5 rounded-xl bg-white dark:bg-gray-700 shadow-sm text-teal-600 dark:text-teal-400">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
    </div>
  </div>
);

// --- Main Modal Component ---

const DepartmentModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  // --- Constants ---
  const DEFAULT_SLOT_TIMES = [10, 15, 20, 30, 45, 60];
  const TABS = [
    { id: "general", label: "General Info", icon: Building2 },
    { id: "queue", label: "Queue Logic", icon: Timer },
    { id: "fees", label: "Consultation", icon: Wallet },
  ];

  // --- State ---
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState({
    name: "",
    maxCounters: 1,
    consultationFee: 0,
    slotDurationMinutes: 15,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const nameInputRef = useRef(null);

  // --- Effects ---
  
  // Reset/Init State
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          maxCounters: Number(initialData.maxCounters) || 1,
          consultationFee: Number(initialData.consultationFee) || 0,
          slotDurationMinutes: Number(initialData.slotDurationMinutes) || 15,
        });
      } else {
        setFormData({ name: "", maxCounters: 1, consultationFee: 0, slotDurationMinutes: 15 });
      }
      setActiveTab("general");
      setTouched({});
      // Auto-focus after animation
      setTimeout(() => nameInputRef.current?.focus(), 300);
    }
  }, [isOpen, initialData]);

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      // Optional: Tab switching with keys could go here
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden"; // Lock scroll
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // --- Validation ---
  const errors = useMemo(() => {
    const errs = {};
    if (!formData.name?.trim()) errs.name = "Department name is required";
    else if (formData.name.length < 3) errs.name = "Name must be at least 3 characters";
    
    if (formData.maxCounters < 1) errs.maxCounters = "At least 1 counter required";
    if (formData.maxCounters > 20) errs.maxCounters = "Max 20 counters allowed";

    if (formData.consultationFee < 0) errs.consultationFee = "Fee cannot be negative";

    if (formData.slotDurationMinutes < 5) errs.slotDurationMinutes = "Minimum 5 minutes";

    return errs;
  }, [formData]);

  const isValid = Object.keys(errors).length === 0;

  // --- Handlers ---
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (!touched[field]) setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, maxCounters: true, consultationFee: true, slotDurationMinutes: true });
    
    if (!isValid) {
      // Shake animation or error toast logic could go here
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      // Wait for parent to close or close immediately
      // onClose(); 
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Animation Variants ---
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 30, rotateX: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      rotateX: 0,
      transition: { type: "spring", stiffness: 350, damping: 25, mass: 0.8 } 
    },
    exit: { opacity: 0, scale: 0.95, y: 30, transition: { duration: 0.2 } }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  // --- Render Helpers ---
  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <motion.div key="general" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
            <SectionHeading 
              icon={LayoutGrid} 
              title="Department Identity" 
              subtitle="Basic information visible to patients and staff." 
            />
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1">
                Display Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                  touched.name && errors.name ? "text-rose-400" : "text-gray-400 group-focus-within:text-teal-500"
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Cardiology"
                  className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 rounded-2xl outline-none transition-all font-semibold text-gray-900 dark:text-white placeholder-gray-400 ${
                    touched.name && errors.name 
                    ? "border-rose-100 bg-rose-50/50 focus:border-rose-500 focus:bg-white dark:bg-rose-900/10 dark:border-rose-900" 
                    : "border-transparent focus:border-teal-500 focus:bg-white dark:focus:bg-gray-950 hover:bg-white dark:hover:bg-gray-900"
                  }`}
                />
                {touched.name && errors.name && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500">
                    <AlertCircle className="w-5 h-5" />
                  </motion.div>
                )}
              </div>
              {touched.name && errors.name && (
                <p className="text-xs text-rose-500 font-medium ml-1">{errors.name}</p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 flex gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 h-fit">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Pro Tip</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Use clear, standard medical terms for department names to help patients find the right service easily in the kiosk.
                </p>
              </div>
            </div>
          </motion.div>
        );

      case "queue":
        return (
          <motion.div key="queue" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
             <SectionHeading 
              icon={Settings2} 
              title="Operational Logic" 
              subtitle="Configure how queues and appointments are handled." 
            />

            {/* Slot Duration Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Slot Duration
                </label>
                <span className="text-xl font-black text-teal-600 dark:text-teal-400 font-mono">
                  {formData.slotDurationMinutes}<span className="text-sm text-gray-400 font-sans ml-1">mins</span>
                </span>
              </div>
              
              <div className="relative h-12 flex items-center">
                 <input 
                   type="range" 
                   min="5" 
                   max="120" 
                   step="5"
                   value={formData.slotDurationMinutes}
                   onChange={(e) => handleChange("slotDurationMinutes", Number(e.target.value))}
                   className="w-full absolute z-20 opacity-0 cursor-pointer h-full"
                 />
                 <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative z-10">
                    <div 
                      className="h-full bg-teal-500 transition-all duration-75 ease-out" 
                      style={{ width: `${(formData.slotDurationMinutes / 120) * 100}%` }}
                    />
                 </div>
                 <div 
                    className="absolute h-6 w-6 bg-white dark:bg-gray-900 border-2 border-teal-500 rounded-full shadow-md z-10 pointer-events-none transition-all duration-75 ease-out flex items-center justify-center"
                    style={{ left: `calc(${(formData.slotDurationMinutes / 120) * 100}% - 12px)` }}
                 >
                   <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                 </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {DEFAULT_SLOT_TIMES.map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleChange("slotDurationMinutes", time)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      formData.slotDurationMinutes === time
                      ? "bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-500/20"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-teal-400"
                    }`}
                  >
                    {time}m
                  </button>
                ))}
              </div>
            </div>

            {/* Counters Stepper */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
               <div className="flex justify-between items-center">
                 <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Active Counters
                    </label>
                    <p className="text-[10px] text-gray-400 mt-0.5">Physical desks available</p>
                 </div>
                 
                 <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleChange("maxCounters", Math.max(1, formData.maxCounters - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-transform text-gray-600 dark:text-gray-300"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-lg text-gray-900 dark:text-white font-mono">
                      {formData.maxCounters}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleChange("maxCounters", Math.min(20, formData.maxCounters + 1))}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-transform text-gray-600 dark:text-gray-300"
                    >
                      +
                    </button>
                 </div>
               </div>
            </div>
          </motion.div>
        );

      case "fees":
        return (
          <motion.div key="fees" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
            <SectionHeading 
              icon={Wallet} 
              title="Financials" 
              subtitle="Set up billing and consultation charges." 
            />

            <div className="relative p-6 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl overflow-hidden">
               {/* Decorative Circles */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

               <label className="relative z-10 text-xs font-bold uppercase tracking-widest text-gray-400">
                 Consultation Fee
               </label>
               
               <div className="relative z-10 mt-2 flex items-baseline gap-1">
                 <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-white">
                   ₹
                 </span>
                 <input
                   type="number"
                   min="0"
                   value={formData.consultationFee}
                   onChange={(e) => handleChange("consultationFee", Number(e.target.value))}
                   className="bg-transparent text-5xl font-black outline-none w-full placeholder-gray-600"
                   placeholder="0"
                 />
               </div>
               
               <p className="relative z-10 mt-4 text-xs text-gray-400 flex items-center gap-2">
                 <History className="w-3 h-3" /> Auto-saved to billing module
               </p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="text-xs text-orange-800 dark:text-orange-200">
                <span className="font-bold">Note:</span> Changing fees will only apply to new tokens generated after the update. Existing tokens will retain their original fee.
              </div>
            </div>
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 overflow-hidden">
          
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={!isSubmitting ? onClose : undefined}
            className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col sm:flex-row bg-white dark:bg-gray-900 sm:rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            
            {/* --- LEFT SIDEBAR (Navigation & Preview) --- */}
            <div className="w-full sm:w-72 bg-gray-50/80 dark:bg-gray-950/50 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-800 flex flex-col">
               
               {/* Modal Header (Mobile/Desktop) */}
               <div className="p-6 pb-2">
                 <div className="flex items-center gap-3 mb-1">
                   <div className={`p-2.5 rounded-xl ${initialData ? "bg-indigo-100 text-indigo-600" : "bg-teal-100 text-teal-600"}`}>
                     {initialData ? <Pencil className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                   </div>
                   <h2 className="text-lg font-black text-gray-900 dark:text-white leading-none">
                     {initialData ? "Edit Dept" : "New Dept"}
                   </h2>
                 </div>
                 <p className="text-xs text-gray-500 ml-11">
                   {initialData ? `ID: ${initialData._id?.slice(-6)}` : "Create new service unit"}
                 </p>
               </div>

               {/* Navigation Tabs */}
               <div className="px-4 py-4 flex sm:flex-col gap-2 overflow-x-auto hide-scrollbar">
                  {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                          isActive 
                          ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700" 
                          : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        <Icon className={`w-4.5 h-4.5 ${isActive ? "text-teal-500" : "text-gray-400"}`} />
                        {tab.label}
                        {isActive && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500" />}
                      </button>
                    )
                  })}
               </div>

               {/* Live Preview Card (Desktop Only typically, but styled for both) */}
               <div className="mt-auto p-6 hidden sm:block">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-3 tracking-wider">Live Preview</p>
                  <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-blue-500" />
                     <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                           <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">Open</span>
                     </div>
                     <h4 className="font-bold text-gray-900 dark:text-white truncate">
                        {formData.name || "Dept Name"}
                     </h4>
                     <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formData.slotDurationMinutes}m</span>
                        <span className="font-mono font-bold">₹{formData.consultationFee}</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* --- RIGHT CONTENT AREA --- */}
            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900">
              
              {/* Scrollable Form Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8">
                <form id="dept-form" onSubmit={handleSubmit}>
                   <AnimatePresence mode="wait">
                     {renderTabContent()}
                   </AnimatePresence>
                </form>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
                
                {/* Mobile Preview Text */}
                <div className="sm:hidden text-xs">
                   <span className="font-bold text-gray-900 dark:text-white">{formData.name || "Untitled"}</span>
                   <span className="text-gray-400 mx-1">•</span>
                   <span className="text-gray-500">Step {TABS.findIndex(t => t.id === activeTab) + 1}/3</span>
                </div>

                <div className="flex gap-3 ml-auto">
                   <button
                     type="button"
                     onClick={onClose}
                     disabled={isSubmitting}
                     className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                   >
                     Cancel
                   </button>
                   
                   <button
                     form="dept-form"
                     type="submit"
                     disabled={isSubmitting}
                     className={`
                       group relative overflow-hidden flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all 
                       ${isSubmitting 
                          ? "bg-gray-400 cursor-not-allowed" 
                          : "bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 hover:shadow-xl hover:-translate-y-0.5"
                       }
                     `}
                   >
                     {isSubmitting ? (
                        <div className="flex items-center gap-2">
                           <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           <span>Saving...</span>
                        </div>
                     ) : (
                        <>
                           <span className="relative z-10">{initialData ? "Save Changes" : "Create Dept"}</span>
                           <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                        </>
                     )}
                   </button>
                </div>
              </div>

            </div>

            {/* Close Button (Absolute) */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors sm:hidden z-50"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DepartmentModal;