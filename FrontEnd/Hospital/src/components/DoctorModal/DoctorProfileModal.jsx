import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from "framer-motion";
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
  BriefcaseMedical,
  CalendarDays,
  Pencil,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Info,
} from "lucide-react";

/* =========================
   ANIMATION VARIANTS
   ========================= */
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.965, y: 18, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 320, damping: 26 },
  },
  exit: { opacity: 0, scale: 0.97, y: 14, filter: "blur(8px)", transition: { duration: 0.18 } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 210, damping: 20 },
  },
};

const softPop = {
  rest: { y: 0 },
  hover: { y: -2 },
  tap: { scale: 0.98 },
};

/* =========================
   HELPERS (Preserved Logic)
   ========================= */
const OPD_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAYS = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
  { value: "SAT", label: "Saturday" },
  { value: "SUN", label: "Sunday" },
];

const cn = (...classes) => classes.filter(Boolean).join(" ");

const safeUpper = (val) => (val ? String(val).toUpperCase() : "");

const getStatusBadge = (user) => {
  if (!user?.isVerified) {
    return {
      label: "Pending Verification",
      icon: ShieldAlert,
      colorClass:
        "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
      dotClass: "bg-amber-500",
    };
  }
  if (!user?.isActive) {
    return {
      label: "Inactive",
      icon: Activity,
      colorClass:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
      dotClass: "bg-slate-500",
    };
  }
  if (user?.isActive && !user?.isAvailable) {
    return {
      label: "On Leave",
      icon: Clock,
      colorClass:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
      dotClass: "bg-blue-500",
    };
  }
  return {
    label: "Active",
    icon: BadgeCheck,
    colorClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  };
};

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

const cloneProfileToForm = (profile) => ({
  bio: profile?.bio || "",
  specialization: profile?.specialization || "",
  experienceYears: typeof profile?.experienceYears === "number" ? profile.experienceYears : "",
  qualifications: Array.isArray(profile?.qualifications) ? profile.qualifications : [],
  opdTimings: Array.isArray(profile?.opdTimings) ? profile.opdTimings : [],
  department: profile?.department || null,
});

const sortOpd = (list) => {
  const arr = Array.isArray(list) ? list : [];
  return [...arr].sort((a, b) => OPD_ORDER.indexOf(a.day) - OPD_ORDER.indexOf(b.day));
};

/* =========================
   UI COMPONENTS
   ========================= */

