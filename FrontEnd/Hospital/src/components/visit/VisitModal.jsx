/* ------------------------------------------------------------- */
/* -------------------- Create Visit Record -------------------- */
/* ------------------------------------------------------------- */

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { showToast } from '../../utils/toastBus.js';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import {
  searchMedicinesApi,
  matchTemplateMedicineApi,
} from "../../api/medicine.api.js"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Activity,
  Stethoscope,
  Pill,
  Thermometer,
  Heart,
  Scale,
  ClipboardCheck,
  Trash2,
} from "lucide-react";

/* -------------------- Helpers -------------------- */

const createEmptyPrescription = () => ({
  id: crypto.randomUUID(),
  medicineId: "",
  medicineName: "",
  form: "",
  strength: "",
  dosage: "",
  duration: "",
  frequency: "",
  instructions: "",
});

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatDateGB = (date) =>
  date
    ? date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

const sameDay = (a, b) => {
  if (!a || !b) return false;
  return a.toDateString() === b.toDateString();
};

/* -------------------- Animations -------------------- */

const overlayVars = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

const modalVars = {
  hidden: { opacity: 0, scale: 0.96, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 12,
    transition: { duration: 0.25, ease: "easeInOut" },
  },
};

const fadeUpVars = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const calendarVars = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0.2, 0.85, 0.25, 1] },
  },
  exit: { opacity: 0, y: 8, scale: 0.99, transition: { duration: 0.18 } },
};

/* -------------------- Sub-Components -------------------- */

const Label = ({ children, required, rightTag }) => (
  <div className="flex items-center justify-between mb-1.5">
    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
      {children}
    </label>
    {required && (
      <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">
        Required
      </span>
    )}
    {rightTag && <span className="text-[10px] font-medium text-slate-400">{rightTag}</span>}
  </div>
);

const BaseInput = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={cn(
      "w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg px-3.5 py-2.5 outline-none transition-shadow",
      "placeholder:text-slate-400 dark:placeholder:text-slate-500",
      "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20",
      className
    )}
  />
));
BaseInput.displayName = "BaseInput";

