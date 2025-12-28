import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, UserCheck, AlertTriangle,Pill, Clock, ChevronRight,
  Search, History, X, FileText, User, ClipboardList
} from "lucide-react";
import CustomCalendar from "../../components/Calendar/CustomCalendar";

import Navbar from "../../components/Navbar/PatientNavbar";
import Loader from "../../components/Loader";
import Toast from "../../components/ui/Toast";
import { getPatientVisitsApi } from "../../api/visit.api";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 }
  },
  exit: { opacity: 0, scale: 0.9, y: 20 }
};

const statusConfig = {
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
};

const MyVisits = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchVisits = async () => {
      try {
        const res = await getPatientVisitsApi();
        if (isMounted) {
          setVisits(Array.isArray(res.data.visits) ? res.data.visits : []);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error(error);
          setLoading(false);
        }
      }
    };

    fetchVisits();
    return () => { isMounted = false; };
  }, []);

  /* ===================== FILTER LOGIC ===================== */
  const filteredVisits = visits.filter((v) => {
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      v.doctor?.name?.toLowerCase().includes(q) ||
      v.department?.name?.toLowerCase().includes(q);

    const matchesDate =
      !selectedDate ||
      new Date(v.createdAt).toISOString().slice(0, 10) === selectedDate;

    return matchesSearch && matchesDate;
  });
  /* ======================================================= */

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar activePage="Visit History" />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <main className="max-w-6xl mx-auto px-4 pt-10 pb-24">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <div className="flex items-center gap-2 text-teal-600 font-bold text-sm uppercase tracking-widest mb-2">
              <History size={16} />
              <span>Medical Records</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              My{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">
                Visit History
              </span>
            </h1>
          </motion.div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by doctor or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-sm"
              />
            </div>

            {/* Date Filter */}
            <CustomCalendar 
                selectedDate={selectedDate} 
                onDateSelect={setSelectedDate} 
            />

          </div>
        </header>

        {/* Visit List */}
        <div className="grid gap-6">
          {filteredVisits.map((v) => {
            const status = statusConfig[v.status] || statusConfig.COMPLETED;
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={v._id}
                layoutId={v._id}
                onClick={() => setSelectedVisit(v)}
                className="group cursor-pointer bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-2xl ${status.color}`}>
                      <StatusIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg">
                        {v.department?.name?.toUpperCase()}
                      </h3>
                      <p className="text-gray-500 text-sm font-semibold">
                        Dr. {v.doctor?.name?.toUpperCase()}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                        <Calendar size={12} />
                        {new Date(v.createdAt).toDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden md:block text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase">
                        Medicines
                      </p>
                      <p className="text-sm font-bold">
                        {v.prescriptions?.length || 0} Prescribed
                      </p>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs font-black uppercase tracking-wider group-hover:bg-teal-600 group-hover:text-white transition-all">
                      View Report <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* --- Visit Details Modal --- */}
      <AnimatePresence>
        {selectedVisit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={() => setSelectedVisit(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="relative p-8 pb-0">
                <button 
                  onClick={() => setSelectedVisit(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusConfig[selectedVisit.status]?.color || statusConfig.COMPLETED.color}`}>
                    {selectedVisit.status || 'COMPLETED'}
                  </span>
                  <span className="text-xs font-bold text-gray-400">
                    ID: #{selectedVisit._id.slice(-6).toUpperCase()}
                  </span>
                </div>

                <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                  Visit <span className="text-teal-600">Summary</span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">Full medical consultation report</p>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                
                {/* Section: Clinical Information */}
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3 text-teal-600">
                        <User size={18} />
                        <span className="text-xs font-black uppercase tracking-tighter">Attending Physician</span>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                         <p className="font-bold text-gray-800 dark:text-white">Dr. {selectedVisit.doctor?.name?.toUpperCase()}</p>
                         <p className="text-xs text-gray-500">{selectedVisit.department?.name?.toUpperCase()}</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-center gap-3 text-teal-600">
                        <Calendar size={18} />
                        <span className="text-xs font-black uppercase tracking-tighter">Timeline</span>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                         <p className="font-bold text-gray-800 dark:text-white">
                            {new Date(selectedVisit.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                         </p>
                         <p className="text-xs text-gray-500">Scheduled Time: {new Date(selectedVisit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                   </div>
                </div>

                {/* Section: Observations */}
                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-teal-600">
                      <ClipboardList size={18} />
                      <span className="text-xs font-black uppercase tracking-tighter">Clinical Observations</span>
                   </div>
                   <div className="grid gap-4">
                      <div className="p-5 border border-gray-100 dark:border-gray-800 rounded-2xl">
                         <p className="text-[10px] font-black text-rose-500 uppercase mb-1">Reported Symptoms</p>
                         <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                            {selectedVisit.symptoms || "No symptoms recorded for this visit."}
                         </p>
                      </div>
                      <div className="p-5 border border-gray-100 dark:border-gray-800 rounded-2xl bg-emerald-50/20">
                         <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Final Diagnosis</p>
                         <p className="text-sm text-gray-700 dark:text-gray-200 font-bold leading-relaxed">
                            {selectedVisit.diagnosis || "Final diagnosis pending further tests."}
                         </p>
                      </div>
                   </div>
                </div>

                {/* Section: Prescriptions */}
                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-teal-600">
                      <Pill size={18} />
                      <span className="text-xs font-black uppercase tracking-tighter">Medication Plan</span>
                   </div>
                   {selectedVisit.prescriptions?.length > 0 ? (
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
                            {selectedVisit.prescriptions.map((p, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">{p.medicineName}</td>
                                <td className="px-4 py-3 text-gray-500">{p.dosage}</td>
                                <td className="px-4 py-3 text-gray-500">{p.duration}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                   ) : (
                      <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                         <p className="text-xs text-gray-400 font-medium italic">No medications were prescribed during this visit.</p>
                      </div>
                   )}
                </div>
              </div>

              {/* Modal Footer */}
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

    </div>
  );
};

export default MyVisits;
