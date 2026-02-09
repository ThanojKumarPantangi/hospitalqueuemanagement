import React, { useEffect, useMemo, useState } from "react";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
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
  User,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";

/* =========================
   ANIMATION CONSTANTS & VARIANTS
   ========================= */
const TRANSITION_SPRING = { type: "spring", stiffness: 300, damping: 30 };
const TRANSITION_SOFT = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] };

const backdropVariants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(12px)", transition: { duration: 0.4 } },
  exit: { opacity: 0, backdropFilter: "blur(0px)", transition: { duration: 0.3 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 40, rotateX: 5 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: { type: "spring", stiffness: 350, damping: 25, mass: 0.8 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

const contentContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const contentItemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
};

/* =========================
   LOGIC HELPERS
   ========================= */
const OPD_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAYS = [
  { value: "MON", label: "Monday", short: "Mon" },
  { value: "TUE", label: "Tuesday", short: "Tue" },
  { value: "WED", label: "Wednesday", short: "Wed" },
  { value: "THU", label: "Thursday", short: "Thu" },
  { value: "FRI", label: "Friday", short: "Fri" },
  { value: "SAT", label: "Saturday", short: "Sat" },
  { value: "SUN", label: "Sunday", short: "Sun" },
];

const cn = (...classes) => classes.filter(Boolean).join(" ");

const safeUpper = (val) => (val ? String(val).toUpperCase() : "");

const getStatusBadge = (user) => {
  if (!user?.isVerified) {
    return {
      label: "Pending Verification",
      icon: ShieldAlert,
      colorClass:
        "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
      dotClass: "bg-amber-500 shadow-amber-500/50",
    };
  }
  if (!user?.isActive) {
    return {
      label: "Inactive",
      icon: Activity,
      colorClass:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
      dotClass: "bg-slate-500 shadow-slate-500/50",
    };
  }
  if (user?.isActive && !user?.isAvailable) {
    return {
      label: "On Leave",
      icon: Clock,
      colorClass:
        "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
      dotClass: "bg-indigo-500 shadow-indigo-500/50",
    };
  }
  return {
    label: "Active Practice",
    icon: BadgeCheck,
    colorClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    dotClass: "bg-emerald-500 shadow-emerald-500/50",
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
   PRESENTATIONAL COMPONENTS
   ========================= */

// 1. Tooltip / Hint Wrapper
const InputLabel = ({ label, icon: Icon, required, hint }) => (
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
      {Icon && <Icon size={14} className="text-slate-400 dark:text-slate-500" />}
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      {required && <span className="text-rose-500 text-xs">*</span>}
    </div>
    {hint && (
      <div className="group relative flex items-center">
        <Info size={13} className="text-slate-400 cursor-help" />
        <span className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
          {hint}
        </span>
      </div>
    )}
  </div>
);

// 2. High-Fidelity Input
const AnimatedInput = ({ label, icon, value, onChange, disabled, type = "text", placeholder, ...props }) => {
  return (
    <div className="relative group">
      <InputLabel label={label} icon={icon} {...props} />
      <div className="relative transition-all duration-300 transform">
        <input
          type={type}
          disabled={disabled}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "w-full bg-white dark:bg-slate-900/50",
            "border-2 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100",
            "outline-none transition-all duration-200",
            disabled
              ? "border-slate-100 dark:border-slate-800 text-slate-500 bg-slate-50/50 cursor-not-allowed"
              : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
          )}
        />
        {!disabled && (
          <div className="absolute inset-0 rounded-xl pointer-events-none border border-blue-500/0 peer-focus:border-blue-500/100 transition-colors" />
        )}
      </div>
    </div>
  );
};

// 3. Custom Select with enhanced visuals
const SmartSelect = ({ label, options, value, onChange, disabled, placeholder }) => (
  <div className="relative">
    <InputLabel label={label} icon={Building2} />
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          "w-full appearance-none bg-white dark:bg-slate-900/50",
          "border-2 rounded-xl px-4 py-3 pr-10 text-sm font-medium",
          "outline-none transition-all duration-200",
          disabled
            ? "border-slate-100 dark:border-slate-800 text-slate-400 bg-slate-50 cursor-default"
            : "border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer hover:border-slate-300"
        )}
      >
        <option value="" disabled>
          {placeholder || "Select option..."}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform",
          disabled ? "text-slate-300" : "text-slate-500"
        )}
        size={16}
      />
    </div>
  </div>
);

