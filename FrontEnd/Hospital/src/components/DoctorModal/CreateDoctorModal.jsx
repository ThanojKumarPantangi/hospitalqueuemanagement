import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  User,
  Mail,
  Hash,
  Building2,
  Check,
  Loader2,
  UserPlus,
  Briefcase,
} from "lucide-react";

/* =========================
   ANIMATION VARIANTS
   ========================= */
const overlayVars = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalVars = {
  hidden: { opacity: 0, y: 28, scale: 0.97, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 320, damping: 26 },
  },
  exit: {
    opacity: 0,
    y: 18,
    scale: 0.985,
    filter: "blur(6px)",
    transition: { duration: 0.18 },
  },
};

const containerVars = {
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.08 },
  },
};

const itemVars = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 220, damping: 20 },
  },
};

const shakeVars = {
  idle: { x: 0 },
  shake: {
    x: [0, -6, 6, -5, 5, -3, 3, 0],
    transition: { duration: 0.35 },
  },
};

/* =========================
   UI COMPONENTS
   ========================= */
const InputGroup = ({ label, error, children }) => (
  <motion.div variants={itemVars} className="space-y-1.5">
    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">
      {label}
    </label>

    {children}

    {error && (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs font-semibold text-rose-500 ml-1"
      >
        {error}
      </motion.p>
    )}
  </motion.div>
);

const StyledInput = ({ icon: Icon, error, ...props }) => (
  <div
    className={`
      group flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200
      bg-slate-50 dark:bg-slate-900/50
      ${
        error
          ? "border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-900/10 ring-2 ring-rose-500/10"
          : "border-slate-200 dark:border-slate-800 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:bg-white dark:focus-within:bg-slate-900"
      }
    `}
  >
    <Icon
      className={`w-5 h-5 transition-colors ${
        error
          ? "text-rose-500"
          : "text-slate-400 group-focus-within:text-blue-500"
      }`}
    />
    <input
      {...props}
      className="w-full bg-transparent outline-none text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400"
    />
  </div>
);

const DepartmentCard = ({ name, checked, onClick }) => (
  <motion.button
    variants={itemVars}
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    type="button"
    className={`
      relative flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 w-full group
      ${
        checked
          ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/25"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700"
      }
    `}
  >
    <div className="flex items-center gap-3 overflow-hidden">
      <div
        className={`
          p-2 rounded-xl flex items-center justify-center transition-colors border
          ${
            checked
              ? "bg-white/15 text-white border-white/15"
              : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20"
          }
        `}
      >
        <Briefcase className="w-4 h-4" />
      </div>

      <div className="min-w-0">
        <span
          className={`block text-xs font-black truncate ${
            checked ? "text-white" : "text-slate-700 dark:text-slate-200"
          }`}
        >
          {name}
        </span>
        <span
          className={`block text-[10px] font-semibold mt-0.5 truncate ${
            checked ? "text-white/80" : "text-slate-400"
          }`}
        >
          Assign doctor here
        </span>
      </div>
    </div>

    {checked ? (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="bg-white text-blue-600 rounded-full p-1"
      >
        <Check className="w-3 h-3 stroke-[3]" />
      </motion.div>
    ) : (
      <div className="h-6 w-6 rounded-full border border-slate-200 dark:border-slate-700" />
    )}
  </motion.button>
);

/* =========================
   MAIN COMPONENT
   ========================= */
const CreateDoctorModal = ({ open, onClose, onCreate, departments = [] }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    doctorRollNo: "",
    departmentIds: [],
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const selectedCount = form.departmentIds.length;

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Full name is required";
    if (!form.email.trim()) next.email = "Email address is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = "Invalid email format";

    if (!form.doctorRollNo.trim()) next.doctorRollNo = "ID/Roll Number is required";

    if (!Array.isArray(form.departmentIds) || form.departmentIds.length === 0)
      next.departmentIds = "At least one department is required";

    setErrors(next);

    const ok = Object.keys(next).length === 0;
    if (!ok) {
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
    return ok;
  };

  const toggleDepartment = (id) => {
    setForm((prev) => {
      const exists = prev.departmentIds.includes(id);
      return {
        ...prev,
        departmentIds: exists ? [] : [id], // ✅ single select preserved
      };
    });
  };

  const reset = () => {
    setForm({ name: "", email: "", doctorRollNo: "", departmentIds: [] });
    setErrors({});
    setSubmitting(false);
    setShake(false);
  };

  useEffect(() => {
    if (open) reset();
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open && !submitting) onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, submitting]);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validate()) return;

    try {
      setSubmitting(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        doctorRollNo: form.doctorRollNo.trim(),
        departmentIds: form.departmentIds,
      };

      await onCreate?.(payload);
      onClose?.();
    } catch (err) {
      console.log(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          variants={overlayVars}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={submitting ? undefined : onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          variants={modalVars}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-2xl bg-white dark:bg-slate-950 rounded-[28px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative flex-shrink-0 px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white/85 dark:bg-slate-950/80 backdrop-blur-md z-10 sticky top-0">
            {/* glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-10 -left-16 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="absolute -bottom-12 -right-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
            </div>

            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                  <UserPlus size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Create Doctor
                  </h2>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Add a new specialist to the system
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                disabled={submitting}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors disabled:opacity-60"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-x-hidden overflow-y-auto px-8 py-6 no-scrollbar">
            <motion.div
              variants={containerVars}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              {/* Personal Info */}
              <motion.div
                variants={shakeVars}
                animate={shake ? "shake" : "idle"}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputGroup label="Full Name" error={errors.name}>
                    <StyledInput
                      icon={User}
                      placeholder="e.g. Dr. Sarah Smith"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      error={errors.name}
                    />
                  </InputGroup>

                  <InputGroup label="Email Address" error={errors.email}>
                    <StyledInput
                      icon={Mail}
                      placeholder="doctor@hospital.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, email: e.target.value }))
                      }
                      error={errors.email}
                    />
                  </InputGroup>

                  <div className="md:col-span-2">
                    <InputGroup label="Roll Number / ID" error={errors.doctorRollNo}>
                      <StyledInput
                        icon={Hash}
                        placeholder="e.g. DOC-2024-001"
                        value={form.doctorRollNo}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, doctorRollNo: e.target.value }))
                        }
                        error={errors.doctorRollNo}
                      />
                    </InputGroup>
                  </div>
                </div>
              </motion.div>

              {/* Departments */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Building2 size={14} /> Department Selection
                  </span>

                  {selectedCount > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black border border-blue-100 dark:border-blue-900/30">
                      {selectedCount} Selected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(departments || []).map((d) => (
                    <DepartmentCard
                      key={d._id}
                      name={d.name}
                      checked={form.departmentIds.includes(d._id)}
                      onClick={() => toggleDepartment(d._id)}
                    />
                  ))}

                  {(departments || []).length === 0 && (
                    <div className="col-span-2 py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-sm font-semibold text-slate-400">
                        No departments available.
                      </p>
                    </div>
                  )}
                </div>

                {errors.departmentIds && (
                  <p className="text-xs font-bold text-rose-500 text-center">
                    {errors.departmentIds}
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-8 py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all disabled:opacity-50"
            >
              Cancel
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-2.5 rounded-2xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {submitting ? "Creating..." : "Confirm & Create"}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateDoctorModal;