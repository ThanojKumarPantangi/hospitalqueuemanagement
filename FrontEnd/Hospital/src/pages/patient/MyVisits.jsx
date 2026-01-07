import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  UserCheck,
  AlertTriangle,
  Clock,
  ChevronRight,
  Search,
  History,
} from "lucide-react";

import CustomCalendar from "../../components/Calendar/CustomCalendar";
import Navbar from "../../components/Navbar/PatientNavbar";
import Loader from "../../components/animation/Loader";
import Toast from "../../components/ui/Toast";
import { getPatientVisitsApi } from "../../api/visit.api";
import VisitDetailsModal from "../../components/visit/VisitDetailsModal";

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

  const MIN_LOADER_TIME = 2500;

  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();

    const fetchVisits = async () => {
      try {
        const res = await getPatientVisitsApi();
        if (isMounted) {
          setVisits(Array.isArray(res?.data?.visits) ? res.data.visits : []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(MIN_LOADER_TIME - elapsed, 0);

        setTimeout(() => {
          if (isMounted) setLoading(false);
        }, remaining);
      }
    };

    fetchVisits();
    return () => {
      isMounted = false;
    };
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

  /* ===================== LOADER ===================== */
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[#212121]/80 backdrop-blur-sm">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar activePage="Visit History" />

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <main className="max-w-6xl mx-auto px-4 pt-10 pb-24">
        {/* ===================== HEADER ===================== */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
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

          {/* ===================== SEARCH & FILTER ===================== */}
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

            <CustomCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>
        </header>

        {/* ===================== VISIT LIST STATES ===================== */}
        <div className="grid gap-6">
          {/* 🟡 No visit history */}
          {visits.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center text-center py-20"
            >
              <History size={48} className="text-gray-300 mb-4" />
              <h3 className="text-xl font-black text-gray-700 dark:text-gray-200">
                No visit history yet
              </h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">
                Once you consult a doctor, your medical visits will appear here.
              </p>
            </motion.div>
          )}

          {/* 🟠 No results after filters */}
          {visits.length > 0 && filteredVisits.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-center py-16"
            >
              <Search size={40} className="text-gray-300 mb-3" />
              <h3 className="text-lg font-black text-gray-700 dark:text-gray-200">
                No matching visits found
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your search or date filter.
              </p>
            </motion.div>
          )}

          {/* 🟢 Normal visit list */}
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

      <VisitDetailsModal
        isOpen={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
        visit={selectedVisit}
        statusConfig={statusConfig}
      />
    </div>
  );
};

export default MyVisits;
