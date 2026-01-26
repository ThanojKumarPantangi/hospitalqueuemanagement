/* ------------------------------------------------------------- */
/* -------------------- Create Visit Record -------------------- */
/* ------------------------------------------------------------- */

import React, { useEffect, useMemo, useRef, useState } from "react";
import Toast from "../../components/ui/Toast";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
} from "framer-motion";
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
  Sparkles,
  ClipboardCheck,
  ShieldCheck,
  Info,
} from "lucide-react";

/* -------------------- Helpers -------------------- */

const createEmptyPrescription = () => ({
  id: crypto.randomUUID(),
  medicineName: "",
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
  visible: { opacity: 1, transition: { duration: 0.28 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

const modalVars = {
  hidden: { opacity: 0, scale: 0.96, y: 22, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 26, stiffness: 320 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 18,
    filter: "blur(8px)",
    transition: { duration: 0.18 },
  },
};

const containerVars = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.06 },
  },
};

const itemVars = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 210, damping: 20 },
  },
};

const softPop = {
  rest: { y: 0 },
  hover: { y: -2 },
  tap: { scale: 0.98 },
};

const glowPulse = {
  hidden: { opacity: 0 },
  visible: {
    opacity: [0.2, 0.35, 0.2],
    transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
  },
};

/* -------------------- Sub-Components -------------------- */

// Reusable Input Wrapper for consistent style
const InputGroup = ({
  label,
  icon: Icon,
  required,
  rightTag,
  hint,
  children,
  className = "",
}) => (
  <div className={cn("space-y-1.5", className)}>
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {Icon && <Icon size={12} className="text-blue-500" />}
        {label}
        {hint ? (
          <span className="hidden sm:inline-flex items-center gap-1 ml-2 text-[10px] font-bold text-slate-400 dark:text-slate-500">
            <Info size={12} />
            {hint}
          </span>
        ) : null}
      </div>

      {required ? (
        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md dark:bg-rose-900/20 dark:text-rose-300">
          REQUIRED
        </span>
      ) : rightTag ? (
        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md dark:bg-slate-800 dark:text-slate-500">
          {rightTag}
        </span>
      ) : null}
    </div>
    {children}
  </div>
);

// Styled Base Input
const BaseInput = (props) => (
  <input
    {...props}
    className={cn(
      "w-full",
      "bg-slate-50 border border-slate-200",
      "text-slate-900 text-sm font-medium",
      "rounded-xl px-4 py-3",
      "placeholder:text-slate-400",
      "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
      "hover:bg-white hover:border-slate-300",
      "transition-all duration-200",
      "dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100",
      "dark:focus:border-blue-400 dark:hover:bg-slate-800",
      props.className
    )}
  />
);

// Styled Base Textarea
const BaseTextarea = (props) => (
  <textarea
    {...props}
    className={cn(
      "w-full",
      "bg-slate-50 border border-slate-200",
      "text-slate-900 text-sm font-medium",
      "rounded-xl px-4 py-3",
      "placeholder:text-slate-400",
      "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
      "hover:bg-white hover:border-slate-300",
      "transition-all duration-200",
      "dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100",
      "dark:focus:border-blue-400 dark:hover:bg-slate-800",
      props.className
    )}
  />
);

// Tiny badge for sections
const MiniBadge = ({ icon: Icon, text }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
    {Icon ? <Icon size={12} className="text-blue-500" /> : null}
    {text}
  </span>
);

