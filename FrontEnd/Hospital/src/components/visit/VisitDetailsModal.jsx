import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  UserCheck,
  AlertTriangle,
  Calendar,
  Clock,
  ClipboardList,
  Activity,
  Pill,
  FileText,
  BadgeCheck,
  Sparkles,
} from "lucide-react";

// Animation Variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const modalVariants = {
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

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 160, damping: 18 },
  },
};

const VisitDetailsModal = ({ isOpen, onClose, visit, statusConfig = {} }) => {
  // ✅ DO NOT early-return before hooks (React rule)

  // ---------- Status Config ----------
  const defaultStatusConfig = {
    COMPLETED: {
      label: "Completed",
      icon: UserCheck,
      color:
        "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
    },
    CANCELLED: {
      label: "Cancelled",
      icon: AlertTriangle,
      color:
        "text-rose-700 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20",
    },
    NO_SHOW: {
      label: "No Show",
      icon: Clock,
      color:
        "text-amber-700 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
    },
    ...statusConfig,
  };

  const currentStatus =
    (visit?.status && defaultStatusConfig[visit.status]) ||
    defaultStatusConfig.COMPLETED;

  const StatusIcon = currentStatus.icon;

  // ---------- Safe primitives (compiler-friendly deps) ----------
  const visitId = visit?._id ?? null;
  const createdAt = visit?.createdAt ?? null;
  const followUpDate = visit?.followUpDate ?? null;

  // ---------- Memoized Labels (NOT conditional) ----------
  const shortId = useMemo(() => {
    return visitId ? visitId.slice(-6).toUpperCase() : "N/A";
  }, [visitId]);

  const visitDateLabel = useMemo(() => {
    if (!createdAt) return "—";
    return new Date(createdAt).toLocaleDateString(undefined, {
      dateStyle: "long",
    });
  }, [createdAt]);

  const visitTimeLabel = useMemo(() => {
    if (!createdAt) return "—";
    return new Date(createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [createdAt]);

  const followUpLabel = useMemo(() => {
    if (!followUpDate) return null;
    return new Date(followUpDate).toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
  }, [followUpDate]);

  // ✅ Now safe to early return (after hooks)
  if (!isOpen || !visit) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              relative
              w-full
              max-w-2xl
              max-h-[85vh]
              bg-white dark:bg-gray-900
              rounded-[2.25rem]
              shadow-2xl
              overflow-hidden
              border border-gray-100 dark:border-gray-800
              flex flex-col
            "
          >
            {/* Top Glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-25 bg-gradient-to-br from-teal-400 via-cyan-300 to-indigo-400 dark:opacity-15" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-rose-300 via-amber-200 to-purple-300 dark:opacity-10" />

            {/* Header (compact + sticky) */}
            <div
              className="
                relative
                px-6 py-5
                border-b border-gray-100 dark:border-gray-800
                bg-white/90 dark:bg-gray-900/90
                backdrop-blur
                sticky top-0 z-20
              "
            >
              {/* Close button (fixed placement) */}
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="
                  absolute
                  top-4 right-4
                  h-10 w-10
                  rounded-full
                  flex items-center justify-center
                  bg-gray-100 hover:bg-gray-200
                  dark:bg-gray-800 dark:hover:bg-gray-700
                  text-gray-600 dark:text-gray-300
                  transition
                  shadow-sm
                "
              >
                <X size={18} />
              </button>

              <div className="flex items-center justify-between gap-4 pr-12">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${currentStatus.color}`}
                  >
                    <StatusIcon size={14} />
                    {currentStatus.label}
                  </span>

                  <span className="text-xs font-bold text-gray-400">
                    ID: #{shortId}
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wide">
                    Visit Report
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  Visit <span className="text-teal-600">Summary</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-semibold">
                  Full medical consultation report & prescriptions
                </p>
              </div>
            </div>

            {/* Content (scroll only here) */}
            <div
              className="
                relative
                px-6 py-6
                space-y-8
                overflow-y-auto
                flex-1
                no-scrollbar
              "
            >
              {/* Doctor + Timeline */}
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 gap-6"
              >
                <div className="rounded-[2rem] border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 p-5">
                  <div className="flex items-center gap-3 text-teal-600 mb-3">
                    <User size={18} />
                    <span className="text-xs font-black uppercase tracking-tighter">
                      Attending Physician
                    </span>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                    <p className="font-black text-gray-800 dark:text-white">
                      Dr. {visit?.doctor?.name?.toUpperCase() || "—"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-1">
                      {visit?.department?.name?.toUpperCase() || "—"}
                    </p>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 p-5">
                  <div className="flex items-center gap-3 text-teal-600 mb-3">
                    <Calendar size={18} />
                    <span className="text-xs font-black uppercase tracking-tighter">
                      Timeline
                    </span>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                    <p className="font-black text-gray-800 dark:text-white">
                      {visitDateLabel}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-1">
                      Scheduled Time: {visitTimeLabel}
                    </p>

                    {followUpLabel && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-2">
                        Follow-up:{" "}
                        <span className="text-gray-700 dark:text-gray-200 font-black">
                          {followUpLabel}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Clinical Observations */}
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                <div className="flex items-center gap-3 text-teal-600">
                  <ClipboardList size={18} />
                  <span className="text-xs font-black uppercase tracking-tighter">
                    Clinical Observations
                  </span>
                </div>

                <div className="grid gap-4">
                  <div className="p-5 border border-gray-100 dark:border-gray-800 rounded-[2rem] bg-white dark:bg-gray-900">
                    <p className="text-[10px] font-black text-rose-500 uppercase mb-1 tracking-widest">
                      Reported Symptoms
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold leading-relaxed">
                      {visit?.symptoms || "No symptoms recorded for this visit."}
                    </p>
                  </div>

                  <div className="p-5 border border-emerald-100 dark:border-emerald-900/40 rounded-[2rem] bg-emerald-50/50 dark:bg-emerald-900/10">
                    <div className="flex items-center gap-2 mb-1">
                      <BadgeCheck className="w-4 h-4 text-emerald-600" />
                      <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                        Final Diagnosis
                      </p>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-100 font-black leading-relaxed">
                      {visit?.diagnosis || "Final diagnosis pending further tests."}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Vitals */}
              {visit?.vitals && Object.values(visit.vitals).some(Boolean) && (
                <motion.div
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 text-teal-600">
                    <Activity size={18} />
                    <span className="text-xs font-black uppercase tracking-tighter">
                      Vitals
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {Object.entries(visit.vitals).map(([key, value]) =>
                      value ? (
                        <div
                          key={key}
                          className="px-4 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-sm font-black text-gray-700 dark:text-gray-200"
                        >
                          <span className="capitalize text-gray-500 dark:text-gray-400 font-extrabold mr-1">
                            {key.replace("bp", "BP")}:
                          </span>
                          {value}
                        </div>
                      ) : null
                    )}
                  </div>
                </motion.div>
              )}

              {/* Prescriptions */}
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                <div className="flex items-center gap-3 text-teal-600">
                  <Pill size={18} />
                  <span className="text-xs font-black uppercase tracking-tighter">
                    Medication Plan
                  </span>
                </div>

                {visit?.prescriptions?.length > 0 ? (
                  <div className="overflow-hidden rounded-[2rem] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-black text-gray-700 dark:text-gray-200">
                        Prescribed Medicines
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-1">
                        Dosage, duration & instructions for this visit
                      </p>
                    </div>

                    <table className="w-full text-left text-sm">
                      <thead className="bg-white dark:bg-gray-900">
                        <tr className="border-b border-gray-50 dark:border-gray-800">
                          <th className="px-5 py-3 font-black text-gray-400 text-[10px] uppercase tracking-widest">
                            Medicine
                          </th>
                          <th className="px-5 py-3 font-black text-gray-400 text-[10px] uppercase tracking-widest">
                            Dosage
                          </th>
                          <th className="px-5 py-3 font-black text-gray-400 text-[10px] uppercase tracking-widest">
                            Duration
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {visit.prescriptions.map((p, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50/70 dark:hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="px-5 py-4 font-black text-gray-900 dark:text-gray-100">
                              {p?.medicineName || "—"}
                            </td>

                            <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                              <div className="font-black">{p?.dosage || "—"}</div>
                              {(p?.frequency || p?.instructions) && (
                                <div className="text-[10px] text-gray-400 mt-1 font-semibold">
                                  {[p?.frequency, p?.instructions]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </div>
                              )}
                            </td>

                            <td className="px-5 py-4 text-gray-600 dark:text-gray-300 font-black">
                              {p?.duration || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/40 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold italic">
                      No medications were prescribed during this visit.
                    </p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Footer (fixed + grounded) */}
            <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-teal-500/20"
              >
                <FileText size={16} />
                Download Report PDF
              </motion.button>

              <p className="text-[11px] text-gray-400 mt-3 text-center font-semibold">
                Tip: Use your browser “Save as PDF” after print preview.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VisitDetailsModal;
