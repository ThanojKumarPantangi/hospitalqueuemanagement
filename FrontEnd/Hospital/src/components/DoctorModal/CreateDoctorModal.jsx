import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  User,
  Mail,
  Hash,
  Building2,
  CheckCircle2,
  Loader2,
} from "lucide-react";

/* =========================
   ANIMATION VARIANTS
   ========================= */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 320, damping: 26 },
  },
  exit: { opacity: 0, y: 18, scale: 0.985, transition: { duration: 0.18 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

/* =========================
   SMALL UI PARTS
   ========================= */
const Field = ({
  icon: Icon,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error,
}) => {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>

      <div
        className={`flex items-center gap-2 rounded-2xl border px-3.5 py-3 bg-white dark:bg-slate-950 transition
        ${
          error
            ? "border-rose-300 dark:border-rose-900 ring-2 ring-rose-500/15"
            : "border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-blue-500/15 focus-within:border-blue-300 dark:focus-within:border-blue-800"
        }`}
      >
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300">
          <Icon className="w-4 h-4" />
        </div>

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400"
        />
      </div>

      {error ? (
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
};

const DepartmentChip = ({ name, checked }) => {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-black transition
      ${
        checked
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
          : "bg-white text-slate-600 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800"
      }`}
    >
      <CheckCircle2
        className={`w-4 h-4 ${checked ? "opacity-100" : "opacity-30"}`}
      />
      {name}
    </div>
  );
};

/* =========================
   MAIN COMPONENT
   ========================= */
const CreateDoctorModal = ({
  open,
  onClose,
  onCreate,
  departments = [],
}) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    doctorRollNo: "",
    departmentIds: [],
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const selectedCount = form.departmentIds.length;

  const departmentMap = useMemo(() => {
    const map = new Map();
    (departments || []).forEach((d) => map.set(d._id, d));
    return map;
  }, [departments]);

  const validate = () => {
    const next = {};

    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = "Enter a valid email address";

    if (!form.doctorRollNo.trim()) next.doctorRollNo = "Doctor Roll No is required";

    if (!Array.isArray(form.departmentIds) || form.departmentIds.length === 0)
      next.departmentIds = "Select one department";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const toggleDepartment = (id) => {
    setForm((prev) => {
      const exists = prev.departmentIds.includes(id);
      return {
        ...prev,
        departmentIds: exists ? [] : [id],
      };
    });
  };

  const reset = () => {
    setForm({
      name: "",
      email: "",
      doctorRollNo: "",
      departmentIds: [],
    });
    setErrors({});
    setSubmitting(false);
  };

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

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
      // keep modal open if backend error happens
      console.log(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex items-center justify-center px-4 py-6"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/55 backdrop-blur-[7px]"
          onClick={submitting ? undefined : onClose}
        />

        {/* Modal */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-2xl rounded-[30px] overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 md:px-7 py-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
            </div>

            <div className="relative flex items-start justify-between gap-4">
              <div className="text-white">
                <h2 className="text-xl md:text-2xl font-black tracking-tight">
                  Create Doctor
                </h2>
                <p className="text-white/80 text-sm font-semibold mt-1">
                  Add a new doctor account and assign departments.
                </p>
              </div>

              <button
                onClick={onClose}
                disabled={submitting}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/20 border border-white/20 text-white transition disabled:opacity-60"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Small Info Row */}
            <div className="relative mt-4 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-black bg-white/12 text-white border-white/20 backdrop-blur-md">
                <Building2 className="w-4 h-4" />
                Departments selected: {selectedCount}
              </div>
            </div>
          </div>

          {/* Body (scrollable) */}
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="px-6 md:px-7 py-6"
          >
            <div className="max-h-[62vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  icon={User}
                  label="Name"
                  placeholder="Enter doctor name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  error={errors.name}
                />

                <Field
                  icon={Mail}
                  label="Email"
                  placeholder="doctor@example.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  type="email"
                  error={errors.email}
                />

                <div className="md:col-span-2">
                  <Field
                    icon={Hash}
                    label="Doctor Roll No"
                    placeholder="e.g. DOC123"
                    value={form.doctorRollNo}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, doctorRollNo: e.target.value }))
                    }
                    error={errors.doctorRollNo}
                  />
                </div>
              </div>

              {/* Departments */}
              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black">
                    <Building2 className="w-5 h-5 text-indigo-500" />
                    Departments
                  </div>

                  {errors.departmentIds ? (
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      {errors.departmentIds}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">
                      Select one
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(departments || []).length ? (
                    departments.map((d) => {
                      const checked = form.departmentIds.includes(d._id);
                      return (
                        <button
                          key={d._id}
                          type="button"
                          onClick={() => toggleDepartment(d._id)}
                          className="text-left"
                        >
                          <DepartmentChip name={d.name} checked={checked} />
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4">
                      No departments found.
                    </div>
                  )}
                </div>

                {/* Selected Preview */}
                {selectedCount > 0 && (
                  <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Selected
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.departmentIds.map((id) => (
                        <span
                          key={id}
                          className="px-3 py-1.5 rounded-xl text-xs font-black bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
                        >
                          {departmentMap.get(id)?.name || "Unknown"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-sm font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl text-sm font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition disabled:opacity-60 inline-flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Doctor"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateDoctorModal;