// 4. Qualification Chip
const QualChip = ({ text, onRemove, disabled }) => (
  <motion.div
    layout
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.8, opacity: 0 }}
    className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold shadow-sm",
      "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
    )}
  >
    <GraduationCap size={14} className="text-blue-500" />
    <span>{text}</span>
    {!disabled && onRemove && (
      <button
        onClick={onRemove}
        className="ml-1 p-0.5 rounded-full hover:bg-rose-100 text-slate-400 hover:text-rose-500 transition-colors"
      >
        <X size={14} />
      </button>
    )}
  </motion.div>
);

// 5. Stat Box
const QuickStat = ({ icon: Icon, label, value, color = "blue" }) => {
  const colorMap = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400",
    violet: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400",
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50">
      <div className={cn("p-2 rounded-xl mb-2", colorMap[color])}>
        <Icon size={20} />
      </div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</div>
      <div className="text-lg font-black text-slate-800 dark:text-white">{value}</div>
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
  departments = [],
  onSave,
}) => {

  
  // Logic Extraction
  const user = doctorData?.profile?.user;
  const profile = doctorData?.profile?.profile;
  
  // Derived State
  const status = useMemo(() => getStatusBadge(user), [user]);
  const initials = useMemo(() => {
    const name = user?.name || "Dr";
    return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  }, [user?.name]);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(() => cloneProfileToForm(profile));
  const [saving, setSaving] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setForm(cloneProfileToForm(profile));
    setEditMode(false);
    setSaving(false);
  }, [profile?._id, profile]);

  const opdSorted = useMemo(() => sortOpd(form?.opdTimings), [form?.opdTimings]);

  // Dirty Check
  const hasChanges = useMemo(() => {
    const original = cloneProfileToForm(profile);
    const current = form;
    return JSON.stringify(original) !== JSON.stringify(current);
  }, [profile, form]);

  // Department Helpers
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

  /* --- HANDLERS --- */
  const handleReset = () => {
    setForm(cloneProfileToForm(profile));
    setEditMode(false);
  };

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

  const handleSaveWrapper = async () => {
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

  // Keyboard trap
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !saving) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  /* --- MOUSE EFFECT HOOKS --- */
  // These MUST be called before any conditional return
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // FIX: This hook was previously inside the return statement (JSX), causing the error.
  const spotlightBackground = useMotionTemplate`
    radial-gradient(
      650px circle at ${mouseX}px ${mouseY}px,
      rgba(56, 189, 248, 0.1),
      transparent 80%
    )
  `;

  const handleMouseMove = ({ currentTarget, clientX, clientY }) => {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] grid place-items-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={!saving ? onClose : undefined}
          className="absolute inset-0 bg-slate-900/60"
        />

        {/* Modal Container */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onMouseMove={handleMouseMove}
          className={cn(
            "relative w-full max-w-6xl h-[92vh] max-h-[900px]",
            "bg-white dark:bg-slate-950",
            "rounded-[2.5rem] shadow-2xl overflow-hidden",
            "flex flex-col md:flex-row",
            "border border-white/20 dark:border-slate-800"
          )}
        >
          {/* Decorative Spotlight Effect */}
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 transition duration-300 group-hover:opacity-100"
            style={{
              background: spotlightBackground, // Use the pre-calculated hook value
            }}
          />

          {/* ==============================================
              LEFT SIDEBAR: Identity & High Level Stats
             ============================================== */}
          <div className="relative w-full md:w-80 lg:w-96 shrink-0 flex flex-col bg-slate-50/80 dark:bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 z-10 backdrop-blur-sm">
            
            {/* Cover Art Pattern */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-50 dark:from-slate-900/80 to-transparent" />
            </div>

            {/* Profile Content */}
            <div className="relative flex flex-col items-center pt-16 px-6 pb-6 h-full overflow-y-auto custom-scrollbar">
              
              {/* Avatar */}
              <motion.div 
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={TRANSITION_SPRING}
                className="relative"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white dark:border-slate-900 shadow-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                   <span className="text-3xl sm:text-4xl font-black text-slate-400 select-none">
                     {loading ? "..." : initials}
                   </span>
                </div>
                {/* Active Status Indicator Ring */}
                <div className={cn(
                  "absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900",
                  status.dotClass
                )} />
              </motion.div>

              {/* Name & Title */}
              <div className="text-center mt-4 space-y-1 w-full">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  Dr. {safeUpper(user?.name)}
                </h2>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  <span className="bg-slate-200/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">ID: {user?.doctorRollNo || "---"}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className={cn(
                "mt-4 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-widest border",
                status.colorClass
              )}>
                <status.icon size={14} />
                {status.label}
              </div>

              <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-6" />

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3 w-full">
                 <QuickStat 
                    icon={BriefcaseMedical} 
                    label="Exp" 
                    value={`${profile?.experienceYears || 0} Yrs`} 
                    color="blue"
                 />
                 <QuickStat 
                    icon={Building2} 
                    label="Dept" 
                    value={profile?.department?.name?.substring(0, 8) + (profile?.department?.name?.length > 8 ? "..." : "") || "N/A"} 
                    color="violet"
                 />
                 <div className="col-span-2">
                    <QuickStat 
                      icon={CalendarDays}
                      label="Availability"
                      value={opdSorted.length > 0 ? `${opdSorted.length} Slots / Week` : "Not Configured"}
                      color="emerald"
                    />
                 </div>
              </div>

              <div className="flex-1" /> {/* Spacer */}

              {/* Contact / Meta Info (Static for visuals) */}
              <div className="w-full space-y-3 mt-6">
                 <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <Mail size={16} />
                    <span className="truncate">{user?.email || "No email linked"}</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <Phone size={16} />
                    <span className="truncate">{user?.phone || "+91 000 000 0000"}</span>
                 </div>
              </div>
            </div>
          </div>

          {/* ==============================================
              RIGHT CONTENT: Tabs & Form Area
             ============================================== */}
          <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 relative">
            
            {/* Header / Toolbar */}
            <div className="shrink-0 h-16 sm:h-20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 sm:px-8 bg-white/80 dark:bg-slate-950/80 backdrop-blur z-20">
               <div>
                  <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    Profile Details
                    {hasChanges && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                  </h1>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden sm:block">
                    Manage professional information and scheduling
                  </p>
               </div>

               <div className="flex items-center gap-2 sm:gap-3">
                  {editMode ? (
                     <>
                        <button
                          onClick={handleReset}
                          disabled={saving}
                          className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors tooltip-trigger"
                          title="Discard changes"
                        >
                          <RotateCcw size={20} />
                        </button>
                        <button
                          onClick={handleSaveWrapper}
                          disabled={saving || !hasChanges}
                          className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all transform active:scale-95",
                            hasChanges
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30"
                                : "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                          )}
                        >
                           {saving ? <Activity className="animate-spin" size={18}/> : <Save size={18} />}
                           <span>{saving ? "Saving..." : "Save Changes"}</span>
                        </button>
                     </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors border border-transparent dark:border-slate-800"
                    >
                       <Pencil size={16} />
                       Edit
                    </button>
                  )}
                  
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
                  
                  <button
                    onClick={onClose}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  >
                    <X size={24} />
                  </button>
               </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar space-y-8">
               <motion.div 
                 variants={contentContainerVariants}
                 initial="hidden"
                 animate="visible"
                 className="max-w-4xl mx-auto space-y-8 pb-12"
               >
                  
                  {/* SECTION 1: Bio */}
                  <motion.section variants={contentItemVariants} className="space-y-4">
                     <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                           <FileText size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">About Me</h3>
                     </div>
                     <div className="relative">
                        {editMode ? (
                          <div className="relative">
                            <textarea
                               value={form.bio}
                               onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                               disabled={saving}
                               rows={5}
                               className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-y"
                               placeholder="Write a professional summary..."
                            />
                            <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium pointer-events-none">
                              {form.bio.length} chars
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50">
                             <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                               {form.bio || <span className="italic text-slate-400">No biography provided. Click edit to add one.</span>}
                             </p>
                          </div>
                        )}
                     </div>
                  </motion.section>

                  {/* SECTION 2: Professional Details */}
                  <motion.section variants={contentItemVariants} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                           <Stethoscope size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Professional Details</h3>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                        <AnimatedInput
                           label="Specialization"
                           icon={Stethoscope}
                           value={form.specialization}
                           onChange={(e) => setForm(p => ({...p, specialization: e.target.value}))}
                           disabled={!editMode || saving}
                           placeholder="e.g. Cardiology"
                        />
                        <AnimatedInput
                           label="Experience (Years)"
                           type="number"
                           icon={BriefcaseMedical}
                           value={form.experienceYears}
                           onChange={(e) => setForm(p => ({...p, experienceYears: e.target.value}))}
                           disabled={!editMode || saving}
                           placeholder="e.g. 12"
                        />
                        
                        <div className="md:col-span-2">
                           {editMode ? (
                              <SmartSelect
                                label="Department"
                                options={departmentOptions}
                                value={selectedDepartmentId}
                                onChange={(e) => setForm(p => ({...p, department: e.target.value}))}
                                disabled={saving}
                                placeholder="Select a department"
                              />
                           ) : (
                              <div className="relative group">
                                <InputLabel label="Department" icon={Building2} />
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-500">
                                         <Building2 size={20}/>
                                      </div>
                                      <div>
                                         <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                            {profile?.department?.name || "Not Assigned"}
                                         </div>
                                         <div className="text-xs text-slate-500">
                                            {selectedDepartmentMeta?.consultationFee ? `Consultation Fee: ₹${selectedDepartmentMeta.consultationFee}` : "No fee data"}
                                         </div>
                                      </div>
                                   </div>
                                   {profile?.department && <BadgeCheck className="text-emerald-500" size={20}/>}
                                </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </motion.section>

                  {/* SECTION 3: Qualifications */}
                  <motion.section variants={contentItemVariants} className="space-y-4">
                     <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                           <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                              <GraduationCap size={20} />
                           </div>
                           <h3 className="font-bold text-slate-800 dark:text-slate-200">Qualifications</h3>
                        </div>
                        {editMode && (
                           <button 
                             onClick={handleAddQualification}
                             className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                           >
                              <Plus size={14} /> Add New
                           </button>
                        )}
                     </div>
                     
                     <div className="p-1">
                        <LayoutGroup>
                           <motion.div layout className="flex flex-wrap gap-3 min-h-[60px]">
                              <AnimatePresence mode="popLayout">
                                 {(form.qualifications || []).map((q, idx) => (
                                    editMode ? (
                                       <motion.div 
                                         layout
                                         initial={{ opacity: 0, scale: 0.8 }}
                                         animate={{ opacity: 1, scale: 1 }}
                                         exit={{ opacity: 0, scale: 0.8 }}
                                         key={`edit-qual-${idx}`}
                                         className="flex items-center gap-2"
                                       >
                                          <input
                                             value={q}
                                             onChange={(e) => handleQualificationChange(idx, e.target.value)}
                                             placeholder="Degree..."
                                             className="
                                                bg-white dark:bg-slate-600
                                                text-slate-800 dark:text-slate-100
                                                placeholder:text-slate-400 dark:placeholder:text-slate-300
                                                border border-slate-200 dark:border-slate-600
                                                rounded-lg px-3 py-2 text-sm font-semibold
                                                w-32 focus:w-48
                                                transition-all outline-none
                                                focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                                              "
                                             autoFocus={q === ""}
                                          />
                                          <button 
                                            onClick={() => handleRemoveQualification(idx)}
                                            className="p-2 bg-rose-100/70 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
                                          >
                                             <Trash2 size={16} />
                                          </button>
                                       </motion.div>
                                    ) : (
                                       <QualChip key={`view-qual-${idx}`} text={q} />
                                    )
                                 ))}
                              </AnimatePresence>
                              {(!form.qualifications?.length) && !editMode && (
                                 <div className="text-sm text-slate-400 italic py-2">No qualifications added yet.</div>
                              )}
                           </motion.div>
                        </LayoutGroup>
                     </div>
                  </motion.section>

                  {/* SECTION 4: OPD Schedule */}
                  <motion.section variants={contentItemVariants} className="space-y-4">
                     <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                           <div className="p-2 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                              <Clock size={20} />
                           </div>
                           <h3 className="font-bold text-slate-800 dark:text-slate-200">OPD Schedule</h3>
                        </div>
                        {editMode && (
                           <button 
                             onClick={handleAddSlot}
                             className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                           >
                              <Plus size={14} /> Add Slot
                           </button>
                        )}
                     </div>

                     <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                           {opdSorted.length > 0 ? (
                              opdSorted.map((slot, idx) => (
                                 <motion.div
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    key={`slot-${idx}-${slot.day}`}
                                    className={cn(
                                       "group relative p-4 rounded-2xl border transition-all duration-300",
                                       editMode 
                                         ? "bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700" 
                                         : "bg-white border-slate-200 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200 dark:bg-slate-900/30 dark:border-slate-800"
                                    )}
                                 >
                                    {editMode ? (
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="w-full sm:w-1/3">
                                          <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                            Day
                                          </div>
                                          <select
                                            value={slot.day}
                                            onChange={(e) => {
                                              const realIdx = form.opdTimings.indexOf(slot);
                                              handleSlotChange(realIdx, "day", e.target.value);
                                            }}
                                            className="
                                              w-full p-2 rounded-lg
                                              bg-white dark:bg-slate-800
                                              text-slate-800 dark:text-slate-100
                                              border border-slate-200 dark:border-slate-600
                                              text-sm font-bold
                                              focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                                            "
                                          >
                                            {DAYS.map(d => (
                                              <option key={d.value} value={d.value}>
                                                {d.label}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-1/2">
                                          <div className="flex-1">
                                            <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                              Start
                                            </div>
                                            <input
                                              type="time"
                                              value={normalizeTime(slot.startTime)}
                                              onChange={(e) => {
                                                const realIdx = form.opdTimings.indexOf(slot);
                                                handleSlotChange(realIdx, "startTime", e.target.value);
                                              }}
                                              className="
                                                w-full p-2 rounded-lg
                                                bg-white dark:bg-slate-800
                                                text-slate-800 dark:text-slate-100
                                                border border-slate-200 dark:border-slate-600
                                                text-sm font-mono
                                                focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                                              "
                                            />
                                          </div>

                                          <span className="text-slate-300 dark:text-slate-500 mt-5">-</span>

                                          <div className="flex-1">
                                            <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                              End
                                            </div>
                                            <input
                                              type="time"
                                              value={normalizeTime(slot.endTime)}
                                              onChange={(e) => {
                                                const realIdx = form.opdTimings.indexOf(slot);
                                                handleSlotChange(realIdx, "endTime", e.target.value);
                                              }}
                                              className="
                                                w-full p-2 rounded-lg
                                                bg-white dark:bg-slate-800
                                                text-slate-800 dark:text-slate-100
                                                border border-slate-200 dark:border-slate-600
                                                text-sm font-mono
                                                focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                                              "
                                            />
                                          </div>
                                        </div>

                                        <button
                                          onClick={() => {
                                            const realIdx = form.opdTimings.indexOf(slot);
                                            handleRemoveSlot(realIdx);
                                          }}
                                          className="
                                            absolute top-2 right-2 sm:static sm:mt-4 p-2
                                            text-rose-600 dark:text-rose-400
                                            bg-rose-100/70 dark:bg-rose-900/30
                                            rounded-lg
                                            hover:bg-rose-200 dark:hover:bg-rose-900/50
                                            transition-colors
                                          "
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                      </div>
                                    ) : (
                                       <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-4">
                                             <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center border border-blue-100 dark:border-blue-800/50">
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{slot.day.substring(0,3)}</span>
                                             </div>
                                             <div>
                                                <div className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                   {normalizeTime(slot.startTime)} 
                                                   <ArrowRight size={14} className="text-slate-300"/> 
                                                   {normalizeTime(slot.endTime)}
                                                </div>
                                                <div className="text-xs text-slate-400 font-medium">Weekly Recursion</div>
                                             </div>
                                          </div>
                                          <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wide border border-emerald-100">
                                             Active
                                          </div>
                                       </div>
                                    )}
                                 </motion.div>
                              ))
                           ) : (
                              <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20"
                              >
                                 <Clock size={32} className="text-slate-300 mb-2" />
                                 <p className="text-slate-500 text-sm font-medium">No schedule slots configured.</p>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </motion.section>

               </motion.div>
            </div>
            
            {/* Footer / Gradient fade */}
            <div className="pointer-events-none absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white dark:from-slate-950 to-transparent z-10" />
            
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DoctorProfileModal;
