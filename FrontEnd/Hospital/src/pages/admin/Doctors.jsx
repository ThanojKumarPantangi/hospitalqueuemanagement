import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Ban,
  PlayCircle,
  PauseCircle,
  Phone,
  Stethoscope,
  LayoutGrid,
  List as ListIcon,
  Users,
  User,
  Activity,
  Clock,
  ChevronRight,
  MoreVertical,
  ArrowUpRight,
} from "lucide-react";
import Toast from "../../components/ui/Toast";
import DoctorProfileModal from "../../components/DoctorModal/DoctorProfileModal";
import CreateDoctorModal from "../../components/DoctorModal/CreateDoctorModal";
import {
  getDoctorsApi,
  verifyDoctorApi,
  createDoctorApi,
  markDoctorAvailableApi,
  markDoctorOnLeaveApi,
  markDoctorInactiveApi,
  activateDoctorApi,
  getDoctorProfileApi,
  updateDoctorProfileApi,
  getAllDepartmentsApi,
} from "../../api/admin.api";

/* =======================
   CONSTANTS & CONFIG
   ======================= */
const getDoctorUIState = (doctor) => {
  if (!doctor.isVerified) return "PENDING";
  if (!doctor.isActive) return "INACTIVE";
  if (doctor.isActive && !doctor.isAvailable) return "ON_LEAVE";
  return "AVAILABLE";
};

const STATE_CONFIG = {
  PENDING: {
    label: "Verification Needed",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/10",
    border: "border-amber-200 dark:border-amber-800",
    ring: "ring-amber-500/20",
    icon: ShieldCheck,
  },
  AVAILABLE: {
    label: "Active & Available",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/10",
    border: "border-emerald-200 dark:border-emerald-800",
    ring: "ring-emerald-500/20",
    icon: CheckCircle2,
  },
  ON_LEAVE: {
    label: "Currently on Leave",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10",
    border: "border-blue-200 dark:border-blue-800",
    ring: "ring-blue-500/20",
    icon: PauseCircle,
  },
  INACTIVE: {
    label: "Account Suspended",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-800/30",
    border: "border-slate-200 dark:border-slate-700",
    ring: "ring-slate-500/20",
    icon: Ban,
  },
};

/* =======================
   ANIMATION VARIANTS
   ======================= */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

/* =======================
   SUB-COMPONENTS
   ======================= */

// 1. Stat Card Component
const StatCard = ({ icon: Icon, label, value, trend, colorClass }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    className="relative overflow-hidden bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <h4 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
          {value}
        </h4>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full w-fit">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </motion.div>
);

// 2. Action Button Component
const ActionButton = ({ onClick, icon: Icon, colorClass, title }) => (
  <div className="relative group/btn">
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={title}
      className={`p-2.5 rounded-xl transition-all duration-200 ${colorClass} relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 focus:ring-blue-500/50 shadow-sm`}
    >
      <Icon className="w-4 h-4" />
    </motion.button>

    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-800 text-white text-[11px] font-medium rounded-lg opacity-0 transform translate-y-1 group-hover/btn:opacity-100 group-hover/btn:translate-y-0 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
      {title}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
    </div>
  </div>
);

