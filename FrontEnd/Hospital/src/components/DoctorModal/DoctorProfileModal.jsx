import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Stethoscope,
  BadgeCheck,
  ShieldAlert,
  Clock,
  Building2,
  GraduationCap,
  FileText,
  Activity,
  PhoneCall,
  Hash,
  Sparkles,
  BriefcaseMedical,
  CalendarDays,
  BadgeInfo,
  Pencil,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  ChevronDown,
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
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 320, damping: 26 },
  },
  exit: { opacity: 0, y: 18, scale: 0.985, transition: { duration: 0.18 } },
};

const contentVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.03 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

const pillVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.06 + i * 0.03, duration: 0.22 },
  }),
};

/* =========================
   HELPERS
   ========================= */
const OPD_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAYS = [
  { value: "MON", label: "Mon" },
  { value: "TUE", label: "Tue" },
  { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" },
  { value: "FRI", label: "Fri" },
  { value: "SAT", label: "Sat" },
  { value: "SUN", label: "Sun" },
];

const safeUpper = (val) => (val ? String(val).toUpperCase() : "");

const getStatusBadge = (user) => {
  if (!user?.isVerified) {
    return {
      label: "Pending Verification",
      icon: ShieldAlert,
      className:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
    };
  }
  if (!user?.isActive) {
    return {
      label: "Inactive / Suspended",
      icon: Activity,
      className:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700",
    };
  }
  if (user?.isActive && !user?.isAvailable) {
    return {
      label: "On Leave",
      icon: Clock,
      className:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
    };
  }
  return {
    label: "Active & Available",
    icon: BadgeCheck,
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  };
};

// const formatDay = (day) => {
//   const map = {
//     MON: "Mon",
//     TUE: "Tue",
//     WED: "Wed",
//     THU: "Thu",
//     FRI: "Fri",
//     SAT: "Sat",
//     SUN: "Sun",
//   };
//   return map[day] || day;
// };

const normalizeTime = (val) => {
  if (!val) return "";
  const m = String(val).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return String(val);
  const hh = String(m[1]).padStart(2, "0");
  const mm = String(m[2]).padStart(2, "0");
  return `${hh}:${mm}`;
};

const safeNum = (v) => {
  if (v === "" || v === null || typeof v === "undefined") return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
};

const cloneProfileToForm = (profile) => {
  return {
    bio: profile?.bio || "",
    specialization: profile?.specialization || "",
    experienceYears:
      typeof profile?.experienceYears === "number" ? profile.experienceYears : "",
    qualifications: Array.isArray(profile?.qualifications)
      ? profile.qualifications
      : [],
    opdTimings: Array.isArray(profile?.opdTimings) ? profile.opdTimings : [],
    department: profile?.department || null, // can be object (populate)
  };
};

const sortOpd = (list) => {
  const arr = Array.isArray(list) ? list : [];
  return [...arr].sort(
    (a, b) => OPD_ORDER.indexOf(a.day) - OPD_ORDER.indexOf(b.day)
  );
};

/* =========================
   SMALL UI PARTS
   ========================= */
const InfoChip = ({ icon: Icon, children }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold bg-white/12 text-white border-white/20 backdrop-blur-md shadow-sm">
      <Icon className="w-4 h-4 opacity-90" />
      <span className="leading-none">{children}</span>
    </div>
  );
};

const StatMiniCard = ({ icon: Icon, label, value, subtle }) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <div className="mt-1 text-sm md:text-[15px] font-black text-slate-900 dark:text-white">
            {value}
          </div>
          {subtle ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtle}
            </p>
          ) : null}
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300">
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
    </motion.div>
  );
};

const SkeletonLine = ({ w = "w-full" }) => (
  <div
    className={`${w} h-3 rounded-full bg-slate-200/70 dark:bg-slate-800/70 animate-pulse`}
  />
);

const SkeletonPill = () => (
  <div className="h-8 w-20 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
);

const FieldLabel = ({ icon: Icon, title, right }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black">
      <Icon className="w-5 h-5" />
      {title}
    </div>
    {right ? right : null}
  </div>
);

