import React, { useEffect, useMemo, useRef, useState } from "react";
import Toast from "../../components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

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

/* -------------------- Animations -------------------- */

const overlayVars = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVars = {
  hidden: { opacity: 0, scale: 0.92, y: 18, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", damping: 22, stiffness: 260 },
  },
  exit: { opacity: 0, scale: 0.92, y: 18, filter: "blur(6px)" },
};

const contentVars = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.06 },
  },
};

const blockVars = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 180, damping: 18 },
  },
};

const floatBtn = {
  rest: { y: 0 },
  hover: { y: -2 },
  tap: { scale: 0.98 },
};

/* -------------------- Component -------------------- */

const VisitRecordModal = ({ isOpen, onClose, onSave, saving }) => {
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

  /* ---------- UI-only computed values ---------- */
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

  const progressLabel = useMemo(() => {
    if (completionScore >= 90) return "Excellent";
    if (completionScore >= 70) return "Good";
    if (completionScore >= 45) return "In progress";
    return "Getting started";
  }, [completionScore]);

  /* ---------- Close Handler (reset UI here, not inside effect) ---------- */
  const handleClose = () => {
    setIsCalendarOpen(false);
    setViewDate(new Date());
    onClose?.();
  };

  /* ---------- Calendar Toggle ---------- */
  const handleCalendarToggle = () => {
    setIsCalendarOpen((prev) => !prev);
  };

  /* ---------- Save ---------- */
  const handleSave = () => {
    // ✅ Basic validation
    if (!diagnosis.trim()) {
      setToast({
        type: "error",
        message: "Diagnosis is required",
      });
      return;
    }

    const validPrescriptions = prescriptions.filter(
      (p) => p.medicineName && p.medicineName.trim()
    );

    if (!symptoms.trim() && validPrescriptions.length === 0) {
      setToast({
        type: "error",
        message: "Add symptoms or at least one prescription",
      });
      return;
    }

    setPrescriptions([createEmptyPrescription()]);

    // ✅ Send clean payload
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

  /* ---------- UX: close calendar on outside click ---------- */
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

  /* -------------------- Render -------------------- */

  return (
    <>
      {/* Notifications */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Backdrop */}
            <motion.div
              variants={overlayVars}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
              variants={modalVars}
              className="
                relative
                w-full
                max-w-xl
                max-h-[88vh]
                bg-white dark:bg-gray-900
                rounded-[2.25rem]
                shadow-2xl
                border border-slate-100 dark:border-gray-800
                overflow-hidden
                flex flex-col
                z-10
              "
            >
              {/* Top Glows */}
              <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-25 bg-gradient-to-br from-teal-400 via-cyan-300 to-indigo-400 dark:opacity-15" />
              <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-rose-300 via-amber-200 to-purple-300 dark:opacity-10" />

              {/* Header */}
              <div
                className="
                  relative
                  px-6 py-5
                  border-b border-slate-100 dark:border-gray-800
                  bg-white/90 dark:bg-gray-900/90
                  backdrop-blur
                  sticky top-0 z-20
                "
              >
                <div className="flex items-start justify-between gap-4 pr-12">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black tracking-[0.22em] text-teal-600 dark:text-teal-500 uppercase">
                      Create Visit Record
                    </p>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                      Consultation Notes
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                      Capture diagnosis, vitals & prescriptions in one place.
                    </p>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Progress
                      </span>
                      <span className="text-[10px] font-black text-teal-600 dark:text-teal-400">
                        {completionScore}%
                      </span>
                    </div>

                    <div className="w-40 h-2 rounded-full bg-slate-100 dark:bg-gray-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completionScore}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-500"
                      />
                    </div>

                    <span className="text-[10px] font-bold text-slate-400">
                      {progressLabel}
                    </span>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="
                    absolute
                    top-4 right-4
                    h-10 w-10
                    rounded-full
                    flex items-center justify-center
                    bg-slate-100 hover:bg-slate-200
                    dark:bg-gray-800 dark:hover:bg-gray-700
                    text-slate-500 dark:text-slate-300
                    transition
                    shadow-sm
                  "
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <motion.div
                variants={contentVars}
                initial="hidden"
                animate="visible"
                className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar relative"
              >
                {/* Quick Stats */}
                <motion.div variants={blockVars} className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-800/30 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Prescriptions
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {validPrescriptionsCount}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                      Valid medicines added
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-800/30 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Follow-up
                    </p>
                    <p className="text-sm font-black text-slate-900 dark:text-white mt-2">
                      {selectedDate
                        ? selectedDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Not set"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                      Optional next visit date
                    </p>
                  </div>
                </motion.div>

                {/* Symptoms */}
                <motion.div variants={blockVars} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                      Symptoms
                    </label>
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600">
                      Optional
                    </span>
                  </div>

                  <textarea
                    rows={2}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g. Fever, throat pain..."
                    className="
                      w-full
                      bg-slate-50 dark:bg-gray-800/50
                      px-6 py-4
                      rounded-2xl
                      text-sm font-bold
                      border-2 border-transparent
                      focus:border-teal-500/25
                      outline-none
                      dark:text-white
                      transition-all
                      placeholder:text-slate-400
                    "
                  />
                </motion.div>

                {/* Diagnosis */}
                <motion.div variants={blockVars} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                      Diagnosis
                    </label>
                    <span className="text-[10px] font-black text-rose-500">
                      Required
                    </span>
                  </div>

                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Viral Fever"
                    className="
                      w-full
                      bg-slate-50 dark:bg-gray-800/50
                      px-6 py-4
                      rounded-2xl
                      text-sm font-bold
                      border-2 border-transparent
                      focus:border-teal-500/25
                      outline-none
                      dark:text-white
                      transition-all
                      placeholder:text-slate-400
                    "
                  />
                </motion.div>

                {/* Prescription */}
                <motion.div
                  variants={blockVars}
                  className="
                    space-y-4
                    p-5
                    bg-slate-50/80 dark:bg-gray-800/30
                    rounded-[2rem]
                    border border-slate-100 dark:border-gray-800
                    relative
                  "
                >
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                      Prescription
                    </label>

                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {prescriptions.length} Row{prescriptions.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {prescriptions.map((item, index) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 220, damping: 18 }}
                          className="
                            space-y-3
                            p-4
                            bg-white/70 dark:bg-gray-900/40
                            rounded-2xl
                            border border-slate-100 dark:border-gray-800
                            relative
                            overflow-hidden
                          "
                        >
                          <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-25 bg-gradient-to-br from-teal-400 via-cyan-300 to-indigo-400 dark:opacity-10" />

                          {prescriptions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePrescription(item.id)}
                              className="
                                absolute
                                top-3 right-3
                                h-8 w-8
                                rounded-full
                                flex items-center justify-center
                                bg-slate-100 dark:bg-gray-800
                                text-rose-500
                                hover:bg-rose-500 hover:text-white
                                transition
                                shadow-sm
                                z-10
                              "
                              aria-label="Remove prescription"
                            >
                              <X size={14} />
                            </button>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                            <input
                              value={item.medicineName}
                              onChange={(e) =>
                                updatePrescription(index, "medicineName", e.target.value)
                              }
                              placeholder="Medicine"
                              className="
                                w-full
                                bg-white dark:bg-gray-800
                                px-4 py-3
                                rounded-xl
                                text-sm font-bold
                                border-2 border-transparent
                                focus:border-teal-500/25
                                outline-none
                                dark:text-white
                                transition
                                placeholder:text-slate-400
                              "
                            />

                            <input
                              value={item.dosage}
                              onChange={(e) =>
                                updatePrescription(index, "dosage", e.target.value)
                              }
                              placeholder="Dosage"
                              className="
                                w-full
                                bg-white dark:bg-gray-800
                                px-4 py-3
                                rounded-xl
                                text-sm font-bold
                                border-2 border-transparent
                                focus:border-teal-500/25
                                outline-none
                                dark:text-white
                                transition
                                placeholder:text-slate-400
                              "
                            />

                            <input
                              value={item.duration}
                              onChange={(e) =>
                                updatePrescription(index, "duration", e.target.value)
                              }
                              placeholder="Duration"
                              className="
                                w-full
                                bg-white dark:bg-gray-800
                                px-4 py-3
                                rounded-xl
                                text-sm font-bold
                                border-2 border-transparent
                                focus:border-teal-500/25
                                outline-none
                                dark:text-white
                                transition
                                placeholder:text-slate-400
                              "
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                            <input
                              value={item.frequency}
                              onChange={(e) =>
                                updatePrescription(index, "frequency", e.target.value)
                              }
                              placeholder="Freq (1-0-1)"
                              className="
                                w-full
                                bg-white dark:bg-gray-800
                                px-4 py-3
                                rounded-xl
                                text-[13px] font-bold
                                border-2 border-transparent
                                focus:border-teal-500/25
                                outline-none
                                dark:text-white
                                transition
                                placeholder:text-slate-400
                              "
                            />

                            <input
                              value={item.instructions}
                              onChange={(e) =>
                                updatePrescription(index, "instructions", e.target.value)
                              }
                              placeholder="After Food / Before Food"
                              className="
                                w-full
                                bg-white dark:bg-gray-800
                                px-4 py-3
                                rounded-xl
                                text-[13px] font-bold
                                border-2 border-transparent
                                focus:border-teal-500/25
                                outline-none
                                dark:text-white
                                transition
                                placeholder:text-slate-400
                              "
                            />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    type="button"
                    onClick={addPrescription}
                    variants={floatBtn}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    className="
                      w-full
                      py-3.5
                      rounded-2xl
                      bg-teal-50 dark:bg-teal-900/20
                      text-teal-700 dark:text-teal-300
                      font-black text-xs
                      border border-teal-100 dark:border-teal-900/40
                      hover:bg-teal-600 hover:text-white
                      transition
                    "
                  >
                    + Add Another Medicine
                  </motion.button>
                </motion.div>

                {/* Vitals */}
                <motion.div variants={blockVars} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                      Vitals
                    </label>
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600">
                      Optional
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: "temperature", label: "TEMP (°F)", placeholder: "Temp" },
                      { key: "bp", label: "BP (mmHg)", placeholder: "BP" },
                      { key: "pulse", label: "PULSE (bpm)", placeholder: "Pulse" },
                      { key: "weight", label: "WEIGHT (kg)", placeholder: "Wt" },
                    ].map((v) => (
                      <div
                        key={v.key}
                        className="rounded-2xl border border-slate-100 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-800/30 p-3"
                      >
                        <input
                          type="number"
                          value={vitals[v.key]}
                          onChange={(e) =>
                            setVitals({ ...vitals, [v.key]: e.target.value })
                          }
                          placeholder={v.placeholder}
                          className="
                            w-full
                            bg-white dark:bg-gray-900
                            px-3 py-3
                            rounded-xl
                            text-xs font-black
                            border-2 border-transparent
                            focus:border-teal-500/25
                            outline-none
                            dark:text-white
                            text-center
                            transition
                            placeholder:text-slate-400
                          "
                        />
                        <p className="text-[8px] text-center font-black text-slate-400 uppercase mt-2 tracking-widest">
                          {v.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Follow-up */}
                <motion.div variants={blockVars} className="space-y-2 pb-2 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                      Next Follow-up
                    </label>
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600">
                      Optional
                    </span>
                  </div>

                  <motion.button
                    type="button"
                    variants={floatBtn}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleCalendarToggle}
                    className="
                      w-full
                      bg-slate-50 dark:bg-gray-800/50
                      px-6 py-4
                      rounded-2xl
                      text-sm font-black
                      border-2 border-transparent
                      focus:border-teal-500/25
                      outline-none
                      dark:text-white
                      flex items-center justify-between
                      transition
                    "
                  >
                    <span className="text-slate-700 dark:text-slate-200">
                      {selectedDate
                        ? selectedDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Select Date"}
                    </span>
                    <Calendar size={18} className="text-teal-600 dark:text-teal-400" />
                  </motion.button>

                  <AnimatePresence>
                    {isCalendarOpen && (
                      <motion.div
                        ref={calendarRef}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 240, damping: 18 }}
                        className="
                          absolute
                          bottom-full
                          mb-3
                          left-1/2 -translate-x-1/2
                          w-full
                          max-w-[340px]
                          bg-white dark:bg-gray-900
                          border border-slate-200 dark:border-gray-700
                          rounded-2xl
                          shadow-2xl
                          z-50
                          overflow-hidden
                        "
                      >
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-gray-800 border-b border-slate-100 dark:border-gray-700">
                          <button
                            type="button"
                            className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-gray-900 transition flex items-center justify-center"
                            onClick={() =>
                              setViewDate(
                                new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
                              )
                            }
                            aria-label="Previous month"
                          >
                            <ChevronLeft size={16} className="text-slate-600 dark:text-slate-200" />
                          </button>

                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200">
                            {viewDate.toLocaleDateString("en-GB", {
                              month: "long",
                              year: "numeric",
                            })}
                          </span>

                          <button
                            type="button"
                            className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-gray-900 transition flex items-center justify-center"
                            onClick={() =>
                              setViewDate(
                                new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
                              )
                            }
                            aria-label="Next month"
                          >
                            <ChevronRight size={16} className="text-slate-600 dark:text-slate-200" />
                          </button>
                        </div>

                        <div className="p-4">
                          <div className="grid grid-cols-7 mb-3">
                            {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((d) => (
                              <div
                                key={d}
                                className="text-[9px] font-black text-teal-600 dark:text-teal-400 text-center tracking-widest"
                              >
                                {d}
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-7 gap-1.5">
                            {(() => {
                              const year = viewDate.getFullYear();
                              const month = viewDate.getMonth();
                              const firstDay = new Date(year, month, 1).getDay();
                              const daysInMonth = new Date(year, month + 1, 0).getDate();
                              const today = new Date();

                              return (
                                <>
                                  {[...Array(firstDay)].map((_, i) => (
                                    <div key={`sp-${i}`} />
                                  ))}

                                  {[...Array(daysInMonth)].map((_, i) => {
                                    const day = i + 1;
                                    const dateObj = new Date(year, month, day);

                                    const isSelected =
                                      selectedDate?.toDateString() === dateObj.toDateString();

                                    const isToday =
                                      today.toDateString() === dateObj.toDateString();

                                    return (
                                      <button
                                        type="button"
                                        key={day}
                                        onClick={() => {
                                          setSelectedDate(dateObj);
                                          setIsCalendarOpen(false);
                                        }}
                                        className={`
                                          w-9 h-9 rounded-xl text-[11px] font-black
                                          transition
                                          ${
                                            isSelected
                                              ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                                              : "text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                                          }
                                        `}
                                      >
                                        {day}
                                        {isToday && !isSelected && (
                                          <span className="block w-1 h-1 mx-auto mt-0.5 bg-teal-500 rounded-full" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </>
                              );
                            })()}
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDate(null);
                                setIsCalendarOpen(false);
                              }}
                              className="
                                text-[10px]
                                font-black
                                uppercase
                                tracking-widest
                                text-slate-400
                                hover:text-rose-500
                                transition
                              "
                            >
                              Clear
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsCalendarOpen(false)}
                              className="
                                text-[10px]
                                font-black
                                uppercase
                                tracking-widest
                                text-slate-500 dark:text-slate-300
                                hover:text-teal-600 dark:hover:text-teal-400
                                transition
                              "
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              {/* Footer */}
              <div className="px-6 py-5 border-t border-slate-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur sticky bottom-0 z-20">
                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    variants={floatBtn}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleClose}
                    className="
                      flex-1
                      py-4
                      rounded-2xl
                      text-xs font-black
                      bg-slate-100 dark:bg-gray-800
                      text-slate-600 dark:text-slate-300
                      hover:bg-rose-50 hover:text-rose-600
                      dark:hover:bg-rose-900/20 dark:hover:text-rose-300
                      transition
                      border border-slate-200 dark:border-gray-700
                    "
                  >
                    CANCEL
                  </motion.button>

                  <motion.button
                    type="button"
                    variants={floatBtn}
                    initial="rest"
                    whileHover={!saving ? "hover" : "rest"}
                    whileTap={!saving ? "tap" : "rest"}
                    disabled={saving}
                    onClick={handleSave}
                    className={`
                      flex-1
                      py-4
                      rounded-2xl
                      text-xs font-black
                      uppercase tracking-widest
                      transition
                      shadow
                      ${
                        saving
                          ? "bg-slate-300 dark:bg-gray-700 text-slate-600 dark:text-slate-300 cursor-not-allowed shadow-none"
                          : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/25"
                      }
                    `}
                  >
                    {saving ? "SAVING..." : "SAVE RECORD"}
                  </motion.button>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Tip</span>
                  <span className="text-teal-600 dark:text-teal-400">Add diagnosis first</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VisitRecordModal;
