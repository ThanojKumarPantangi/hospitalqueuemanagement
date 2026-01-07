import React, { useState } from "react";
import Toast from "../../components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

/* -------------------- Helpers -------------------- */

const emptyPrescription = {
  medicine: "",
  dosage: "",
  duration: "",
  frequency: "",
  instructions: "",
};

/* -------------------- Component -------------------- */

const VisitRecordModal = ({ isOpen, onClose, onSave }) => {
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
  const [prescriptions, setPrescriptions] = useState([emptyPrescription]);

  const addPrescription = () =>
    setPrescriptions([...prescriptions, emptyPrescription]);

  const removePrescription = (index) =>
    setPrescriptions(prescriptions.filter((_, i) => i !== index));

  const updatePrescription = (index, field, value) => {
    const copy = [...prescriptions];
    copy[index][field] = value;
    setPrescriptions(copy);
  };

  /* ---------- Follow-up Calendar ---------- */
  const [selectedDate, setSelectedDate] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  /* ---------- Save ---------- */
  const handleSave = () => {
    // ✅ Basic validation
    if (!diagnosis.trim()) {
      setToast({
        type: "error",
        message:"Diagnosis is required",
      });
      return;
    }

    const validPrescriptions = prescriptions.filter(
      (p) => p.medicine && p.medicine.trim()
    );

    if (!symptoms.trim() && validPrescriptions.length === 0) {
      setToast({
        type: "error",
        message:"Add symptoms or at least one prescription",
      });
      return;
    }

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

  /* -------------------- Render -------------------- */

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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl flex flex-col z-10 max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-800">
                <h3 className="text-xs font-black tracking-widest text-teal-600 dark:text-teal-500">
                  CREATE VISIT RECORD
                </h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Symptoms */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
                    Symptoms
                  </label>
                  <textarea
                    rows={2}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g. Fever, throat pain..."
                    className="w-full bg-slate-50 dark:bg-gray-800/50 px-6 py-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-teal-500/20 outline-none dark:text-white transition-all"
                  />
                </div>

                {/* Diagnosis */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
                    Diagnosis
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Viral Fever"
                    className="w-full bg-slate-50 dark:bg-gray-800/50 px-6 py-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-teal-500/20 outline-none dark:text-white"
                  />
                </div>

                {/* Prescription */}
                <div className="space-y-4 p-4 bg-slate-50 dark:bg-gray-800/30 rounded-3xl border border-slate-100 dark:border-gray-800">
                  <label className="text-[10px] font-black text-teal-600 uppercase m-1">
                    Prescription
                  </label>

                  {prescriptions.map((item, index) => (
                    <div
                      key={index}
                      className="space-y-3 p-3 bg-white/60 dark:bg-gray-900/40 rounded-2xl border border-slate-100 dark:border-gray-800 relative"
                    >
                      {prescriptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePrescription(index)}
                          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800 text-rose-500 hover:text-white hover:bg-rose-500 text-xs font-black transition"
                        >
                          <X size={12} />
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          value={item.medicine}
                          onChange={(e) =>
                            updatePrescription(
                              index,
                              "medicine",
                              e.target.value
                            )
                          }
                          placeholder="Medicine"
                          className="w-full bg-white dark:bg-gray-800 px-4 py-3 rounded-xl text-sm font-bold border-2 border-transparent focus:border-teal-500/20 outline-none dark:text-white"
                        />
                        <input
                          value={item.dosage}
                          onChange={(e) =>
                            updatePrescription(index, "dosage", e.target.value)
                          }
                          placeholder="Dosage"
                          className="w-full bg-white dark:bg-gray-800 px-4 py-3 rounded-xl text-sm font-bold border-2 border-transparent focus:border-teal-500/20 outline-none dark:text-white"
                        />
                        <input
                          value={item.duration}
                          onChange={(e) =>
                            updatePrescription(
                              index,
                              "duration",
                              e.target.value
                            )
                          }
                          placeholder="Duration"
                          className="w-full bg-white dark:bg-gray-800 px-4 py-3 rounded-xl text-sm font-bold border-2 border-transparent focus:border-teal-500/20 outline-none dark:text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={item.frequency}
                          onChange={(e) =>
                            updatePrescription(
                              index,
                              "frequency",
                              e.target.value
                            )
                          }
                          placeholder="Freq (1-0-1)"
                          className="w-full bg-white dark:bg-gray-800 px-4 py-3 rounded-xl text-[13px] font-bold border-2 border-transparent focus:border-teal-500/20 outline-none dark:text-white"
                        />
                        <input
                          value={item.instructions}
                          onChange={(e) =>
                            updatePrescription(
                              index,
                              "instructions",
                              e.target.value
                            )
                          }
                          placeholder="After Food / Before Food"
                          className="w-full bg-white dark:bg-gray-800 px-4 py-3 rounded-xl text-[13px] font-bold border-2 border-transparent focus:border-teal-500/20 outline-none dark:text-white"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addPrescription}
                    className="w-full py-3 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-black text-xs hover:bg-teal-600 hover:text-white transition"
                  >
                    + Add Another Medicine
                  </button>
                </div>

                {/* Vitals */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
                    Vitals
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: "temperature", label: "TEMP (°F)", placeholder: "Temp" },
                      { key: "bp", label: "BP (mmHg)", placeholder: "BP" },
                      { key: "pulse", label: "PULSE (bpm)", placeholder: "Pulse" },
                      { key: "weight", label: "WEIGHT (kg)", placeholder: "Wt" },
                    ].map((v) => (
                      <div key={v.key} className="space-y-1">
                        <input
                          type="number"
                          value={vitals[v.key]}
                          onChange={(e) =>
                            setVitals({ ...vitals, [v.key]: e.target.value })
                          }
                          placeholder={v.placeholder}
                          className="w-full bg-slate-50 dark:bg-gray-800/50 px-3 py-3 rounded-xl text-xs font-bold border-2 border-transparent focus:border-teal-500/20 outline-none dark:text-white text-center"
                        />
                        <p className="text-[8px] text-center font-bold text-gray-400 uppercase">
                          {v.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Follow-up */}
                <div className="space-y-2 pb-2 relative">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
                    Next Follow-up
                  </label>

                  <button
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="w-full bg-slate-50 dark:bg-gray-800/50 px-6 py-4 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-teal-500/20 outline-none dark:text-white flex items-center justify-between"
                  >
                    <span>
                      {selectedDate
                        ? selectedDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Select Date"}
                    </span>
                    <Calendar size={18} />
                  </button>

                  <AnimatePresence>
                    {isCalendarOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-full max-w-[320px] bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-gray-800 border-b">
                          <button
                            onClick={() =>
                              setViewDate(
                                new Date(
                                  viewDate.getFullYear(),
                                  viewDate.getMonth() - 1,
                                  1
                                )
                              )
                            }
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span className="text-[10px] font-black uppercase">
                            {viewDate.toLocaleDateString("en-GB", {
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                          <button
                            onClick={() =>
                              setViewDate(
                                new Date(
                                  viewDate.getFullYear(),
                                  viewDate.getMonth() + 1,
                                  1
                                )
                              )
                            }
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>

                        <div className="p-3">
                          <div className="grid grid-cols-7 mb-2">
                            {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((d) => (
                              <div
                                key={d}
                                className="text-[9px] font-black text-teal-500 text-center"
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
                              const daysInMonth = new Date(
                                year,
                                month + 1,
                                0
                              ).getDate();
                              const today = new Date();

                              return (
                                <>
                                  {[...Array(firstDay)].map((_, i) => (
                                    <div key={i} />
                                  ))}
                                  {[...Array(daysInMonth)].map((_, i) => {
                                    const day = i + 1;
                                    const dateObj = new Date(year, month, day);
                                    const isSelected =
                                      selectedDate?.toDateString() ===
                                      dateObj.toDateString();
                                    const isToday =
                                      today.toDateString() ===
                                      dateObj.toDateString();

                                    return (
                                      <button
                                        key={day}
                                        onClick={() => {
                                          setSelectedDate(dateObj);
                                          setIsCalendarOpen(false);
                                        }}
                                        className={`w-9 h-9 rounded-xl text-[11px] font-bold ${
                                          isSelected
                                            ? "bg-teal-500 text-white"
                                            : "text-gray-600 hover:bg-teal-50"
                                        }`}
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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-gray-800 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 rounded-2xl text-xs font-black bg-slate-100 dark:bg-gray-800 text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-4 rounded-2xl text-xs font-black bg-teal-500 text-white hover:bg-teal-600 transition shadow-lg shadow-teal-500/30"
                >
                  SAVE RECORD
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
    
  );
};

export default VisitRecordModal;
