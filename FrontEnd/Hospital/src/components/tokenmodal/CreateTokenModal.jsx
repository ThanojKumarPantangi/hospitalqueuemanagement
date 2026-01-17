import BaseModal from "./BaseModal";
import { CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";
import { User, AlertTriangle, Sparkles, ShieldCheck } from "lucide-react";

const CreateTokenModal = ({
  open,
  onClose,
  departments,
  departmentId,
  setDepartmentId,
  appointmentDate,
  setAppointmentDate,
  expectedTokenNumber,
  previewLoading,
  MAX_ADVANCE_DAYS,
  today,
  formatDate,
  priority,
  setPriority,
  creating,
  createToken,
}) => {
  const sectionVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
  };

  const cardHover = {
    whileHover: { y: -2, scale: 1.01 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring", stiffness: 240, damping: 18 },
  };

  const stepReadyDept = Boolean(departmentId);
  const stepReadyDate = Boolean(appointmentDate);
  const stepReadyPriority = Boolean(priority);

  return (
    <BaseModal open={open} onClose={onClose} maxWidth="max-w-2xl">
      {/* Top Gradient */}
      <div className="h-2 bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500" />

      {/* Header */}
      <div className="px-10 pt-10 pb-6 text-center">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center 
                     rounded-[2rem] bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg"
        >
          <CalendarIcon size={32} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-black"
        >
          Quick <span className="text-teal-600">Booking</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="mt-2 text-sm text-gray-500 font-medium"
        >
          Secure your spot in the queue instantly
        </motion.p>

        {/* Stepper strip (UI only) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-6 grid grid-cols-3 gap-3"
        >
          <div
            className={`rounded-2xl border px-4 py-3 text-left ${
              stepReadyDept
                ? "border-teal-200 bg-teal-50 dark:bg-teal-950/20 dark:border-teal-900/40"
                : "border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800"
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Step 1
            </p>
            <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
              Department
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              {stepReadyDept ? "Selected" : "Choose one"}
            </p>
          </div>

          <div
            className={`rounded-2xl border px-4 py-3 text-left ${
              stepReadyDate
                ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/40"
                : "border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800"
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Step 2
            </p>
            <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
              Date
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              {stepReadyDate ? appointmentDate : "Pick a day"}
            </p>
          </div>

          <div
            className={`rounded-2xl border px-4 py-3 text-left ${
              stepReadyPriority
                ? "border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-900/40"
                : "border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800"
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Step 3
            </p>
            <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
              Priority
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              {priority || "Select"}
            </p>
          </div>
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
        {/* Department Selector */}
        <motion.div variants={sectionVariants} className="space-y-3">
          <label
            className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] 
                       text-teal-600 dark:text-teal-400"
          >
            Select Department
          </label>

          <div className="grid gap-2">
            {departments.map((dept) => {
              const selected = departmentId === dept._id;

              return (
                <motion.button
                  key={dept._id}
                  {...cardHover}
                  onClick={() => setDepartmentId(dept._id)}
                  className={`relative flex items-center justify-between rounded-2xl border-2 p-4
                    transition-all active:scale-[0.97] overflow-hidden
                    ${
                      selected
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300"
                        : "border-transparent bg-gray-50 dark:bg-gray-900 text-gray-500"
                    }`}
                >
                  {/* subtle shine */}
                  {selected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[60px] bg-teal-400/20" />
                    </motion.div>
                  )}

                  <div className="relative z-10 flex items-center gap-4">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        selected ? "bg-teal-600" : "bg-gray-400"
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

          {/* Hint */}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck size={14} />
            Booking is protected and updated live.
          </div>
        </motion.div>

        {/* Appointment Date */}
        <motion.div variants={sectionVariants} className="space-y-3">
          <label
            className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] 
                       text-teal-600 dark:text-teal-400"
          >
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
                  onClick={() => setAppointmentDate(value)}
                  className={`relative rounded-2xl border p-4 text-center transition-all overflow-hidden
                    ${
                      selected
                        ? "bg-teal-500 border-teal-500 text-white shadow-lg scale-[1.03]"
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
                rounded-2xl border border-teal-200 dark:border-teal-900/40
                bg-teal-50 dark:bg-teal-900/20
                px-5 py-4
                flex items-center justify-between
              "
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Estimated Token : {appointmentDate}
                </p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1">
                  If You Book Now, Your Token May Be
                </p>

                <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                  <Sparkles size={14} />
                  Live estimate updates automatically
                </div>
              </div>

              <span className="text-3xl font-black text-teal-600 dark:text-teal-400">
                #{previewLoading ? "…" : expectedTokenNumber ?? "--"}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Priority */}
        <motion.div variants={sectionVariants} className="space-y-3">
          <label
            className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] 
                       text-teal-600 dark:text-teal-400"
          >
            Visit Priority
          </label>

          <div className="flex gap-2">
            <motion.button
              {...cardHover}
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

            <button
              disabled
              className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 
              text-xs font-bold text-gray-300 cursor-not-allowed flex items-center justify-center gap-1"
            >
              <User size={12} /> Senior
            </button>

            <button
              disabled
              className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 
              text-xs font-bold text-gray-300 cursor-not-allowed flex items-center justify-center gap-1"
            >
              <AlertTriangle size={12} /> Emergency
            </button>
          </div>

          {/* Helper strip */}
          <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Note
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Senior and Emergency priority are currently disabled in this version.
              Normal booking is instant and supports live updates.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <div className="mt-2 flex gap-4 bg-[#0f172a] px-10 py-8 rounded-b-[2.5rem] border-t border-slate-800">
        <motion.button
          {...cardHover}
          onClick={onClose}
          className="flex-1 rounded-2xl py-4 text-sm font-black tracking-wide
          text-slate-400 hover:text-white hover:bg-slate-800 transition-all 
          active:scale-95 border border-slate-700/50"
        >
          CANCEL
        </motion.button>

        <motion.button
          {...cardHover}
          disabled={creating}
          onClick={createToken}
          className="relative flex-[1.5] rounded-2xl py-4 text-sm font-black tracking-widest uppercase
          bg-indigo-500 text-white shadow-[0_0_22px_rgba(99,102,241,0.35)] 
          hover:bg-indigo-400 hover:-translate-y-1 active:scale-95 
          transition-all disabled:opacity-50 overflow-hidden"
        >
          {/* shimmer */}
          {!creating && (
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
  );
};

export default CreateTokenModal;