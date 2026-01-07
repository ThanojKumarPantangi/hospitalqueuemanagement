import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User,UserCheck,AlertTriangle, Calendar,Clock, ClipboardList, Activity, Pill, FileText } from 'lucide-react';

// Animation Variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 } 
  },
  exit: { opacity: 0, scale: 0.9, y: 20 }
};

const VisitDetailsModal = ({ isOpen, onClose, visit, statusConfig = {} }) => {
  if (!visit) return null;

  const defaultStatusConfig = {
    COMPLETED: {
    label: "Completed",
    icon: UserCheck,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
    },
    CANCELLED: {
        label: "Cancelled",
        icon: AlertTriangle,
        color: "text-rose-600 bg-rose-50 dark:bg-rose-500/10",
    },
    NO_SHOW: {
        label: "No Show",
        icon: Clock,
        color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
    },
    ...statusConfig
  };

  const currentStatus = defaultStatusConfig[visit.status] || defaultStatusConfig.COMPLETED;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-8 pb-0">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${currentStatus.color}`}>
                  {visit.status || "COMPLETED"}
                </span>
                <span className="text-xs font-bold text-gray-400">
                  ID: #{visit._id?.slice(-6).toUpperCase() || "N/A"}
                </span>
              </div>

              <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                Visit <span className="text-teal-600">Summary</span>
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Full medical consultation report
              </p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
              
              {/* Doctor + Timeline */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-teal-600">
                    <User size={18} />
                    <span className="text-xs font-black uppercase tracking-tighter">
                      Attending Physician
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <p className="font-bold text-gray-800 dark:text-white">
                      Dr. {visit.doctor?.name?.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {visit.department?.name?.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-teal-600">
                    <Calendar size={18} />
                    <span className="text-xs font-black uppercase tracking-tighter">
                      Timeline
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <p className="font-bold text-gray-800 dark:text-white">
                      {new Date(visit.createdAt).toLocaleDateString(undefined, {
                        dateStyle: "long",
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      Scheduled Time:{" "}
                      {new Date(visit.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {visit.followUpDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Follow-up:{" "}
                        {new Date(visit.followUpDate).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Clinical Observations */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-teal-600">
                  <ClipboardList size={18} />
                  <span className="text-xs font-black uppercase tracking-tighter">
                    Clinical Observations
                  </span>
                </div>
                <div className="grid gap-4">
                  <div className="p-5 border border-gray-100 dark:border-gray-800 rounded-2xl">
                    <p className="text-[10px] font-black text-rose-500 uppercase mb-1">
                      Reported Symptoms
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                      {visit.symptoms || "No symptoms recorded for this visit."}
                    </p>
                  </div>
                  <div className="p-5 border border-gray-100 dark:border-gray-800 rounded-2xl bg-emerald-50/20">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">
                      Final Diagnosis
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-200 font-bold leading-relaxed">
                      {visit.diagnosis || "Final diagnosis pending further tests."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vitals */}
              {visit.vitals && Object.values(visit.vitals).some(Boolean) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-teal-600">
                    <Activity size={18} />
                    <span className="text-xs font-black uppercase tracking-tighter">
                      Vitals
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(visit.vitals).map(([key, value]) => (
                      value && (
                        <div key={key} className="px-4 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800 text-sm font-bold">
                          <span className="capitalize">{key.replace('bp', 'BP')}:</span> {value}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Prescriptions */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-teal-600">
                  <Pill size={18} />
                  <span className="text-xs font-black uppercase tracking-tighter">
                    Medication Plan
                  </span>
                </div>
                {visit.prescriptions?.length > 0 ? (
                  <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-4 py-3 font-black text-gray-400 text-[10px] uppercase">Medicine</th>
                          <th className="px-4 py-3 font-black text-gray-400 text-[10px] uppercase">Dosage</th>
                          <th className="px-4 py-3 font-black text-gray-400 text-[10px] uppercase">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {visit.prescriptions.map((p, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">{p.medicineName}</td>
                            <td className="px-4 py-3 text-gray-500">
                              <div className="font-medium">{p.dosage}</div>
                              {(p.frequency || p.instructions) && (
                                <div className="text-[10px] text-gray-400 mt-1">
                                  {[p.frequency, p.instructions].filter(Boolean).join(" · ")}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500">{p.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <p className="text-xs text-gray-400 font-medium italic">
                      No medications were prescribed during this visit.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 pt-0">
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-teal-500/20"
              >
                <FileText size={16} />
                Download Report PDF
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VisitDetailsModal;