// Section container card
const SectionCard = ({ title, icon: Icon, subtitle, right, children }) => (
  <div className="relative rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/50 shadow-sm overflow-visible">
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        variants={glowPulse}
        initial="hidden"
        animate="visible"
        className="absolute -top-20 -right-20 h-56 w-56 rounded-full blur-3xl opacity-25 bg-gradient-to-br from-blue-400 via-indigo-300 to-cyan-300 dark:opacity-10"
      />
    </div>

    <div className="relative px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center">
              <Icon size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-800 dark:text-white truncate">
                {title}
              </p>
              {subtitle ? (
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>

    <div className="relative p-5">{children}</div>
  </div>
);

/* -------------------- Main Component -------------------- */

const VisitRecordModal = ({ isOpen, onClose, onSave, saving }) => {
  const prefersReducedMotion = useReducedMotion();

  /* ---------- Visit Fields ---------- */
  const [toast, setToast] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

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

  const completionLabel = useMemo(() => {
    if (completionScore >= 90) return "Excellent";
    if (completionScore >= 70) return "Good";
    if (completionScore >= 45) return "In progress";
    return "Getting started";
  }, [completionScore]);

  /* ---------- Calendar Memo (Fix Month Switch) ---------- */
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

  const handleClose = () => {
    setIsCalendarOpen(false);
    setViewDate(new Date());
    onClose?.();
  };

  const handleSave = () => {
    // ⚠️ DO NOT CHANGE LOGIC
    if (!diagnosis.trim()) {
      setToast({ type: "error", message: "Diagnosis is required to save record." });
      return;
    }

    const validPrescriptions = prescriptions.filter(
      (p) => p.medicineName && p.medicineName.trim()
    );

    if (!symptoms.trim() && validPrescriptions.length === 0) {
      setToast({ type: "error", message: "Please add symptoms or a prescription." });
      return;
    }

    setPrescriptions([createEmptyPrescription()]);

    // ⚠️ DO NOT CHANGE PAYLOAD
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
  };

  // Close calendar on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => {
      if (!isCalendarOpen) return;
      if (!calendarRef.current) return;
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
      if (e.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* -------------------- Render -------------------- */

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              variants={overlayVars}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-md"
              onClick={handleClose}
            />

            {/* Modal Card */}
            <motion.div
              variants={modalVars}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                "relative w-full max-w-3xl max-h-[92vh] flex flex-col",
                "bg-white dark:bg-slate-900",
                "rounded-[2rem] shadow-2xl",
                "border border-white/20 dark:border-slate-700",
                "overflow-hidden"
              )}
            >
              {/* Decorative background */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-25 bg-gradient-to-br from-blue-400 via-indigo-300 to-cyan-300 dark:opacity-15" />
                <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-rose-300 via-amber-200 to-purple-300 dark:opacity-10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
              </div>

              {/* --- Sticky Header --- */}
              <div className="relative shrink-0 z-20 bg-white/75 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40">
                        <Sparkles
                          size={14}
                          className="text-blue-600 dark:text-blue-400"
                        />
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
                          New Consultation
                        </span>
                      </span>
                      <MiniBadge icon={ShieldCheck} text="Secure" />
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
                      Create Visit Record
                    </h2>

                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      {new Date().toLocaleDateString(undefined, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Completion */}
                    <div className="hidden sm:flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                          Completeness
                        </span>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">
                          {completionScore}%
                        </span>
                      </div>

                      <div className="w-44 h-2 rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${completionScore}%` }}
                          transition={{
                            type: "spring",
                            bounce: 0,
                            duration: prefersReducedMotion ? 0 : 0.9,
                          }}
                        />
                      </div>

                      <span className="text-[10px] font-bold text-slate-400">
                        {completionLabel}
                      </span>
                    </div>

                    {/* Close */}
                    <motion.button
                      variants={softPop}
                      initial="rest"
                      whileHover={!prefersReducedMotion ? "hover" : "rest"}
                      whileTap={!prefersReducedMotion ? "tap" : "rest"}
                      onClick={handleClose}
                      className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors shadow-sm"
                      aria-label="Close"
                      type="button"
                    >
                      <X size={20} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* --- Scrollable Body --- */}
              <motion.div
                variants={containerVars}
                initial="hidden"
                animate="visible"
                className="relative flex-1 overflow-y-auto p-6 sm:p-7 space-y-6 custom-scrollbar"
              >
                {/* Quick insight strip */}
                <motion.div
                  variants={itemVars}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/50 p-4 shadow-sm">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Valid Rx
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {validPrescriptionsCount}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      Medicines added
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/50 p-4 shadow-sm">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Follow-up
                    </p>
                    <p className="text-sm font-black text-slate-900 dark:text-white mt-2 truncate">
                      {formatDateGB(selectedDate) || "Not scheduled"}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      Optional date
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/50 p-4 shadow-sm">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Status
                    </p>
                    <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-2">
                      {completionLabel}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                      {completionScore}% complete
                    </p>
                  </div>
                </motion.div>

                {/* 1. Clinical Data */}
                <motion.div variants={itemVars}>
                  <SectionCard
                    title="Clinical Summary"
                    icon={ClipboardCheck}
                    subtitle="Add diagnosis first, then symptoms"
                    right={<MiniBadge icon={Stethoscope} text="Doctor Notes" />}
                  >
                    <div className="grid md:grid-cols-2 gap-5">
                      <InputGroup
                        label="Diagnosis"
                        icon={Stethoscope}
                        required
                        hint="Required"
                      >
                        <BaseInput
                          placeholder="e.g. Acute Viral Bronchitis"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          autoFocus
                        />
                      </InputGroup>

                      <InputGroup
                        label="Symptoms"
                        icon={Activity}
                        rightTag="Optional"
                        hint="Short notes"
                      >
                        <BaseTextarea
                          rows={1}
                          placeholder="e.g. Cough, high fever, sore throat"
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                        />
                      </InputGroup>
                    </div>
                  </SectionCard>
                </motion.div>

                {/* 2. Vitals Grid */}
                <motion.div variants={itemVars}>
                  <SectionCard
                    title="Vital Signs"
                    icon={Activity}
                    subtitle="Optional measurements"
                    right={<MiniBadge icon={Activity} text="Vitals" />}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        {
                          key: "temperature",
                          label: "Temp",
                          unit: "°F",
                          icon: Thermometer,
                        },
                        { key: "bp", label: "BP", unit: "mmHg", icon: Activity },
                        { key: "pulse", label: "Pulse", unit: "bpm", icon: Heart },
                        { key: "weight", label: "Weight", unit: "kg", icon: Scale },
                      ].map((v) => (
                        <div key={v.key} className="relative group">
                          <div className="absolute top-3 left-3 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <v.icon size={16} />
                          </div>

                          <input
                            type="text"
                            value={vitals[v.key]}
                            onChange={(e) =>
                              setVitals({ ...vitals, [v.key]: e.target.value })
                            }
                            className={cn(
                              "w-full",
                              "bg-slate-50 dark:bg-slate-800/50",
                              "border border-slate-200 dark:border-slate-700",
                              "rounded-2xl",
                              "py-3 pl-9 pr-3",
                              "text-center font-extrabold",
                              "text-slate-700 dark:text-slate-200",
                              "focus:outline-none focus:border-blue-500 focus:bg-white",
                              "dark:focus:bg-slate-800",
                              "transition-all"
                            )}
                            placeholder="-"
                          />

                          <div className="absolute bottom-1 w-full text-center">
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                              {v.label}{" "}
                              <span className="opacity-50">({v.unit})</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-800/30 p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                        Note
                      </p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                        Leave vitals empty if not measured. It won’t block saving.
                      </p>
                    </div>
                  </SectionCard>
                </motion.div>

                {/* 3. Prescription Section */}
                <motion.div variants={itemVars}>
                  <SectionCard
                    title="Prescriptions"
                    icon={Pill}
                    subtitle="Add medicines with dosage and schedule"
                    right={
                      <div className="flex items-center gap-2">
                        <MiniBadge icon={Pill} text={`${prescriptions.length} Rows`} />
                        <MiniBadge
                          icon={ClipboardCheck}
                          text={`${validPrescriptionsCount} Valid`}
                        />
                      </div>
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Tip: Only rows with medicine name will be saved.
                      </p>

                      <motion.button
                        variants={softPop}
                        initial="rest"
                        whileHover={!prefersReducedMotion ? "hover" : "rest"}
                        whileTap={!prefersReducedMotion ? "tap" : "rest"}
                        onClick={addPrescription}
                        className="text-xs font-black text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 border border-blue-100 dark:border-blue-800/40"
                        type="button"
                      >
                        <Plus size={14} /> Add Medicine
                      </motion.button>
                    </div>

                    <div className="mt-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 space-y-3">
                      <LayoutGroup>
                        <AnimatePresence initial={false}>
                          {prescriptions.map((item, index) => (
                            <motion.div
                              layout
                              key={item.id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                              transition={{
                                duration: prefersReducedMotion ? 0 : 0.28,
                              }}
                              className={cn(
                                "group relative",
                                "bg-white dark:bg-slate-900",
                                "border border-slate-200 dark:border-slate-700",
                                "rounded-2xl p-4",
                                "shadow-sm",
                                "hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800/50",
                                "transition-all"
                              )}
                            >
                              <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl opacity-15 bg-gradient-to-br from-blue-400 via-indigo-300 to-cyan-300 dark:opacity-10" />
                              </div>

                              <div className="relative grid grid-cols-12 gap-3">
                                {/* Medicine Name */}
                                <div className="col-span-12 md:col-span-4">
                                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                    Medicine
                                  </label>
                                  <input
                                    className="w-full text-sm font-extrabold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 bg-transparent outline-none py-2"
                                    placeholder="Medicine Name"
                                    value={item.medicineName}
                                    onChange={(e) =>
                                      updatePrescription(
                                        index,
                                        "medicineName",
                                        e.target.value
                                      )
                                    }
                                  />
                                  <div className="h-0.5 w-10 bg-blue-500 rounded-full mt-1 opacity-20 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* Details */}
                                <div className="col-span-12 md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                      Dosage
                                    </label>
                                    <input
                                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                      placeholder="e.g. 500mg"
                                      value={item.dosage}
                                      onChange={(e) =>
                                        updatePrescription(index, "dosage", e.target.value)
                                      }
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                      Frequency
                                    </label>
                                    <input
                                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                      placeholder="1-0-1"
                                      value={item.frequency}
                                      onChange={(e) =>
                                        updatePrescription(
                                          index,
                                          "frequency",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                      Duration
                                    </label>
                                    <input
                                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                      placeholder="e.g. 5 days"
                                      value={item.duration}
                                      onChange={(e) =>
                                        updatePrescription(
                                          index,
                                          "duration",
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                </div>

                                {/* Instructions */}
                                <div className="col-span-12">
                                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                    Instructions
                                  </label>
                                  <input
                                    className="w-full text-xs text-slate-600 dark:text-slate-300 placeholder:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                    placeholder="e.g. After food / Before food"
                                    value={item.instructions}
                                    onChange={(e) =>
                                      updatePrescription(
                                        index,
                                        "instructions",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              {prescriptions.length > 1 && (
                                <motion.button
                                  variants={softPop}
                                  initial="rest"
                                  whileHover={!prefersReducedMotion ? "hover" : "rest"}
                                  whileTap={!prefersReducedMotion ? "tap" : "rest"}
                                  type="button"
                                  onClick={() => removePrescription(item.id)}
                                  className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 shadow-sm border border-slate-100 dark:border-slate-700 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all"
                                  aria-label="Remove"
                                >
                                  <X size={14} />
                                </motion.button>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </LayoutGroup>
                    </div>
                  </SectionCard>
                </motion.div>

                {/* 4. Follow Up */}
                <motion.div variants={itemVars}>
                  <SectionCard
                    title="Next Follow-up"
                    icon={Calendar}
                    subtitle="Optional next visit scheduling"
                    right={
                      <MiniBadge
                        icon={Calendar}
                        text={selectedDate ? "Scheduled" : "Not set"}
                      />
                    }
                  >
                    <InputGroup
                      label="Next Visit"
                      icon={Calendar}
                      rightTag="Optional"
                      hint="Select a date"
                    >
                      <div className="relative overflow-visible">
                        <motion.button
                          type="button"
                          variants={softPop}
                          initial="rest"
                          whileHover={!prefersReducedMotion ? "hover" : "rest"}
                          whileTap={!prefersReducedMotion ? "tap" : "rest"}
                          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-semibold",
                            selectedDate
                              ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
                              : "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300"
                          )}
                        >
                          <span>
                            {selectedDate
                              ? formatDateGB(selectedDate)
                              : "No follow-up scheduled"}
                          </span>
                          <Calendar
                            size={16}
                            className={selectedDate ? "text-blue-500" : "text-slate-400"}
                          />
                        </motion.button>

                        <AnimatePresence>
                          {isCalendarOpen && (
                            <motion.div
                              ref={calendarRef}
                              initial={{ opacity: 0, y: 10, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.98 }}
                              transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                duration: prefersReducedMotion ? 0 : undefined,
                              }}
                              className="
                                absolute
                                top-full
                                left-0
                                mt-3
                                w-full
                                max-w-sm
                                bg-white dark:bg-slate-900
                                border border-slate-200 dark:border-slate-700
                                rounded-2xl
                                shadow-2xl
                                z-[999]
                                p-4
                                overflow-hidden
                              "
                            >
                              {/* Calendar Header */}
                              <div className="flex items-center justify-between mb-4 gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setViewDate(
                                      new Date(
                                        viewDate.getFullYear() - 1,
                                        viewDate.getMonth(),
                                        1
                                      )
                                    )
                                  }
                                  className="px-2 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-[10px] font-black text-slate-600 dark:text-slate-300"
                                  aria-label="Previous year"
                                >
                                  -Y
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setViewDate(
                                      new Date(
                                        viewDate.getFullYear(),
                                        viewDate.getMonth() - 1,
                                        1
                                      )
                                    )
                                  }
                                  className="p-2 rounded-xl bg-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                  aria-label="Previous month"
                                >
                                  <ChevronLeft size={16} />
                                </button>

                                <span className="text-sm font-black text-slate-700 dark:text-slate-200 flex-1 text-center">
                                  {monthLabel}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setViewDate(
                                      new Date(
                                        viewDate.getFullYear(),
                                        viewDate.getMonth() + 1,
                                        1
                                      )
                                    )
                                  }
                                  className="p-2 rounded-xl bg-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                  aria-label="Next month"
                                >
                                  <ChevronRight size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setViewDate(
                                      new Date(
                                        viewDate.getFullYear() + 1,
                                        viewDate.getMonth(),
                                        1
                                      )
                                    )
                                  }
                                  className="px-2 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-[10px] font-black text-slate-600 dark:text-slate-300"
                                  aria-label="Next year"
                                >
                                  +Y
                                </button>
                              </div>

                              {/* Days */}
                              <div className="grid grid-cols-7 gap-1 mb-2">
                                {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                                  <div
                                    key={d}
                                    className="text-[10px] font-extrabold text-center text-slate-400"
                                  >
                                    {d}
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-7 gap-1">
                                {emptySlots.map((i) => (
                                  <div key={`e-${i}`} />
                                ))}

                                {daysArray.map((day) => {
                                  const dObj = new Date(
                                    viewDate.getFullYear(),
                                    viewDate.getMonth(),
                                    day
                                  );

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
                                        "h-9 rounded-xl text-xs font-extrabold transition-all",
                                        isSel
                                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                                          : "hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
                                        isToday && !isSel
                                          ? "ring-2 ring-blue-500/30"
                                          : ""
                                      )}
                                    >
                                      {day}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Footer */}
                              <div className="mt-3 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDate(null);
                                    setIsCalendarOpen(false);
                                  }}
                                  className="flex-1 py-2 text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition"
                                >
                                  Clear
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setIsCalendarOpen(false)}
                                  className="flex-1 py-2 text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                                >
                                  Done
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </InputGroup>
                  </SectionCard>
                </motion.div>
              </motion.div>

              {/* --- Footer Actions --- */}
              <div className="relative shrink-0 p-6 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-4">
                  <motion.button
                    variants={softPop}
                    initial="rest"
                    whileHover={!prefersReducedMotion ? "hover" : "rest"}
                    whileTap={!prefersReducedMotion ? "tap" : "rest"}
                    onClick={handleClose}
                    className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-black text-sm hover:bg-slate-50 hover:text-slate-900 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    type="button"
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    variants={softPop}
                    initial="rest"
                    whileHover={!saving && !prefersReducedMotion ? "hover" : "rest"}
                    whileTap={!saving && !prefersReducedMotion ? "tap" : "rest"}
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                      "flex-[2] py-3.5 rounded-xl font-black text-sm text-white transition-all",
                      "shadow-lg",
                      saving
                        ? "bg-slate-400 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-600/30 hover:-translate-y-0.5"
                    )}
                    type="button"
                  >
                    {saving ? "Saving Record..." : "Confirm & Save"}
                  </motion.button>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  <span>Tip</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    Diagnosis → Prescription → Save
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VisitRecordModal;