// Modal Confirmation
const ConfirmModal = ({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  loading,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={loading ? undefined : onCancel}
      />

      <div className="relative w-[92%] max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            {description}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-60"
          >
            No
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
          >
            {loading ? "Processing..." : "Yes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper for Actions
const ActionButtons = ({
  uiState,
  doc,
  onSuccess,
  setToast,
  onViewProfile,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState({
    title: "",
    description: "",
    action: null,
  });
  const [loading, setLoading] = useState(false);

  const openConfirm = ({ title, description, action }) => {
    setConfirmData({ title, description, action });
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (loading) return;
    setConfirmOpen(false);
    setConfirmData({ title: "", description: "", action: null });
  };

  const handleConfirm = async () => {
    if (!confirmData.action) return;

    try {
      setLoading(true);
      await confirmData.action();
      closeConfirm();
    } catch (error) {
      console.log(error);
      setToast?.({
        type: "error",
        message: error?.response?.data?.message || "Something went wrong!",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ConfirmModal
        open={confirmOpen}
        title={confirmData.title}
        description={confirmData.description}
        onCancel={closeConfirm}
        onConfirm={handleConfirm}
        loading={loading}
      />

      {uiState === "PENDING" && (
        <ActionButton
          icon={CheckCircle2}
          title="Approve Account"
          colorClass="bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
          onClick={() =>
            openConfirm({
              title: "Approve Doctor Account?",
              description: "This will verify and activate this doctor account.",
              action: async () => {
                await verifyDoctorApi({ doctorId: doc?._id });
                await onSuccess?.();
                setToast?.({
                  type: "success",
                  message: "Doctor approved successfully!",
                });
              },
            })
          }
        />
      )}

      {uiState === "AVAILABLE" && (
        <>
          <ActionButton
            icon={PauseCircle}
            title="Set On Leave"
            colorClass="bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
            onClick={() =>
              openConfirm({
                title: "Set Doctor On Leave?",
                description:
                  "Doctor will not receive new tokens until available again.",
                action: async () => {
                  await markDoctorOnLeaveApi({ doctorId: doc?._id });
                  await onSuccess?.();
                  setToast?.({
                    type: "success",
                    message: "Doctor marked as On Leave!",
                  });
                },
              })
            }
          />

          <ActionButton
            icon={Ban}
            title="Suspend Access"
            colorClass="bg-slate-100 text-slate-500 hover:bg-rose-500 hover:text-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-500/20 dark:hover:text-rose-400"
            onClick={() =>
              openConfirm({
                title: "Suspend Doctor Access?",
                description:
                  "Doctor will be blocked from logging in until reactivated.",
                action: async () => {
                  await markDoctorInactiveApi({ doctorId: doc?._id });
                  await onSuccess?.();
                  setToast?.({
                    type: "success",
                    message: "Doctor suspended successfully!",
                  });
                },
              })
            }
          />
        </>
      )}

      {uiState === "ON_LEAVE" && (
        <ActionButton
          icon={PlayCircle}
          title="Mark Available"
          colorClass="bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
          onClick={() =>
            openConfirm({
              title: "Mark Doctor Available?",
              description: "Doctor will start receiving new tokens again.",
              action: async () => {
                await markDoctorAvailableApi({ doctorId: doc?._id });
                await onSuccess?.();
                setToast?.({
                  type: "success",
                  message: "Doctor marked as Available!",
                });
              },
            })
          }
        />
      )}

      {uiState === "INACTIVE" && (
        <ActionButton
          icon={ShieldCheck}
          title="Reactivate"
          colorClass="bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
          onClick={() =>
            openConfirm({
              title: "Reactivate Doctor?",
              description: "Doctor account will be enabled again.",
              action: async () => {
                await activateDoctorApi({ doctorId: doc?._id });
                await onSuccess?.();
                setToast?.({
                  type: "success",
                  message: "Doctor reactivated successfully!",
                });
              },
            })
          }
        />
      )}

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

      <ActionButton
        icon={User}
        title="View Profile"
        colorClass="bg-violet-50 text-violet-600 hover:bg-violet-500 hover:text-white dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/20"
        onClick={() => onViewProfile?.(doc)}
      />
    </>
  );
};

// 3. Grid View Card
const DoctorGridCard = ({
  doc,
  config,
  uiState,
  initials,
  onRefresh,
  setToast,
  onViewProfile,
}) => {
  const Icon = config.icon;

  return (
    <motion.div
      variants={itemVariants}
      layout
      className="group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col h-full"
    >
      <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
        <div className={`h-32 w-full ${config.bg} transition-colors duration-300`} />
      </div>

      <div className="absolute top-4 right-4 z-10 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
        <Icon className={`w-24 h-24 ${config.color}`} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="h-20 px-6 pt-3.5 flex items-start justify-between">
          <span
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/60 dark:bg-black/20 backdrop-blur-md shadow-sm border border-white/20 ${config.color}`}
          >
            {uiState.replace("_", " ")}
          </span>
        </div>

        <div className="px-6 -mt-8 mb-3">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 p-1 shadow-lg ring-1 ring-slate-100 dark:ring-slate-800">
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-2xl font-black text-slate-400 dark:text-slate-500">
                {initials}
              </div>
            </div>
            <div
              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-[3px] border-white dark:border-slate-900 ${
                uiState === "AVAILABLE" ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
          </div>
        </div>

        <div className="px-6 flex-1">
          <h3
            className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1"
            title={doc.name}
          >
            DR {doc.name?.toUpperCase()}
          </h3>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 mb-4">
            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
              <Stethoscope className="w-3 h-3" />
              {doc.departments.map((d) => d.name).join(", ")}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-400">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-slate-400 font-bold">
                  Phone
                </span>
                <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-200">
                  {doc.phone}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-slate-400">Last active:</span>
              <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {doc.lastActive || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 mt-4 border-t border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">
              Actions
            </span>
            <div className="flex items-center gap-1">
              <ActionButtons
                uiState={uiState}
                doc={doc}
                onSuccess={onRefresh}
                setToast={setToast}
                onViewProfile={onViewProfile}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// 4. List View Row
const DoctorListItem = ({
  doc,
  config,
  uiState,
  initials,
  onRefresh,
  setToast,
  onViewProfile,
}) => {
  return (
    <motion.div
      variants={itemVariants}
      layout
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-200 flex flex-col md:flex-row items-center gap-6"
    >
      <div className="flex items-center gap-4 w-full md:w-1/3">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
            {initials}
          </div>
          <div
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
              uiState === "AVAILABLE" ? "bg-emerald-500" : "bg-slate-400"
            }`}
          />
        </div>

        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            {doc.name}
          </h3>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            {doc.departments.map((d) => d.name).join(", ")}
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 w-full md:w-auto">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono">{doc.phone}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{doc.lastActive}</span>
        </div>
      </div>

      <div className="w-full md:w-auto flex justify-between md:justify-end items-center gap-6 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
        <div
          className={`px-2.5 py-1 rounded-lg flex items-center gap-2 text-xs font-bold uppercase border ${config.bg} ${config.color} ${config.border}`}
        >
          <config.icon className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{config.label}</span>
          <span className="lg:hidden">{uiState}</span>
        </div>

        <div className="flex gap-1.5 items-center">
          <ActionButtons
            uiState={uiState}
            doc={doc}
            onSuccess={onRefresh}
            setToast={setToast}
            onViewProfile={onViewProfile}
          />
        </div>
      </div>
    </motion.div>
  );
};

/* =======================
   MAIN COMPONENT
   ======================= */
const AdminDoctors = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("ALL");
  const [viewMode, setViewMode] = useState("GRID");

  const [doctors, setDoctors] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const [profileLoading, setProfileLoading] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [departments, setDepartments] = useState([])

  // ✅ Profile modal state
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);


  const openProfile = (doc) => {
    setSelectedDoctor(doc);
    setProfileOpen(true);

    if (doc?._id) {
      getDoctorProfile(doc._id);
    }
  };

  const closeProfile = () => {
    setProfileOpen(false);
    setSelectedDoctor(null);
    setDoctorProfile(null);
  };

  // Doctor Profile
  const getDoctorProfile = async (doctorID) => {
    try {
      setProfileLoading(true);
      setDoctorProfile(null);
      const res = await getDoctorProfileApi(doctorID);
      setDoctorProfile(res?.data || null);
    } catch (error) {
      setToast?.({
        type: "error",
        message: error?.response?.data?.message || "Failed to load doctor profile",
      });
      loading;
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch Doctors in department
  const fetchDoctors = async () => {
    try {
      setLoading(true);

      const res = await getDoctorsApi();
      setDoctors(res.data || []);
    } catch (err) {
      setToast?.({
        type: "error",
        message: err?.response?.data?.message || "Failed to load doctors",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get All Departments
  const fetchDepartments=async()=>{
    try {
      const res =await getAllDepartmentsApi();
      setDepartments(res?.data?.departments)
    } catch (error) {
      setToast({
        type: "error",
        message: error?.response?.data?.message||"Failed to fetch departments",
      })
    }
  }

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  const stats = useMemo(
    () => ({
      total: doctors.length,
      pending: doctors.filter((d) => !d.isVerified).length,
      active: doctors.filter((d) => d.isActive).length,
    }),
    [doctors]
  );

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const uiState = getDoctorUIState(doc);
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.phone.includes(searchTerm);
      const matchesFilter = filterState === "ALL" || uiState === filterState;
      return matchesSearch && matchesFilter;
    });
  }, [doctors, searchTerm, filterState]);

  return (
    <>
      {/* ✅ Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* ✅ Doctor Profile Modal */}
      <DoctorProfileModal
        open={profileOpen}
        onClose={closeProfile}
        doctorData={doctorProfile}
        loading={profileLoading}
        departments={departments}               
        onSave={async (payload) => {
          try {
            const res=await updateDoctorProfileApi(selectedDoctor._id,payload);
            setToast({
              type: "success",
              message: res?.data?.message||"Doctor profile updated successfully!",
            });
            getDoctorProfile(selectedDoctor._id); 
          } catch (error) {
            setToast({
              type: "error",
              message: error?.response?.data?.message||"Failed to update doctor profile",
            });
          }  
      }}
      />

      <CreateDoctorModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        departments={departments}
        onCreate={async (payload) => {
          try {
            const res=await createDoctorApi(payload);
            setCreateOpen(false);
            setToast({
              type: "success",
              message: res?.data?.message||"Doctor created successfully!",
            });
            fetchDoctors();
          } catch (error) {
            setToast({
              type: "error",
              message: error?.response?.data?.message||"Failed Create Doctor",
            });
          }
        }}
      />

      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 md:p-8 font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900">
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-70 animate-blob" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-100/50 dark:bg-purple-900/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-70 animate-blob animation-delay-2000" />
        </div>

        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200/60 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Medical Staff
                </h1>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-lg text-sm font-medium">
                Admin dashboard for managing provider verification and status.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                onClick={() => setViewMode("GRID")}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === "GRID"
                    ? "bg-slate-100 text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
                aria-label="Grid View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

              <button
                onClick={() => setViewMode("LIST")}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === "LIST"
                    ? "bg-slate-100 text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
                aria-label="List View"
              >
                <ListIcon className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

              {/* ✅ Create Doctor Button */}
              <button
                onClick={() => setCreateOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition active:scale-95"
              >
                + Create Doctor
              </button>
            </div>
            
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <StatCard
              icon={Users}
              label="Total Doctors"
              value={stats.total}
              trend="12% vs last month"
              colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <StatCard
              icon={ShieldCheck}
              label="Pending Approval"
              value={stats.pending}
              colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            />
            <StatCard
              icon={Activity}
              label="Online Now"
              value={stats.active}
              trend="Stable"
              colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            />
          </motion.div>

          <div className="sticky top-6 z-30">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-black/20 flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by name, ID or phone..."
                  className="w-full pl-11 pr-4 py-3 bg-transparent border-none rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 focus:bg-slate-50 dark:focus:bg-slate-800 transition-all text-sm font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700" />

              <div className="relative w-full sm:w-[240px]">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium cursor-pointer appearance-none hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Verification</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="INACTIVE">Inactive</option>
                </select>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                </div>
              </div>
            </div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={
              viewMode === "GRID"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20"
                : "flex flex-col gap-4 pb-20"
            }
          >
            <AnimatePresence mode="popLayout">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doc) => {
                  const uiState = getDoctorUIState(doc);
                  const config = STATE_CONFIG[uiState];
                  const initials = doc.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2);

                  return viewMode === "GRID" ? (
                    <DoctorGridCard
                      key={doc._id}
                      doc={doc}
                      config={config}
                      uiState={uiState}
                      initials={initials}
                      onRefresh={fetchDoctors}
                      setToast={setToast}
                      onViewProfile={openProfile}
                    />
                  ) : (
                    <DoctorListItem
                      key={doc._id}
                      doc={doc}
                      config={config}
                      uiState={uiState}
                      initials={initials}
                      onRefresh={fetchDoctors}
                      setToast={setToast}
                      onViewProfile={openProfile}
                    />
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700"
                >
                  <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    No doctors found
                  </h3>
                  <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-8">
                    We couldnt find any medical staff matching your current
                    search filters.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterState("ALL");
                    }}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                  >
                    Clear All Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AdminDoctors;