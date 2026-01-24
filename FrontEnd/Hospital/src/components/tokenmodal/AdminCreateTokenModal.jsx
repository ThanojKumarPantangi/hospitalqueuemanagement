import React, { useMemo, useState } from "react";
import BaseModal from "./BaseModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  QrCode,
  User,
  ShieldCheck,
  Sparkles,
  MapPin,
  Phone,
  CheckCircle2,
  X,
  AlertTriangle,
} from "lucide-react";

import AdminPatientQrScanner from "../../pages/admin/AdminPatientQrScanner"; 


const AdminCreateTokenModal = ({
  open,
  onClose,

  // departments
  departments = [],
  departmentId,
  setDepartmentId,

  // date
  appointmentDate,
  setAppointmentDate,
  MAX_ADVANCE_DAYS,
  today,
  formatDate,

  // priority
  priority,
  setPriority,

  // preview
  expectedTokenNumber,
  previewLoading,

  // create
  creating,
  createToken,

  // optional: if you want to show preview patient from parent
  // you can ignore this
}) => {
  const [patientId, setPatientId] = useState("");
  const [patientInfo, setPatientInfo] = useState(null);

  const [showScanner, setShowScanner] = useState(false);

  const sectionVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
  };

  const cardHover = {
    whileHover: { y: -2, scale: 1.01 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring", stiffness: 240, damping: 18 },
  };

  const stepReadyPatient = Boolean(patientId);
  const stepReadyDept = Boolean(departmentId);
  const stepReadyDate = Boolean(appointmentDate);
  const stepReadyPriority = Boolean(priority);

  const canConfirm =
    stepReadyPatient && stepReadyDept && stepReadyDate && stepReadyPriority;

  const selectedDepartment = useMemo(() => {
    return departments.find((d) => d._id === departmentId);
  }, [departments, departmentId]);

  // 🔥 QR Scanner callback
  const handleQrFound = (data) => {
    // data from backend: { patientId, name, phone }
    setPatientId(data?.patientId || "");
    setPatientInfo({
      name: data?.name || "Unknown",
      phone: data?.phone || "—",
      patientId: data?.patientId || "",
    });
    setShowScanner(false);
  };

  // 🔥 Confirm booking
  const handleConfirm = () => {
    if (!canConfirm) return;

    // pass required payload to parent
    createToken({
      patientId,
      departmentId,
      appointmentDate,
      priority,
    });
  };

  return (
    <>
      {/* QR Scanner Fullscreen */}
      <AnimatePresence>
        {showScanner && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm"
            >
            <div className="absolute inset-0 w-full h-full">
                <AdminPatientQrScanner
                onFound={handleQrFound}
                onClose={() => setShowScanner(false)}
                />
            </div>
            </motion.div>
        )}
      </AnimatePresence>

      <BaseModal open={open} onClose={onClose} maxWidth="max-w-2xl">
        {/* Top Gradient */}
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

        {/* Header */}
        <div className="px-10 pt-10 pb-6 text-center">
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center 
                       rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg"
          >
            <CalendarIcon size={32} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-black"
          >
            Admin <span className="text-indigo-600">Token Booking</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-2 text-sm text-gray-500 font-medium"
          >
            Book tokens for patients using ID or QR scan.
          </motion.p>

          {/* Stepper strip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-6 grid grid-cols-4 gap-3"
          >
            <StepCard
              step="Step 1"
              title="Patient"
              status={stepReadyPatient ? "Selected" : "Scan / Enter"}
              active={stepReadyPatient}
              color="indigo"
            />
            <StepCard
              step="Step 2"
              title="Department"
              status={stepReadyDept ? "Selected" : "Choose"}
              active={stepReadyDept}
              color="violet"
            />
            <StepCard
              step="Step 3"
              title="Date"
              status={stepReadyDate ? appointmentDate : "Pick"}
              active={stepReadyDate}
              color="fuchsia"
            />
            <StepCard
              step="Step 4"
              title="Priority"
              status={priority || "Select"}
              active={stepReadyPriority}
              color="emerald"
            />
          </motion.div>
        </div>

        {/* Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="px-10 space-y-8 pb-10"
        >
           {/* Patient Section */}
          <motion.div variants={sectionVariants} className="space-y-3">
            <label className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                Patient Identification
            </label>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                {/* ✅ FIXED: Input + Button always on same line */}
                <div className="flex items-end gap-3">
                {/* Patient ID Input */}
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    Patient ID
                    </p>

                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2">
                    <User size={16} className="text-gray-400 shrink-0" />

                    <input
                        value={patientId}
                        onChange={(e) => {
                        setPatientId(e.target.value);
                        setPatientInfo(null);
                        }}
                        placeholder="Paste patientId or scan QR"
                        className="w-full min-w-0 bg-transparent outline-none text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400"
                    />

                    {patientId && (
                        <button
                        type="button"
                        onClick={() => {
                            setPatientId("");
                            setPatientInfo(null);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition shrink-0"
                        title="Clear"
                        >
                        <X size={16} className="text-gray-500" />
                        </button>
                    )}
                    </div>
                </div>

                {/* Scan Button */}
                <motion.button
                    {...cardHover}
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 
                            bg-indigo-600 text-white font-black text-xs tracking-widest uppercase
                            shadow-[0_0_22px_rgba(99,102,241,0.35)]
                            hover:bg-indigo-500 transition-all"
                >
                    <QrCode size={16} />
                    Scan QR
                </motion.button>
                </div>

                {/* Patient Preview */}
                <div className="mt-4">
                {patientInfo ? (
                    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                        <CheckCircle2
                            size={18}
                            className="text-emerald-600 dark:text-emerald-400 mt-0.5"
                        />
                        <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white">
                            Patient Verified
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            <span className="font-bold">Name:</span>{" "}
                            {patientInfo?.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-bold">Phone:</span>{" "}
                            {patientInfo?.phone}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-bold">Patient ID:</span>{" "}
                            {patientInfo?.patientId}
                            </p>
                        </div>
                        </div>
                    </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                    <ShieldCheck size={14} />
                    Scan QR to auto-fill patient details (recommended).
                    </div>
                )}
                </div>
            </div>
          </motion.div>

          {/* Department Selector */}
          <motion.div variants={sectionVariants} className="space-y-3">
            <label className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Select Department
            </label>

            <div className="grid gap-2">
              {departments.map((dept) => {
                const selected = departmentId === dept._id;

                return (
                  <motion.button
                    key={dept._id}
                    {...cardHover}
                    type="button"
                    onClick={() => setDepartmentId(dept._id)}
                    className={`relative flex items-center justify-between rounded-2xl border-2 p-4
                      transition-all active:scale-[0.97] overflow-hidden
                      ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300"
                          : "border-transparent bg-gray-50 dark:bg-gray-900 text-gray-500"
                      }`}
                  >
                    {selected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 pointer-events-none"
                      >
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[60px] bg-indigo-400/20" />
                      </motion.div>
                    )}

                    <div className="relative z-10 flex items-center gap-4">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          selected ? "bg-indigo-600" : "bg-gray-400"
                        } opacity-80`}
                      />
                      <span className="text-sm font-black">
                        {dept.name.toUpperCase()}
                      </span>
                    </div>

                    {dept.consultationFee != null && (
                      <div className="relative z-10 text-sm font-black flex items-center gap-1">
                        <span className="px-3 py-1 rounded-xl bg-gray-200 dark:bg-gray-800 text-xs font-black">
                          ₹{dept.consultationFee}
                        </span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <Sparkles size={14} />
              Live estimate updates automatically after selecting date.
            </div>
          </motion.div>

          {/* Appointment Date */}
          <motion.div variants={sectionVariants} className="space-y-3">
            <label className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Appointment Date
            </label>

            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: MAX_ADVANCE_DAYS + 1 }).map((_, i) => {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                const value = formatDate(date);
                const selected = appointmentDate === value;

                return (
                  <motion.button
                    key={i}
                    {...cardHover}
                    type="button"
                    onClick={() => setAppointmentDate(value)}
                    className={`relative rounded-2xl border p-4 text-center transition-all overflow-hidden
                      ${
                        selected
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg scale-[1.03]"
                          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                  >
                    {selected && (
                      <motion.div
                        animate={{ opacity: [0.25, 0.5, 0.25] }}
                        transition={{ duration: 1.6, repeat: Infinity }}
                        className="absolute inset-0 pointer-events-none"
                      >
                        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-[60px] bg-white/25" />
                      </motion.div>
                    )}

                    <p className="relative z-10 text-[10px] font-black uppercase opacity-70">
                      {i === 0
                        ? "Today"
                        : i === 1
                        ? "Tomorrow"
                        : date.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>

                    <p className="relative z-10 text-xl font-black">
                      {date.getDate()}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            {/* Expected Token Preview */}
            {departmentId && appointmentDate && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="
                  mt-2
                  rounded-2xl border border-indigo-200 dark:border-indigo-900/40
                  bg-indigo-50 dark:bg-indigo-900/20
                  px-5 py-4
                  flex items-center justify-between
                "
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    Estimated Token : {appointmentDate}
                  </p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1">
                    If You Book Now, Token May Be
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <Sparkles size={14} />
                    Live estimate updates automatically
                  </div>

                  {selectedDepartment?.name && (
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                      <MapPin size={14} />
                      {selectedDepartment.name}
                    </div>
                  )}
                </div>

                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  #{previewLoading ? "…" : expectedTokenNumber ?? "--"}
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Priority */}
            <motion.div variants={sectionVariants} className="space-y-3">
            <label className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                Visit Priority
            </label>

            <div className="flex gap-2">
                {/* NORMAL */}
                <motion.button
                {...cardHover}
                type="button"
                onClick={() => setPriority("NORMAL")}
                className={`flex-1 rounded-xl border-2 py-3 text-xs font-black transition-all
                    ${
                    priority === "NORMAL"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                        : "border-transparent bg-gray-50 dark:bg-gray-900 text-gray-400"
                    }`}
                >
                Normal
                </motion.button>

                {/* SENIOR */}
                <motion.button
                {...cardHover}
                type="button"
                onClick={() => setPriority("SENIOR")}
                className={`flex-1 rounded-xl border-2 py-3 text-xs font-black transition-all
                    ${
                    priority === "SENIOR"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600"
                        : "border-transparent bg-gray-50 dark:bg-gray-900 text-gray-400"
                    }`}
                >
                Senior
                </motion.button>

                {/* EMERGENCY */}
                <motion.button
                {...cardHover}
                type="button"
                onClick={() => setPriority("EMERGENCY")}
                className={`flex-1 rounded-xl border-2 py-3 text-xs font-black transition-all
                    ${
                    priority === "EMERGENCY"
                        ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-600"
                        : "border-transparent bg-gray-50 dark:bg-gray-900 text-gray-400"
                    }`}
                >
                Emergency
                </motion.button>
            </div>

            <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Note
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Admin can book Normal, Senior, and Emergency priority.
                </p>
            </div>
            </motion.div>
        </motion.div>

        {/* Footer */}
        <div className="mt-2 flex gap-4 bg-[#0f172a] px-10 py-8 rounded-b-[2.5rem] border-t border-slate-800">
          <motion.button
            {...cardHover}
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl py-4 text-sm font-black tracking-wide
            text-slate-400 hover:text-white hover:bg-slate-800 transition-all 
            active:scale-95 border border-slate-700/50"
          >
            CANCEL
          </motion.button>

          <motion.button
            {...cardHover}
            type="button"
            disabled={!canConfirm || creating}
            onClick={handleConfirm}
            className={`relative flex-[1.5] rounded-2xl py-4 text-sm font-black tracking-widest uppercase
              transition-all overflow-hidden
              ${
                canConfirm
                  ? "bg-indigo-500 text-white shadow-[0_0_22px_rgba(99,102,241,0.35)] hover:bg-indigo-400 hover:-translate-y-1 active:scale-95"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }
              disabled:opacity-60
            `}
          >
            {canConfirm && !creating && (
              <motion.div
                animate={{ x: ["-120%", "140%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-y-0 left-0 w-1/3 bg-white/20 blur-xl rotate-12"
              />
            )}

            <span className="relative z-10">
              {creating ? "Creating..." : "Confirm Booking"}
            </span>
          </motion.button>
        </div>
      </BaseModal>
    </>
  );
};

export default AdminCreateTokenModal;

/* ---------------- Small UI Components ---------------- */

const StepCard = ({ step, title, status, active, color }) => {
  const activeStyles = {
    indigo:
      "border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-900/40",
    violet:
      "border-violet-200 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-900/40",
    fuchsia:
      "border-fuchsia-200 bg-fuchsia-50 dark:bg-fuchsia-950/20 dark:border-fuchsia-900/40",
    emerald:
      "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/40",
  };

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-left ${
        active
          ? activeStyles[color]
          : "border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        {step}
      </p>
      <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
        {title}
      </p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
        {status}
      </p>
    </div>
  );
};