const TextInput = ({ value, onChange, placeholder, disabled = false }) => (
  <input
    value={value}
    onChange={(e) => onChange?.(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:opacity-60"
  />
);

const TextArea = ({ value, onChange, placeholder, disabled = false }) => (
  <textarea
    value={value}
    onChange={(e) => onChange?.(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    rows={5}
    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:opacity-60 resize-none"
  />
);

const SmallBtn = ({ icon: Icon, label, onClick, variant = "neutral", disabled }) => {
  const base =
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black border transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = {
    neutral:
      "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900",
    primary:
      "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 shadow-lg shadow-blue-500/20",
    danger:
      "bg-rose-600 border-rose-600 text-white hover:bg-rose-700 hover:border-rose-700 shadow-lg shadow-rose-500/20",
    ghost:
      "bg-transparent border-white/20 text-white hover:bg-white/10",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]}`}
    >
      {Icon ? <Icon className="w-4.5 h-4.5" /> : null}
      {label}
    </button>
  );
};

const SelectField = ({
  value,
  onChange,
  disabled,
  options = [],
  placeholder = "Select...",
}) => {
  return (
    <div className="relative">
      <select
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none px-4 py-3 pr-10 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:opacity-60"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
    </div>
  );
};

/* =========================
   MAIN COMPONENT
   ========================= */
const DoctorProfileModal = ({
  open,
  onClose,
  doctorData,
  loading = false,
  departments = [], // ✅ NEW
  onSave,
}) => {
  // ✅ KEEP SAME API SHAPE
  const user = doctorData?.profile?.user;
  const profile = doctorData?.profile?.profile;

  const status = useMemo(() => getStatusBadge(user), [user]);
  const StatusIcon = status.icon;

  const initials = useMemo(() => {
    const name = user?.name || "Doctor";
    return name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
  }, [user?.name]);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(() => cloneProfileToForm(profile));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(cloneProfileToForm(profile));
    setEditMode(false);
    setSaving(false);
  }, [profile?._id,profile]);

  const opdSorted = useMemo(() => {
    return sortOpd(form?.opdTimings);
  }, [form?.opdTimings]);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const hasChanges = useMemo(() => {
    const original = cloneProfileToForm(profile);
    const current = form;
    return JSON.stringify(original) !== JSON.stringify(current);
  }, [profile, form]);

  const departmentOptions = useMemo(() => {
    const list = Array.isArray(departments) ? departments : [];
    return list.map((d) => ({
      value: d._id,
      label: d.name,
      meta: d,
    }));
  }, [departments]);

  const selectedDepartmentId = useMemo(() => {
    // form.department might be object or id
    if (!form?.department) return "";
    if (typeof form.department === "string") return form.department;
    return form.department?._id || "";
  }, [form?.department]);

  const selectedDepartmentMeta = useMemo(() => {
    if (!selectedDepartmentId) return null;
    return (departments || []).find((d) => d._id === selectedDepartmentId) || null;
  }, [departments, selectedDepartmentId]);

  const handleReset = () => setForm(cloneProfileToForm(profile));

  const handleAddQualification = () => {
    setForm((prev) => ({
      ...prev,
      qualifications: [...(prev.qualifications || []), ""],
    }));
  };

  const handleRemoveQualification = (index) => {
    setForm((prev) => ({
      ...prev,
      qualifications: (prev.qualifications || []).filter((_, i) => i !== index),
    }));
  };

  const handleQualificationChange = (index, value) => {
    setForm((prev) => {
      const next = [...(prev.qualifications || [])];
      next[index] = value;
      return { ...prev, qualifications: next };
    });
  };

  const handleAddSlot = () => {
    setForm((prev) => ({
      ...prev,
      opdTimings: [
        ...(prev.opdTimings || []),
        { day: "MON", startTime: "10:00", endTime: "13:00" },
      ],
    }));
  };

  const handleRemoveSlot = (index) => {
    setForm((prev) => ({
      ...prev,
      opdTimings: (prev.opdTimings || []).filter((_, i) => i !== index),
    }));
  };

  const handleSlotChange = (index, key, value) => {
    setForm((prev) => {
      const next = [...(prev.opdTimings || [])];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, opdTimings: next };
    });
  };

  const buildPayload = () => {
    return {
      bio: form.bio.trim(),
      specialization: form.specialization.trim(),
      experienceYears: safeNum(form.experienceYears),
      qualifications: (form.qualifications || [])
        .map((q) => String(q || "").trim())
        .filter(Boolean),
      opdTimings: (form.opdTimings || []).map((t) => ({
        day: t.day,
        startTime: normalizeTime(t.startTime),
        endTime: normalizeTime(t.endTime),
      })),
      department: selectedDepartmentId.trim() || undefined, // ✅ NOW EDITABLE
    };
  };

  const handleSave = async () => {
    if (!onSave) return;

    try {
      setSaving(true);
      const payload = buildPayload();
      await onSave(payload);
      setEditMode(false);
    } catch (err) {
      console.log(err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] px-4 py-6 overflow-y-auto"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div
          className="fixed inset-0 bg-black/55 backdrop-blur-[7px]"
          onClick={saving ? undefined : onClose}
        />

        <div className="relative min-h-full flex items-start justify-center">
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-[30px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-blue-500/15 blur-3xl" />
              <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-purple-500/15 blur-3xl" />
            </div>

            {/* Sticky Header */}
            <div className="sticky top-0 z-30">
              <div className="relative px-6 md:px-7 pt-6 md:pt-7 pb-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
                  <div className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
                </div>

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-black text-xl shadow-lg">
                        {loading ? (
                          <div className="w-8 h-8 rounded-xl bg-white/20 animate-pulse" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-[3px] border-white/30 bg-white/15 backdrop-blur-md flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white/90" />
                      </div>
                    </div>

                    <div className="text-white">
                      <h2 className="text-xl md:text-2xl font-black tracking-tight">
                        {loading ? (
                          <div className="h-6 w-48 rounded-lg bg-white/20 animate-pulse" />
                        ) : (
                          <>DR {safeUpper(user?.name || "DOCTOR")}</>
                        )}
                      </h2>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <InfoChip icon={Hash}>
                          {loading ? "..." : user?.doctorRollNo || "N/A"}
                        </InfoChip>

                        <InfoChip icon={Stethoscope}>
                          {loading
                            ? "Loading..."
                            : profile?.specialization || "Specialization N/A"}
                        </InfoChip>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!loading && (
                      <>
                        {!editMode ? (
                          <SmallBtn
                            icon={Pencil}
                            label="Edit"
                            variant="ghost"
                            onClick={() => setEditMode(true)}
                          />
                        ) : (
                          <>
                            <SmallBtn
                              icon={RotateCcw}
                              label="Reset"
                              variant="ghost"
                              onClick={handleReset}
                              disabled={saving}
                            />
                            <SmallBtn
                              icon={Save}
                              label={saving ? "Saving..." : "Save"}
                              variant="ghost"
                              onClick={handleSave}
                              disabled={saving || !hasChanges || !onSave}
                            />
                          </>
                        )}
                      </>
                    )}

                    <button
                      onClick={saving ? undefined : onClose}
                      className="p-2 rounded-xl bg-white/15 hover:bg-white/20 border border-white/20 text-white transition"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="relative mt-5 flex flex-wrap gap-2">
                  <div
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold ${status.className}`}
                  >
                    <StatusIcon className="w-4 h-4" />
                    {loading ? "Checking..." : status.label}
                  </div>

                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold bg-white/12 text-white border-white/20 backdrop-blur-md">
                    <Building2 className="w-4 h-4" />
                    {loading
                      ? "..."
                      : profile?.department?.name || "Department N/A"}
                  </div>

                  {typeof profile?.department?.consultationFee !== "undefined" && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold bg-white/12 text-white border-white/20 backdrop-blur-md">
                      <PhoneCall className="w-4 h-4" />
                      Fee: ₹{profile?.department?.consultationFee}
                    </div>
                  )}

                  {typeof profile?.department?.slotDurationMinutes !== "undefined" && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold bg-white/12 text-white border-white/20 backdrop-blur-md">
                      <Clock className="w-4 h-4" />
                      Slot: {profile?.department?.slotDurationMinutes} mins
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 md:px-7 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <StatMiniCard
                    icon={BriefcaseMedical}
                    label="Experience"
                    value={
                      loading
                        ? "Loading..."
                        : typeof profile?.experienceYears === "number"
                        ? `${profile.experienceYears} years`
                        : "N/A"
                    }
                    subtle="Clinical practice"
                  />
                  <StatMiniCard
                    icon={BadgeInfo}
                    label="Account"
                    value={loading ? "Loading..." : user?.isActive ? "Enabled" : "Disabled"}
                    subtle="Access status"
                  />
                  <StatMiniCard
                    icon={CalendarDays}
                    label="Availability"
                    value={
                      loading
                        ? "Loading..."
                        : user?.isAvailable
                        ? "Available"
                        : "Not available"
                    }
                    subtle="Token receiving"
                  />
                </div>

                {editMode && (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Edit mode enabled — update fields and click{" "}
                      <span className="text-slate-900 dark:text-white">Save</span>
                    </div>

                    <div
                      className={`text-xs font-black px-3 py-1 rounded-full border ${
                        hasChanges
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
                          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800"
                      }`}
                    >
                      {hasChanges ? "Unsaved changes" : "No changes"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable BODY */}
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="relative p-6 md:p-7 overflow-y-auto max-h-[calc(92vh-240px)]"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Professional + Department */}
                <motion.div
                  variants={sectionVariants}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-5"
                >
                  <FieldLabel
                    icon={Stethoscope}
                    title="Professional Details"
                    right={
                      <span className="text-[11px] font-black px-3 py-1 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                        Editable
                      </span>
                    }
                  />

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                        Specialization
                      </div>
                      <TextInput
                        value={form.specialization}
                        onChange={(v) => setForm((p) => ({ ...p, specialization: v }))}
                        placeholder="Eg: ORTHO"
                        disabled={!editMode || loading || saving}
                      />
                    </div>

                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                        Experience (Years)
                      </div>
                      <TextInput
                        value={form.experienceYears}
                        onChange={(v) => setForm((p) => ({ ...p, experienceYears: v }))}
                        placeholder="Eg: 5"
                        disabled={!editMode || loading || saving}
                      />
                    </div>

                    {/* ✅ DEPARTMENT FIELD ADDED */}
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                        Department
                      </div>

                      {!editMode ? (
                        <div className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {profile?.department?.name || "Department N/A"}
                        </div>
                      ) : (
                        <SelectField
                          value={selectedDepartmentId}
                          onChange={(deptId) => {
                            // store as id (simple + safe)
                            setForm((p) => ({ ...p, department: deptId }));
                          }}
                          disabled={loading || saving}
                          options={departmentOptions}
                          placeholder="Select Department"
                        />
                      )}

                      {/* optional preview of fee/slot when selecting */}
                      {editMode && selectedDepartmentMeta && (
                        <div className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                          Fee: ₹{selectedDepartmentMeta.consultationFee ?? "N/A"} • Slot:{" "}
                          {selectedDepartmentMeta.slotDurationMinutes ?? "N/A"} mins
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Bio */}
                <motion.div
                  variants={sectionVariants}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-5"
                >
                  <FieldLabel
                    icon={FileText}
                    title="About Doctor"
                    right={
                      <span className="text-[11px] font-black px-3 py-1 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                        Bio
                      </span>
                    }
                  />

                  <div className="mt-4">
                    {loading ? (
                      <div className="space-y-2">
                        <SkeletonLine />
                        <SkeletonLine />
                        <SkeletonLine w="w-2/3" />
                      </div>
                    ) : (
                      <TextArea
                        value={form.bio}
                        onChange={(v) => setForm((p) => ({ ...p, bio: v }))}
                        placeholder="Write something about the doctor..."
                        disabled={!editMode || saving}
                      />
                    )}
                  </div>
                </motion.div>
              </div>

              {/* QUALIFICATIONS */}
              <motion.div
                variants={sectionVariants}
                className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden"
              >
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black">
                    <GraduationCap className="w-5 h-5 text-indigo-500" />
                    Qualifications
                  </div>

                  {editMode && (
                    <SmallBtn
                      icon={Plus}
                      label="Add"
                      variant="primary"
                      onClick={handleAddQualification}
                      disabled={saving}
                    />
                  )}
                </div>

                <div className="p-5">
                  {loading ? (
                    <div className="flex flex-wrap gap-2">
                      <SkeletonPill />
                      <SkeletonPill />
                      <SkeletonPill />
                    </div>
                  ) : (form.qualifications || []).length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(form.qualifications || []).map((q, i) => (
                        <motion.div
                          key={`${q}-${i}`}
                          variants={pillVariants}
                          initial="hidden"
                          animate="visible"
                          custom={i}
                          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 flex items-center gap-3"
                        >
                          <div className="flex-1">
                            <TextInput
                              value={q}
                              onChange={(v) => handleQualificationChange(i, v)}
                              placeholder="Eg: MBBS"
                              disabled={!editMode || saving}
                            />
                          </div>

                          {editMode && (
                            <button
                              onClick={() => handleRemoveQualification(i)}
                              className="p-3 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition"
                              title="Remove qualification"
                              disabled={saving}
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No qualifications added.
                    </div>
                  )}
                </div>
              </motion.div>

              {/* OPD Timings */}
              <motion.div
                variants={sectionVariants}
                className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden"
              >
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black">
                    <Clock className="w-5 h-5 text-emerald-500" />
                    OPD Timings
                  </div>

                  {editMode && (
                    <SmallBtn
                      icon={Plus}
                      label="Add Slot"
                      variant="primary"
                      onClick={handleAddSlot}
                      disabled={saving}
                    />
                  )}
                </div>

                <div className="p-5">
                  {opdSorted?.length ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {opdSorted.map((t, i) => (
                        <motion.div
                          key={`${t.day}-${t.startTime}-${i}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 + i * 0.03 }}
                          whileHover={{ y: -2 }}
                          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                              Slot #{i + 1}
                            </div>

                            {editMode && (
                              <button
                                onClick={() => {
                                  const originalIndex = (form.opdTimings || []).findIndex(
                                    (x) =>
                                      x.day === t.day &&
                                      x.startTime === t.startTime &&
                                      x.endTime === t.endTime
                                  );
                                  if (originalIndex >= 0) handleRemoveSlot(originalIndex);
                                }}
                                className="px-4 py-2 rounded-2xl text-sm font-black border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition inline-flex items-center gap-2"
                                disabled={saving}
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                                Day
                              </div>
                              <select
                                value={t.day}
                                disabled={!editMode || saving}
                                onChange={(e) => {
                                  const originalIndex = (form.opdTimings || []).findIndex(
                                    (x) =>
                                      x.day === t.day &&
                                      x.startTime === t.startTime &&
                                      x.endTime === t.endTime
                                  );
                                  if (originalIndex >= 0) {
                                    handleSlotChange(originalIndex, "day", e.target.value);
                                  }
                                }}
                                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25 disabled:opacity-60"
                              >
                                {DAYS.map((d) => (
                                  <option key={d.value} value={d.value}>
                                    {d.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                                Start Time
                              </div>
                              <TextInput
                                value={normalizeTime(t.startTime)}
                                onChange={(v) => {
                                  const originalIndex = (form.opdTimings || []).findIndex(
                                    (x) =>
                                      x.day === t.day &&
                                      x.startTime === t.startTime &&
                                      x.endTime === t.endTime
                                  );
                                  if (originalIndex >= 0) {
                                    handleSlotChange(originalIndex, "startTime", v);
                                  }
                                }}
                                placeholder="10:00"
                                disabled={!editMode || saving}
                              />
                            </div>

                            <div>
                              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                                End Time
                              </div>
                              <TextInput
                                value={normalizeTime(t.endTime)}
                                onChange={(v) => {
                                  const originalIndex = (form.opdTimings || []).findIndex(
                                    (x) =>
                                      x.day === t.day &&
                                      x.startTime === t.startTime &&
                                      x.endTime === t.endTime
                                  );
                                  if (originalIndex >= 0) {
                                    handleSlotChange(originalIndex, "endTime", v);
                                  }
                                }}
                                placeholder="13:00"
                                disabled={!editMode || saving}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No OPD timings added.
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Footer */}
              <motion.div
                variants={sectionVariants}
                className="mt-6 flex items-center justify-between gap-3"
              >
                <button
                  onClick={saving ? undefined : onClose}
                  className="px-4 py-2.5 rounded-2xl text-sm font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition"
                >
                  Close
                </button>

                {editMode && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        handleReset();
                        setEditMode(false);
                      }}
                      disabled={saving}
                      className="px-4 py-2.5 rounded-2xl text-sm font-black bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition disabled:opacity-60"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={saving || !hasChanges || !onSave}
                      className="px-5 py-2.5 rounded-2xl text-sm font-black bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 hover:border-blue-700 shadow-lg shadow-blue-500/20 transition disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DoctorProfileModal;
