import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Clock,
  IndianRupee,
  Plus,
  Power,
  Edit2,
  MonitorCheck,
  Search,
  Filter,
  LayoutGrid,
  Sparkles,
  CheckCircle2,
  XCircle,
  Hash,
  BadgeIndianRupee,
} from "lucide-react";
import AsyncMotionButton from "../../components/buttonmotion/AsyncMotionButton";
import DepartmentModal from "../../components/Department(admin)/DepartmentModal";
import {
  getDepartmentsStatusApi,
  updateDepartmentStatusApi,
  createDepartmentApi,
  updateDepartmentApi,
} from "../../api/admin.api";
import Toast from "../../components/ui/Toast";

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loadingDeptId, setLoadingDeptId] = useState(null);

  // ✅ Fetch skeleton state (added only)
  const [isFetchingDepartments, setIsFetchingDepartments] = useState(true);

  // Modal + Toast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [toast, setToast] = useState(null);

  // Search + Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | OPEN | CLOSED

  // ===================== Fetch Departments =====================
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsFetchingDepartments(true);
        const res = await getDepartmentsStatusApi();
        setDepartments(res.data);
      } catch (error) {
        setToast({
          type: "error",
          message: error?.response?.data?.message || "Failed to load departments",
        });
      } finally {
        setIsFetchingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  // ===================== Update Department Status =====================
  async function updateDepartmentStatus(departmentId, currentIsOpen) {
    try {
      setLoadingDeptId(departmentId);

      await updateDepartmentStatusApi(departmentId, !currentIsOpen);

      setToast({
        type: "success",
        message: "Successfully updated department status",
      });

      // ✅ keep UI synced
      setDepartments((prev) =>
        prev.map((dept) =>
          dept._id === departmentId ? { ...dept, isOpen: !currentIsOpen } : dept
        )
      );
    } catch (error) {
      setToast({
        type: "error",
        message: error?.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoadingDeptId(null);
    }
  }

  // ===================== Modal handlers =====================
  const openCreateModal = () => {
    setEditingDepartment(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingDepartment(dept);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
  };

  // ===================== Submit handler =====================
  const handleSubmit = async (formData) => {
    try {
      if (editingDepartment) {
        // ✏️ UPDATE
        const res = await updateDepartmentApi(editingDepartment._id, formData);

        setToast({
          type: "success",
          message: res?.data?.message || "Successfully updated department",
        });

        setDepartments((prev) =>
          prev.map((dept) =>
            dept._id === editingDepartment._id ? res.data.department : dept
          )
        );
      } else {
        // ➕ CREATE
        const res = await createDepartmentApi(formData);

        setToast({
          type: "success",
          message: res?.data?.message || "Successfully created department",
        });

        setDepartments((prev) => [...prev, res.data.department]);
      }

      closeModal();
    } catch (error) {
      setToast({
        type: "error",
        message: error?.response?.data?.message || "Something went wrong",
      });
    }
  };

  // ===================== Derived UI Data =====================
  const openCount = useMemo(
    () => departments?.filter((d) => d.isOpen)?.length || 0,
    [departments]
  );

  const closedCount = useMemo(
    () => departments?.filter((d) => !d.isOpen)?.length || 0,
    [departments]
  );

  const filteredDepartments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = [...departments];

    if (statusFilter === "OPEN") list = list.filter((d) => d.isOpen);
    if (statusFilter === "CLOSED") list = list.filter((d) => !d.isOpen);

    if (q.length > 0) {
      list = list.filter((d) => {
        const name = d?.name?.toLowerCase() || "";
        const id = d?._id?.toLowerCase() || "";
        return name.includes(q) || id.includes(q);
      });
    }

    // open first
    list.sort((a, b) => Number(b.isOpen) - Number(a.isOpen));
    return list;
  }, [departments, searchQuery, statusFilter]);

  // ===================== Animations =====================
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { y: 16, opacity: 0, scale: 0.985 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 260, damping: 22 },
    },
    exit: {
      y: 14,
      opacity: 0,
      scale: 0.985,
      transition: { duration: 0.18 },
    },
  };

  const cardHover = {
    whileHover: { y: -4, scale: 1.01, transition: { duration: 0.16 } },
    whileTap: { scale: 0.99 },
  };

  const shimmer = {
    initial: { backgroundPositionX: "0%" },
    animate: {
      backgroundPositionX: ["0%", "100%"],
      transition: { duration: 1.2, repeat: Infinity, ease: "linear" },
    },
  };

  // ===================== Skeleton Cards =====================
  const SkeletonCard = () => {
    return (
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
      >
        {/* shimmer overlay */}
        <motion.div
          {...shimmer}
          className="absolute inset-0 opacity-[0.55] dark:opacity-[0.35]"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.06) 40%, rgba(0,0,0,0) 80%)",
          }}
        />
        <div className="p-5 space-y-5 relative">
          {/* top row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded-lg bg-gray-100 dark:bg-gray-800" />
                <div className="h-3 w-24 rounded-lg bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
            <div className="h-7 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
          </div>

          {/* mini grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800" />
            <div className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800" />
            <div className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800" />
          </div>

          {/* actions */}
          <div className="flex gap-3">
            <div className="h-11 flex-1 rounded-2xl bg-gray-100 dark:bg-gray-800" />
            <div className="h-11 w-11 rounded-2xl bg-gray-100 dark:bg-gray-800" />
          </div>

          {/* subtle footer line */}
          <div className="h-3 w-44 rounded-lg bg-gray-100 dark:bg-gray-800" />
        </div>
      </motion.div>
    );
  };

  // ===================== Redesigned Department Card =====================
  const DepartmentCard = ({ dept }) => {
    const isBusy = loadingDeptId === dept._id;

    return (
      <motion.div
        key={dept._id}
        variants={itemVariants}
        exit="exit"
        {...cardHover}
        className={`relative overflow-hidden rounded-3xl border shadow-sm transition-all duration-300 group ${
          dept.isOpen
            ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-lg"
            : "bg-gray-100/80 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 hover:shadow-md"
        }`}
      >
        {/* Top status glow */}
        <div
          className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl opacity-40 ${
            dept.isOpen
              ? "bg-emerald-400/40"
              : "bg-gray-400/20 dark:bg-gray-700/20"
          }`}
        />

        {/* Status bar */}
        <div
          className={`absolute top-0 left-0 w-full h-[3px] ${
            dept.isOpen ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"
          }`}
        />

        {/* Inner */}
        <div className="relative p-5 space-y-5">
          {/* HEADER */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                  dept.isOpen
                    ? "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-400"
                    : "bg-gray-200 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-800 dark:text-gray-300"
                }`}
              >
                <Building2 className="w-6 h-6" />
              </div>

              <div className="min-w-0">
                <h3
                  className={`font-black text-lg truncate ${
                    dept.isOpen
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {dept?.name?.toUpperCase()}
                </h3>

                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" />
                    {dept?._id?.slice(0, 6)}......
                  </span>

                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />

                  <span className="inline-flex items-center gap-1">
                    <MonitorCheck className="w-3.5 h-3.5" />
                    {dept?.maxCounters} counters
                  </span>
                </div>
              </div>
            </div>

            <span
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                dept.isOpen
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30"
                  : "bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
              }`}
            >
              {dept.isOpen ? "Open" : "Closed"}
            </span>
          </div>

          {/* MAIN INFO (new layout) */}
          <div
            className={`grid grid-cols-2 gap-3 ${
              !dept.isOpen && "opacity-70 grayscale"
            }`}
          >
            {/* Left big tile */}
            <div className="rounded-3xl p-4 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Slot Duration
              </p>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                {dept?.slotDurationMinutes}
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 ml-1">
                  min
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Controls appointment pacing
              </p>
            </div>

            {/* Right stacked tiles */}
            <div className="flex flex-col gap-3">
              <div className="rounded-3xl p-4 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <BadgeIndianRupee className="w-4 h-4" />
                  Consultation Fee
                </p>
                <p className="text-xl font-black text-gray-900 dark:text-white mt-2">
                  ₹{dept?.consultationFee}
                </p>
              </div>

              <div className="rounded-3xl p-4 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <MonitorCheck className="w-4 h-4" />
                  Max Counters
                </p>
                <p className="text-xl font-black text-gray-900 dark:text-white mt-2">
                  {dept?.maxCounters}
                </p>
              </div>
            </div>
          </div>

          {/* ACTIONS (cleaner, better spacing) */}
          <div className="flex items-center gap-3 pt-1">
            <AsyncMotionButton
              loading={isBusy}
              onClick={(e) => {
                e.stopPropagation();
                updateDepartmentStatus(dept._id, dept.isOpen);
              }}
              loadingText={dept.isOpen ? "Closing..." : "Opening..."}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black transition-all border ${
                dept.isOpen
                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 dark:border-rose-900/30"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 dark:border-emerald-900/30"
              }`}
              icon={<Power className="w-4 h-4" />}
            >
              {dept.isOpen ? "Close Department" : "Open Department"}
            </AsyncMotionButton>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(dept);
              }}
              className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors border border-gray-200 dark:border-gray-800"
            >
              <Edit2 className="w-4 h-4" />
            </motion.button>
          </div>

          {/* FOOTER hint */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              {dept.isOpen
                ? "Accepting tokens & appointments"
                : "Not accepting new tokens"}
            </span>
            <span className="font-semibold">
              {dept.isOpen ? "Live" : "Paused"}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <motion.div
        className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 space-y-6 relative overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Decorative blobs */}
        <motion.div
          className="pointer-events-none absolute -top-32 -left-32 w-[380px] h-[380px] rounded-full bg-teal-400/20 blur-3xl"
          initial={{ opacity: 0.35 }}
          animate={{
            opacity: [0.25, 0.45, 0.25],
            transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-blue-400/20 blur-3xl"
          initial={{ opacity: 0.35 }}
          animate={{
            opacity: [0.25, 0.45, 0.25],
            transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* HEADER */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-teal-50/60 via-transparent to-blue-50/60 dark:from-teal-900/10 dark:to-blue-900/10" />

          <div className="relative p-6 sm:p-7 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-200 dark:shadow-none">
                    <LayoutGrid className="w-5 h-5" />
                  </span>

                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    Department Management
                  </h1>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  Configure slot timing, consultation fee, and counters. Toggle
                  status instantly.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.985 }}
                onClick={openCreateModal}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl shadow-lg shadow-teal-200 dark:shadow-none font-black transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Department
              </motion.button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Total Departments
                  </p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                    {departments?.length || 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-900/10 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-emerald-700/80 dark:text-emerald-300/80">
                    Open Now
                  </p>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                    {openCount}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Closed
                  </p>
                  <p className="text-2xl font-black text-gray-800 dark:text-gray-200 mt-1">
                    {closedCount}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </div>
              </motion.div>
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by department name or ID..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Filter */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md shadow-sm hover:shadow-md transition">
                  <Filter className="w-4 h-4 text-gray-400" />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm font-semibold px-2 py-1 rounded-xl
                              bg-white dark:bg-gray-900
                              text-gray-800 dark:text-gray-100
                              border border-gray-200 dark:border-gray-700
                              outline-none cursor-pointer
                              focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="ALL" className="text-gray-900 bg-white">
                      All
                    </option>
                    <option value="OPEN" className="text-gray-900 bg-white">
                      Open
                    </option>
                    <option value="CLOSED" className="text-gray-900 bg-white">
                      Closed
                    </option>
                  </select>
                </div>

                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 180, damping: 16 }}
                  className="hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/70 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 backdrop-blur-md shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-extrabold uppercase tracking-wide">
                    Admin Experience
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* GRID */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Showing{" "}
              <span className="font-black text-gray-900 dark:text-white">
                {isFetchingDepartments ? "..." : filteredDepartments?.length}
              </span>{" "}
              departments
            </p>

            <p className="text-xs text-gray-400">
              Open departments are prioritized.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {/* Skeleton while fetching */}
              {isFetchingDepartments &&
                Array.from({ length: 6 }).map((_, idx) => (
                  <SkeletonCard key={`skeleton-${idx}`} index={idx} />
                ))}

              {/* Real cards */}
              {!isFetchingDepartments &&
                filteredDepartments?.map((dept) => (
                  <DepartmentCard key={dept._id} dept={dept} />
                ))}
            </AnimatePresence>

            {/* Add new placeholder (only after fetch to avoid confusion) */}
            {!isFetchingDepartments && (
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={openCreateModal}
                className="relative overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-7 flex flex-col items-center justify-center text-center hover:border-teal-500 dark:hover:border-teal-500/50 hover:bg-teal-50/40 dark:hover:bg-teal-900/10 transition-all cursor-pointer group min-h-[260px]"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-teal-50/70 via-transparent to-blue-50/70 dark:from-teal-900/10 dark:to-blue-900/10" />

                <div className="relative w-14 h-14 rounded-3xl bg-gray-100 dark:bg-gray-800 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 flex items-center justify-center mb-4 transition-colors border border-gray-200 dark:border-gray-800">
                  <Plus className="w-7 h-7 text-gray-400 group-hover:text-teal-600 dark:text-gray-500 dark:group-hover:text-teal-400" />
                </div>

                <p className="relative font-black text-gray-900 dark:text-white text-lg">
                  Create New Department
                </p>
                <p className="relative text-sm text-gray-500 mt-1">
                  Add queues, fee, and counters instantly.
                </p>

                <div className="relative mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-bold text-gray-700 dark:text-gray-200">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Quick Create
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* MODAL */}
      <DepartmentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initialData={editingDepartment}
      />
    </>
  );
};

export default AdminDepartments;