const SectionCard = ({ title, icon: Icon, subtitle, right, children }) => (
  <div className="relative rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 shadow-sm overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-blue-400 via-indigo-300 to-cyan-300 dark:opacity-10" />
      <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full blur-3xl opacity-15 bg-gradient-to-br from-rose-300 via-amber-200 to-purple-300 dark:opacity-10" />
    </div>

    <div className="relative px-5 py-4 border-b border-slate-100 dark:border-slate-900 bg-white/70 dark:bg-slate-950/50 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center justify-center">
              <Icon size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {title}
              </p>
              {subtitle ? (
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>

    <div className="relative p-5">{children}</div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, subLabel }) => (
  <div className="relative p-4 rounded-2xl bg-white/80 border border-slate-200/70 shadow-sm dark:bg-slate-950/40 dark:border-slate-800 overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-15 bg-gradient-to-br from-blue-400 via-indigo-300 to-cyan-300 dark:opacity-10" />
    </div>

    <div className="relative flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200 border border-slate-200/70 dark:border-slate-800">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-widest">
          {label}
        </p>
        <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
          {value}
        </p>
        {subLabel ? (
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
            {subLabel}
          </p>
        ) : null}
      </div>
    </div>
  </div>
);

const InputWrapper = ({ label, icon: Icon, hint, children, className = "" }) => (
  <div className={cn("space-y-1.5", className)}>
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-slate-400" />}
        <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      </div>

      {hint ? (
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
          <Info size={12} />
          {hint}
        </span>
      ) : null}
    </div>
    {children}
  </div>
);

const StyledInput = ({ disabled, className = "", ...props }) => (
  <input
    disabled={disabled}
    className={cn(
      "w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all outline-none",
      disabled
        ? "bg-transparent border border-transparent text-slate-800 dark:text-slate-200 px-0"
        : "bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-950 dark:border-slate-800 dark:text-white",
      "placeholder:text-slate-400",
      className
    )}
    {...props}
  />
);

const StyledSelect = ({ disabled, className = "", ...props }) => (
  <div className="relative">
    <select
      disabled={disabled}
      className={cn(
        "w-full appearance-none px-4 py-3 rounded-xl text-sm font-semibold transition-all outline-none",
        disabled
          ? "bg-transparent border-none text-slate-800 dark:text-slate-200 px-0 cursor-default"
          : "bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white cursor-pointer pr-10",
        className
      )}
      {...props}
    />
    {!disabled && (
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    )}
  </div>
);

const MiniBadge = ({ icon: Icon, text, tone = "slate" }) => {
  const toneMap = {
    slate: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50",
    emerald:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/50",
    amber:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/50",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-widest",
        toneMap[tone] || toneMap.slate
      )}
    >
      {Icon ? <Icon size={12} /> : null}
      {text}
    </span>
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
  departments = [],
  onSave,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const user = doctorData?.profile?.user;
  const profile = doctorData?.profile?.profile;

  const status = useMemo(() => getStatusBadge(user), [user]);

  const initials = useMemo(() => {
    const name = user?.name || "Dr";
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
  }, [user?.name]);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(() => cloneProfileToForm(profile));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(cloneProfileToForm(profile));
    setEditMode(false);
    setSaving(false);
  }, [profile?._id, profile]);

  const opdSorted = useMemo(() => sortOpd(form?.opdTimings), [form?.opdTimings]);

  const hasChanges = useMemo(() => {
    const original = cloneProfileToForm(profile);
    const current = form;
    return JSON.stringify(original) !== JSON.stringify(current);
  }, [profile, form]);

  // Department Logic
  const departmentOptions = useMemo(
    () => departments.map((d) => ({ value: d._id, label: d.name, meta: d })),
    [departments]
  );
  const selectedDepartmentId = useMemo(
    () => (typeof form?.department === "string" ? form.department : form.department?._id || ""),
    [form?.department]
  );
  const selectedDepartmentMeta = useMemo(
    () => departments.find((d) => d._id === selectedDepartmentId) || null,
    [departments, selectedDepartmentId]
  );

  // Handlers (LOGIC UNCHANGED)
  const handleReset = () => setForm(cloneProfileToForm(profile));
  const handleAddQualification = () =>
    setForm((p) => ({ ...p, qualifications: [...(p.qualifications || []), ""] }));
  const handleRemoveQualification = (idx) =>
    setForm((p) => ({ ...p, qualifications: p.qualifications.filter((_, i) => i !== idx) }));
  const handleQualificationChange = (idx, val) =>
    setForm((p) => {
      const n = [...p.qualifications];
      n[idx] = val;
      return { ...p, qualifications: n };
    });

  const handleAddSlot = () =>
    setForm((p) => ({
      ...p,
      opdTimings: [...(p.opdTimings || []), { day: "MON", startTime: "09:00", endTime: "12:00" }],
    }));
  const handleRemoveSlot = (idx) =>
    setForm((p) => ({ ...p, opdTimings: p.opdTimings.filter((_, i) => i !== idx) }));
  const handleSlotChange = (idx, key, val) =>
    setForm((p) => {
      const n = [...p.opdTimings];
      n[idx] = { ...n[idx], [key]: val };
      return { ...p, opdTimings: n };
    });

  const handleSave = async () => {
    if (!onSave) return;
    try {
      setSaving(true);
      await onSave({
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
        department: selectedDepartmentId.trim() || undefined,
      });
      setEditMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ESC Close (UI only)
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !saving) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={!saving ? onClose : undefined}
          className="absolute inset-0 bg-slate-900/65 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "relative w-full max-w-5xl h-[90vh]",
            "bg-white dark:bg-slate-950",
            "rounded-[2rem] shadow-2xl overflow-hidden",
            "border border-slate-200 dark:border-slate-800",
            "flex flex-col"
          )}
        >
          {/* Decorative background */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full blur-3xl opacity-25 bg-gradient-to-br from-blue-400 via-indigo-300 to-cyan-300 dark:opacity-15" />
            <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-rose-300 via-amber-200 to-purple-300 dark:opacity-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
          </div>

          {/* --- Header --- */}
          <div className="relative shrink-0 z-20 bg-white/75 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/25">
                {loading ? (
                  <div className="w-6 h-6 rounded-full bg-white/20 animate-pulse" />
                ) : (
                  initials
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white truncate">
                    {loading ? "Loading..." : `Dr. ${safeUpper(user?.name)}`}
                  </h2>
                  <span className={cn("flex h-2 w-2 rounded-full", status.dotClass)} />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  <span className="truncate">ID: {user?.doctorRollNo || "---"}</span>
                  <span className="opacity-50">•</span>

                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-widest",
                      status.colorClass
                    )}
                  >
                    {status.label}
                  </span>

                  {user?.isVerified ? (
                    <MiniBadge icon={ShieldCheck} text="Verified" tone="emerald" />
                  ) : (
                    <MiniBadge icon={ShieldAlert} text="Not Verified" tone="amber" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!loading && (
                <>
                  {editMode ? (
                    <>
                      <motion.button
                        variants={softPop}
                        initial="rest"
                        whileHover={!prefersReducedMotion ? "hover" : "rest"}
                        whileTap={!prefersReducedMotion ? "tap" : "rest"}
                        disabled={saving}
                        onClick={handleReset}
                        className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                        title="Reset Changes"
                        type="button"
                      >
                        <RotateCcw size={18} />
                      </motion.button>

                      <motion.button
                        variants={softPop}
                        initial="rest"
                        whileHover={!saving && !prefersReducedMotion ? "hover" : "rest"}
                        whileTap={!saving && !prefersReducedMotion ? "tap" : "rest"}
                        disabled={saving || !hasChanges}
                        onClick={handleSave}
                        className={cn(
                          "flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm text-white shadow-lg transition-all",
                          hasChanges
                            ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 hover:-translate-y-0.5"
                            : "bg-slate-300 dark:bg-slate-800 cursor-not-allowed shadow-none"
                        )}
                        type="button"
                      >
                        {saving ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        {saving ? "Saving..." : "Save Changes"}
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      variants={softPop}
                      initial="rest"
                      whileHover={!prefersReducedMotion ? "hover" : "rest"}
                      whileTap={!prefersReducedMotion ? "tap" : "rest"}
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-800"
                      type="button"
                    >
                      <Pencil size={16} />
                      Edit Profile
                    </motion.button>
                  )}
                </>
              )}

              <motion.button
                variants={softPop}
                initial="rest"
                whileHover={!prefersReducedMotion ? "hover" : "rest"}
                whileTap={!prefersReducedMotion ? "tap" : "rest"}
                onClick={!saving ? onClose : undefined}
                className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-900 transition-colors"
                type="button"
              >
                <X size={20} />
              </motion.button>
            </div>
          </div>

          {/* --- Scrollable Content --- */}
          <div className="relative flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 p-6 custom-scrollbar">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-4xl mx-auto space-y-6"
            >
              {/* 1. Stats Row */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  icon={BriefcaseMedical}
                  label="Experience"
                  value={`${profile?.experienceYears || 0} Years`}
                  subLabel="Clinical Practice"
                />
                <StatCard
                  icon={CalendarDays}
                  label="Availability"
                  value={user?.isAvailable ? "Available" : "Unavailable"}
                  subLabel={opdSorted.length > 0 ? `${opdSorted.length} Active Slots` : "No slots configured"}
                />
                <StatCard
                  icon={Building2}
                  label="Department"
                  value={profile?.department?.name || "Unassigned"}
                  subLabel={profile?.department?.consultationFee ? `₹${profile.department.consultationFee} / Visit` : null}
                />
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Bio */}
                  <motion.div variants={itemVariants}>
                    <SectionCard
                      title="About Doctor"
                      icon={FileText}
                      subtitle="Professional bio / summary"
                      right={<MiniBadge icon={Sparkles} text={editMode ? "Editing" : "View"} tone={editMode ? "blue" : "slate"} />}
                    >
                      {editMode ? (
                        <textarea
                          value={form.bio}
                          onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                          disabled={saving}
                          rows={4}
                          className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-semibold resize-none"
                          placeholder="Write a brief professional bio..."
                        />
                      ) : (
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                          {form.bio || "No biography provided."}
                        </p>
                      )}
                    </SectionCard>
                  </motion.div>

                  {/* Professional Details */}
                  <motion.div variants={itemVariants}>
                    <SectionCard
                      title="Professional Details"
                      icon={Stethoscope}
                      subtitle="Specialization, experience, department"
                      right={<MiniBadge icon={BadgeCheck} text="Details" tone="emerald" />}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputWrapper label="Specialization" hint="Example: Cardiology">
                          <StyledInput
                            value={form.specialization}
                            onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))}
                            disabled={!editMode}
                            placeholder="e.g. Cardiology"
                          />
                        </InputWrapper>

                        <InputWrapper label="Experience (Years)" hint="Number">
                          <StyledInput
                            type="number"
                            value={form.experienceYears}
                            onChange={(e) => setForm((p) => ({ ...p, experienceYears: e.target.value }))}
                            disabled={!editMode}
                            placeholder="e.g. 10"
                          />
                        </InputWrapper>

                        <div className="md:col-span-2">
                          <InputWrapper label="Department" hint={selectedDepartmentMeta?.consultationFee ? `Fee: ₹${selectedDepartmentMeta.consultationFee}` : ""}>
                            {editMode ? (
                              <StyledSelect
                                value={selectedDepartmentId}
                                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                                disabled={loading || saving}
                              >
                                <option value="" disabled>
                                  Select Department
                                </option>
                                {departmentOptions.map((op) => (
                                  <option key={op.value} value={op.value}>
                                    {op.label}
                                  </option>
                                ))}
                              </StyledSelect>
                            ) : (
                              <div className="py-3 text-sm font-black text-slate-800 dark:text-slate-200">
                                {profile?.department?.name || "Not assigned"}
                              </div>
                            )}
                          </InputWrapper>
                        </div>
                      </div>
                    </SectionCard>
                  </motion.div>

                  {/* Qualifications */}
                  <motion.div variants={itemVariants}>
                    <SectionCard
                      title="Qualifications"
                      icon={GraduationCap}
                      subtitle="Degrees and certifications"
                      right={
                        editMode ? (
                          <motion.button
                            variants={softPop}
                            initial="rest"
                            whileHover={!prefersReducedMotion ? "hover" : "rest"}
                            whileTap={!prefersReducedMotion ? "tap" : "rest"}
                            onClick={handleAddQualification}
                            className="text-xs font-black text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-xl transition-colors border border-blue-100 dark:border-blue-800/40"
                            type="button"
                          >
                            + Add
                          </motion.button>
                        ) : (
                          <MiniBadge icon={GraduationCap} text={`${(form.qualifications || []).length} Items`} tone="slate" />
                        )
                      }
                    >
                      <div className="flex flex-col gap-3">
                        <LayoutGroup>
                          <AnimatePresence initial={false}>
                            {(form.qualifications || []).map((q, idx) => (
                              <motion.div
                                layout
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                                key={`qual-${idx}`}
                                className="w-full"
                              >
                                {editMode ? (
                                  <div className="flex items-center gap-2">
                                    <StyledInput
                                      value={q}
                                      onChange={(e) => handleQualificationChange(idx, e.target.value)}
                                      placeholder="Degree (e.g. MBBS)"
                                      disabled={saving}
                                    />
                                    <motion.button
                                      variants={softPop}
                                      initial="rest"
                                      whileHover={!prefersReducedMotion ? "hover" : "rest"}
                                      whileTap={!prefersReducedMotion ? "tap" : "rest"}
                                      onClick={() => handleRemoveQualification(idx)}
                                      disabled={saving}
                                      className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 transition border border-rose-100 dark:border-rose-800/40"
                                      type="button"
                                    >
                                      <Trash2 size={16} />
                                    </motion.button>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-extrabold uppercase tracking-wide border border-slate-200/70 dark:border-slate-800">
                                    <GraduationCap size={14} className="text-indigo-500" />
                                    {q}
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </LayoutGroup>

                        {!form.qualifications?.length && (
                          <div className="text-sm text-slate-400 italic">
                            No qualifications added yet.
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  </motion.div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <motion.div variants={itemVariants}>
                    <SectionCard
                      title="OPD Schedule"
                      icon={Clock}
                      subtitle="Weekly timing slots"
                      right={
                        editMode ? (
                          <motion.button
                            variants={softPop}
                            initial="rest"
                            whileHover={!prefersReducedMotion ? "hover" : "rest"}
                            whileTap={!prefersReducedMotion ? "tap" : "rest"}
                            onClick={handleAddSlot}
                            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition border border-slate-200/60 dark:border-slate-800"
                            type="button"
                          >
                            <Plus size={16} />
                          </motion.button>
                        ) : (
                          <MiniBadge icon={Clock} text={`${opdSorted.length} Slots`} tone="blue" />
                        )
                      }
                    >
                      <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                          {opdSorted.length > 0 ? (
                            opdSorted.map((slot, idx) => (
                              <motion.div
                                layout
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 16 }}
                                transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
                                key={`slot-${idx}-${slot.day}-${slot.startTime}-${slot.endTime}`}
                                className={cn(
                                  "p-4 rounded-2xl border transition-all",
                                  editMode
                                    ? "bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800"
                                    : "bg-white border-slate-200/60 dark:bg-slate-950/30 dark:border-slate-800 shadow-sm"
                                )}
                              >
                                {editMode ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                        Slot {idx + 1}
                                      </span>

                                      <motion.button
                                        variants={softPop}
                                        initial="rest"
                                        whileHover={!prefersReducedMotion ? "hover" : "rest"}
                                        whileTap={!prefersReducedMotion ? "tap" : "rest"}
                                        onClick={() => {
                                          const realIdx = form.opdTimings.indexOf(slot);
                                          handleRemoveSlot(realIdx);
                                        }}
                                        disabled={saving}
                                        className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 p-2 rounded-xl transition border border-transparent"
                                        type="button"
                                      >
                                        <Trash2 size={14} />
                                      </motion.button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                      <StyledSelect
                                        value={slot.day}
                                        onChange={(e) => {
                                          const realIdx = form.opdTimings.indexOf(slot);
                                          handleSlotChange(realIdx, "day", e.target.value);
                                        }}
                                        disabled={saving}
                                      >
                                        {DAYS.map((d) => (
                                          <option key={d.value} value={d.value}>
                                            {d.label}
                                          </option>
                                        ))}
                                      </StyledSelect>

                                      <div className="flex gap-2">
                                        <StyledInput
                                          type="time"
                                          value={normalizeTime(slot.startTime)}
                                          onChange={(e) => {
                                            const realIdx = form.opdTimings.indexOf(slot);
                                            handleSlotChange(realIdx, "startTime", e.target.value);
                                          }}
                                          disabled={saving}
                                        />
                                        <StyledInput
                                          type="time"
                                          value={normalizeTime(slot.endTime)}
                                          onChange={(e) => {
                                            const realIdx = form.opdTimings.indexOf(slot);
                                            handleSlotChange(realIdx, "endTime", e.target.value);
                                          }}
                                          disabled={saving}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-700 dark:text-blue-300 font-black text-xs border border-blue-100 dark:border-blue-800/40">
                                        {slot.day.substring(0, 3)}
                                      </div>

                                      <div>
                                        <div className="text-sm font-black text-slate-800 dark:text-slate-100">
                                          {normalizeTime(slot.startTime)} - {normalizeTime(slot.endTime)}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-semibold">
                                          Weekly
                                        </div>
                                      </div>
                                    </div>

                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                  </div>
                                )}
                              </motion.div>
                            ))
                          ) : (
                            <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/60 dark:bg-slate-950/30">
                              <Clock size={26} className="mb-2 opacity-60" />
                              No schedules configured
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    </SectionCard>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom sticky info */}
          <div className="relative shrink-0 px-6 py-3 border-t border-slate-100 dark:border-slate-900 bg-white/75 dark:bg-slate-950/70 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Tip
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                {editMode ? "Save changes when done" : "Click edit to update profile"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DoctorProfileModal;