const SectionTitle = ({ icon: Icon, title, description }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2 mb-1">
      {Icon && <Icon size={18} className="text-blue-500" />}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">{title}</h3>
    </div>
    {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
  </div>
);

/* -------------------- Main Component -------------------- */

const VisitRecordModal = ({ isOpen, onClose, onSave, saving }) => {
  const prefersReducedMotion = useReducedMotion();

  /* ---------- Visit Fields ---------- */
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isMatchingTemplate, setIsMatchingTemplate] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [vitals, setVitals] = useState({
    temperature: "",
    bp: "",
    pulse: "",
    weight: "",
  });

  /* ---------- Prescription ---------- */
  const [prescriptions, setPrescriptions] = useState([createEmptyPrescription()]);

  const addPrescription = () =>
    setPrescriptions((prev) => [...prev, createEmptyPrescription()]);

  const removePrescription = (id) => {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePrescription = (index, field, value) => {
    const copy = [...prescriptions];
    copy[index][field] = value;
    setPrescriptions(copy);
  };

  /* ---------- Follow-up Calendar ---------- */
  const [selectedDate, setSelectedDate] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const calendarRef = useRef(null);

  /* ---------- Logic ---------- */
  const validPrescriptionsCount = useMemo(() => {
    return prescriptions.filter((p) => p.medicineName && p.medicineName.trim()).length;
  }, [prescriptions]);

  const completionScore = useMemo(() => {
    const hasSymptoms = Boolean(symptoms.trim());
    const hasDiagnosis = Boolean(diagnosis.trim());
    const hasVitals = Object.values(vitals).some((v) => String(v || "").trim().length > 0);
    const hasRx = validPrescriptionsCount > 0;

    const raw =
      (hasDiagnosis ? 40 : 0) +
      (hasSymptoms ? 20 : 0) +
      (hasVitals ? 20 : 0) +
      (hasRx ? 20 : 0);

    return clamp(raw, 0, 100);
  }, [symptoms, diagnosis, vitals, validPrescriptionsCount]);

  /* ---------- Calendar Memo ---------- */
  const monthLabel = useMemo(() => {
    return viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [viewDate]);

  const firstDayIndex = useMemo(() => {
    return new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  }, [viewDate]);

  const daysInMonth = useMemo(() => {
    return new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  }, [viewDate]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  const emptySlots = useMemo(() => {
    return Array.from({ length: firstDayIndex }, (_, i) => i);
  }, [firstDayIndex]);

  /* ---------- Stable handlers ---------- */
  const handleClose = useCallback(() => {
    setIsCalendarOpen(false);
    setViewDate(new Date());
    onClose?.();
  }, [onClose]);

  /* ---------- Search Function ---------- */
  const handleMedicineSearch = (value, index) => {
    updatePrescription(index, "medicineName", value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value || value.trim().length < 2) {
      setSearchResults([]);
      setActiveSearchIndex(null);
      setIsSearching(false); 
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true); 
        const res = await searchMedicinesApi(value.trim());
        const results = Array.isArray(res?.data?.data)
          ? res.data.data
          : [];
        setSearchResults(results);
        setActiveSearchIndex(index);
      } catch (err) {
        setIsSearching(false);
        console.error("Search error", err);
        setSearchResults([]);
      }
      finally{
        setIsSearching(false);
      }
    }, 300);
  };

  /* ---------- Medicine Variant Select ---------- */
  const handleVariantSelect = async (variantObj, index) => {
    if (isMatchingTemplate) return;
    const {
      medicineId,
      name,
      form,
      strength,
      defaultDosage,
      defaultFrequency,
      defaultInstructions,
    } = variantObj;

    try {
      setIsMatchingTemplate(true);
      const res = await matchTemplateMedicineApi({
        medicineId,
        form,
        strength,
      });

      const matched = res?.data?.data || null;

      const followUpDays = matched?.followUpDays ?? null;

      const copy = [...prescriptions];

      copy[index] = {
        ...copy[index],
        medicineId,
        medicineName: name,
        form,
        strength,
        dosage: matched?.dosage ??strength?? "",
        frequency: matched?.frequency ?? defaultFrequency ?? "",
        duration: matched?.duration ?? "",
        instructions:
          matched?.instructions ?? defaultInstructions ?? "",
      };

      setPrescriptions(copy);
      
      if (followUpDays && !selectedDate) {
        const today = new Date();
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + Number(followUpDays));
        setSelectedDate(nextDate);
      }
    } catch (err) {
      console.error("Match error", err);

      // fallback to global defaults
      const copy = [...prescriptions];

      copy[index] = {
        ...copy[index],
        medicineId,
        medicineName: name,
        form,
        strength,
        dosage: defaultDosage ?? "",
        frequency: defaultFrequency ?? "",
        duration: "",
        instructions: defaultInstructions ?? "",
      };

      setPrescriptions(copy);
    }
    finally {
      setIsMatchingTemplate(false);
      setSearchResults([]);
    setActiveSearchIndex(null);
    }
  };

  // Wrapped in useCallback to satisfy dependency requirements
  const handleSave = useCallback(() => {
    if (!diagnosis.trim()) {
      showToast({ type: "error", message: "Diagnosis is required to save record." });
      return;
    }

    const validPrescriptions = prescriptions.filter(
      (p) => p.medicineName && p.medicineName.trim()
    );

    if (!symptoms.trim() && validPrescriptions.length === 0) {
      showToast({ type: "error", message: "Please add symptoms or a prescription." });
      return;
    }

    setPrescriptions([createEmptyPrescription()]);

    onSave({
      symptoms: symptoms.trim() || null,
      diagnosis: diagnosis.trim(),
      vitals: {
        temperature: vitals.temperature || null,
        bp: vitals.bp || null,
        pulse: vitals.pulse || null,
        weight: vitals.weight || null,
      },
      prescriptions: validPrescriptions,
      followUpDate: selectedDate || null,
    });
  }, [diagnosis, symptoms, vitals, prescriptions, selectedDate, onSave]);

  // Close calendar on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (!isCalendarOpen || !calendarRef.current) return;
      if (calendarRef.current.contains(e.target)) return;
      setIsCalendarOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [isOpen, isCalendarOpen]);

  // ESC close
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  // Clear Formdata on close
  useEffect(() => {
    if (!isOpen) return;

    setSymptoms("");
    setDiagnosis("");
    setVitals({
      temperature: "",
      bp: "",
      pulse: "",
      weight: "",
    });
    setPrescriptions([createEmptyPrescription()]);
    setSelectedDate(null);
    setSearchResults([]);
    setActiveSearchIndex(null);
  }, [isOpen]);

  /* -------------------- Render -------------------- */

  return (
    <>
      

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Dark minimal backdrop */}
            <motion.div
              variants={overlayVars}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Modal Box */}
            <motion.div
              variants={modalVars}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                "relative w-full max-w-4xl max-h-[92vh] flex flex-col",
                "bg-white dark:bg-slate-950",
                "rounded-2xl shadow-2xl shadow-black/30 backdrop-blur-xl",
                "border border-slate-200 dark:border-slate-800",
                "overflow-hidden"
              )}
            >
              {/* --- Header --- */}
              <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                    <ClipboardCheck size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
                      Consultation Record
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Complete the clinical summary and prescription details below.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Subtle progress indicator */}
                  <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span>Completeness</span>
                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionScore}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* --- Scrollable Body --- */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar scroll-smooth bg-white dark:bg-slate-950">
                
                {/* 1. Clinical Data */}
                <motion.section variants={fadeUpVars} initial="hidden" animate="visible" className="space-y-4">
                  <SectionTitle icon={Stethoscope} title="Clinical Assessment" />
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <Label required>Diagnosis</Label>
                      <BaseInput
                        placeholder="e.g. Acute Viral Bronchitis"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label rightTag="Optional">Symptoms & Notes</Label>
                      <BaseInput
                        placeholder="e.g. Cough, high fever, sore throat"
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                      />
                    </div>
                  </div>
                </motion.section>

                <hr className="border-slate-100 dark:border-slate-800/80" />

                {/* 2. Vitals */}
                <motion.section variants={fadeUpVars} initial="hidden" animate="visible" transition={{ delay: 0.05 }} className="space-y-4">
                  <SectionTitle icon={Activity} title="Vital Signs" description="Optional measurements taken during the visit." />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { key: "temperature", label: "Temp", unit: "°F", icon: Thermometer },
                      { key: "bp", label: "BP", unit: "mmHg", icon: Activity },
                      { key: "pulse", label: "Pulse", unit: "bpm", icon: Heart },
                      { key: "weight", label: "Weight", unit: "kg", icon: Scale },
                    ].map((v) => (
                      <div key={v.key} className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <v.icon size={16} />
                        </div>
                        <BaseInput
                          className="pl-9 pr-12"
                          placeholder="-"
                          value={vitals[v.key]}
                          onChange={(e) => setVitals({ ...vitals, [v.key]: e.target.value })}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-xs text-slate-400">{v.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>

                <hr className="border-slate-100 dark:border-slate-800/80" />

                {/* 3. Prescription List */}
                <motion.section variants={fadeUpVars} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionTitle icon={Pill} title="Prescription" />
                  </div>

                  <div className="space-y-3">
                    {/* Header Row (Hidden on mobile) */}
                    <div className="hidden md:grid grid-cols-12 gap-3 px-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <div className="col-span-3">Medicine Name</div>
                      <div className="col-span-2">Dosage</div>
                      <div className="col-span-2">Frequency</div>
                      <div className="col-span-2">Duration</div>
                      <div className="col-span-2">Instructions</div>
                      <div className="col-span-1 text-right">Action</div>
                    </div>

                    <AnimatePresence initial={false}>
                      {prescriptions.map((item, index) => (
                        <motion.div
                          layout
                          key={item.id}
                          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
                          transition={{ duration: 0.25 }}
                          className="group bg-slate-50 dark:bg-slate-900/50 p-3 md:p-0 md:bg-transparent md:dark:bg-transparent rounded-xl md:rounded-none border border-slate-200 dark:border-slate-800 md:border-none"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start md:items-center">
                            
                            <div className="col-span-1 md:col-span-3">
                              <span className="md:hidden text-xs font-medium text-slate-500 mb-1 block">Medicine Name</span>
                              <div className="relative">
                                <BaseInput
                                  placeholder="Search medicine..."
                                  value={item.medicineName}
                                  disabled={isMatchingTemplate}
                                  onChange={(e) =>
                                    handleMedicineSearch(e.target.value, index)
                                  }
                                />

                                {activeSearchIndex === index && (
                                  <div className="absolute z-50 mt-2 w-full bg-white border rounded-lg shadow max-h-60 overflow-auto">
                                    
                                    {isSearching && (
                                      <div className="p-3 text-center text-sm text-slate-500">
                                        Searching medicines...
                                      </div>
                                    )}

                                    {!isSearching && searchResults.length === 0 && (
                                      <div className="p-3 text-center text-sm text-slate-400">
                                        No medicines found
                                      </div>
                                    )}

                                    {!isSearching && searchResults.map((result, i) => (
                                      <div
                                        key={`${result.medicineId}-${result.form}-${result.strength}-${i}`}
                                        onClick={() => handleVariantSelect(result, index)}
                                        className="p-2 hover:bg-slate-100 cursor-pointer"
                                      >
                                        <div className="font-medium">
                                          {result.name}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                          {result.form} • {result.strength}
                                        </div>
                                      </div>
                                    ))}

                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-1 gap-3">
                              <div>
                                <span className="md:hidden text-xs font-medium text-slate-500 mb-1 block">Dosage</span>
                                <BaseInput
                                  placeholder="500mg"
                                  value={item.dosage}
                                  onChange={(e) => updatePrescription(index, "dosage", e.target.value)}
                                />
                              </div>
                              <div className="md:hidden">
                                <span className="text-xs font-medium text-slate-500 mb-1 block">Frequency</span>
                                <BaseInput
                                  placeholder="1-0-1"
                                  value={item.frequency}
                                  onChange={(e) => updatePrescription(index, "frequency", e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="hidden md:block col-span-2">
                              <BaseInput
                                placeholder="1-0-1"
                                value={item.frequency}
                                onChange={(e) => updatePrescription(index, "frequency", e.target.value)}
                              />
                            </div>

                            <div className="col-span-1 md:col-span-4 grid grid-cols-2 gap-3">
                              <div>
                                <span className="md:hidden text-xs font-medium text-slate-500 mb-1 block">Duration</span>
                                <BaseInput
                                  placeholder="5 Days"
                                  value={item.duration}
                                  onChange={(e) => updatePrescription(index, "duration", e.target.value)}
                                />
                              </div>
                              <div>
                                <span className="md:hidden text-xs font-medium text-slate-500 mb-1 block">Instructions</span>
                                <BaseInput
                                  placeholder="After food"
                                  value={item.instructions}
                                  onChange={(e) => updatePrescription(index, "instructions", e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="col-span-1 flex items-center justify-end">
                              {prescriptions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePrescription(item.id)}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors w-full md:w-auto flex justify-center mt-2 md:mt-0"
                                >
                                  <Trash2 size={16} />
                                  <span className="md:hidden ml-2 text-sm">Remove</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    <button
                      type="button"
                      onClick={addPrescription}
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                    >
                      <Plus size={16} />
                      Add Medicine
                    </button>
                  </div>
                </motion.section>

                <hr className="border-slate-100 dark:border-slate-800/80" />

                {/* 4. Follow Up */}
                <motion.section variants={fadeUpVars} initial="hidden" animate="visible" transition={{ delay: 0.15 }} className="space-y-4 pb-12">
                  <SectionTitle icon={Calendar} title="Follow-up Date" />
                  <div className="relative max-w-sm" ref={calendarRef}>
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors outline-none focus:ring-4 focus:ring-blue-500/10",
                        selectedDate
                          ? "bg-blue-50/50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400"
                          : "bg-white border-slate-300 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      <span>
                        {selectedDate ? formatDateGB(selectedDate) : "Schedule next visit (Optional)"}
                      </span>
                      <Calendar size={16} className={selectedDate ? "text-blue-500" : "text-slate-400"} />
                    </button>

                    <AnimatePresence>
                      {isCalendarOpen && (
                        <motion.div
                          variants={calendarVars}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          transition={{ duration: 0.22 }}
                          className="absolute bottom-full mb-2 left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-4"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <button
                              type="button"
                              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {monthLabel}
                            </span>
                            <button
                              type="button"
                              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                              <div key={d} className="text-[10px] font-semibold text-center text-slate-400 uppercase">
                                {d}
                              </div>
                            ))}
                          </div>
                          
                          <div className="grid grid-cols-7 gap-1">
                            {emptySlots.map((i) => <div key={`empty-${i}`} />)}
                            {daysArray.map((day) => {
                              const dObj = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                              const isSel = sameDay(selectedDate, dObj);
                              const isToday = sameDay(new Date(), dObj);
                              return (
                                <button
                                  type="button"
                                  key={day}
                                  onClick={() => {
                                    setSelectedDate(dObj);
                                    setIsCalendarOpen(false);
                                  }}
                                  className={cn(
                                    "h-8 rounded-md text-sm transition-colors flex items-center justify-center",
                                    isSel 
                                      ? "bg-blue-600 text-white font-semibold" 
                                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                                    isToday && !isSel && "border border-blue-500 text-blue-600 dark:text-blue-400 font-medium"
                                  )}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                            <button
                              type="button"
                              onClick={() => { setSelectedDate(null); setIsCalendarOpen(false); }}
                              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                              Clear
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.section>
              </div>

              {/* --- Footer --- */}
              <div className="shrink-0 px-6 py-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={cn(
                    "px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-all active:scale-[0.97] transform-gpu",
                    saving
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20"
                  )}
                >
                  {saving ? "Saving..." : "Save Record"}
                </button>
              </div>
              
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VisitRecordModal;