import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, Calendar, Droplets, MapPin,
  HeartPulse, Edit2, Check, X, ShieldCheck, UserCheck,
  ChevronDown, Camera, Sparkles, AlertCircle
} from "lucide-react";
import Navbar from "../../components/Navbar/PatientNavbar";
import { getMyPatientProfileApi, updatePatientProfileApi } from "../../api/patient.api";
import Toast from "../../components/ui/Toast";
import Loader from "../../components/animation/Loader";

/* ---------- Helpers ---------- */
const toInputDate = (iso) => (iso ? iso.split("T")[0] : "");
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = (v) =>
  typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));

const calculateAge = (dobString) => {
  if (!dobString) return "-";
  try {
    const today = new Date();
    const birth = new Date(dobString);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} Years`;
  } catch {
    return "-";
  }
};

/* ---------- Motion Variants ---------- */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1, delayChildren: 0.1 } 
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 24 }
  },
};

const actionBarVariants = {
  hidden: { y: 100, opacity: 0, scale: 0.95 },
  visible: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },
  exit: { y: 100, opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

/* ---------- Default Shapes ---------- */
const EMPTY_USER = { name: "", email: "", phone: "", isPhoneVerified: false };
const EMPTY_PROFILE = {
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  emergencyContact: { name: "", phone: "", relation: "" },
  address: "",
};

/* ---------- Component ---------- */
const PatientProfile = () => {
  const [user, setUser] = useState(EMPTY_USER);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [backupUser, setBackupUser] = useState(null);
  const [backupProfile, setBackupProfile] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  /* ---------- Fetch ---------- */
  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getMyPatientProfileApi();
        const payloadUser = res?.data?.data?.user ?? EMPTY_USER;
        const payloadProfileRaw = res?.data?.data?.profile ?? EMPTY_PROFILE;

        const normalizedProfile = {
          ...EMPTY_PROFILE,
          ...payloadProfileRaw,
          dateOfBirth: toInputDate(payloadProfileRaw?.dateOfBirth),
          emergencyContact: {
            ...(EMPTY_PROFILE.emergencyContact),
            ...(payloadProfileRaw?.emergencyContact || {}),
          },
        };

        if (!mounted) return;
        setUser({ ...EMPTY_USER, ...payloadUser });
        setProfile(normalizedProfile);
        setBackupUser(clone({ ...EMPTY_USER, ...payloadUser }));
        setBackupProfile(clone(normalizedProfile));
        setIsDirty(false);
      } catch (err) {
        setToast({
          type: "error",
          message: err?.response?.data?.message || "Error loading profile.",
        });
        setError("Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { mounted = false; };
  }, []);

  /* ---------- Handlers ---------- */
  
  const startEdit = () => {
    setBackupUser(clone(user));
    setBackupProfile(clone(profile));
    setIsEditing(true);
    setIsDirty(false);
  };

  const cancelEdit = () => {
    if (backupUser) setUser(clone(backupUser));
    if (backupProfile) setProfile(clone(backupProfile));
    setIsEditing(false);
    setIsDirty(false);
  };

  const markDirtyIfNeeded = (newUser, newProfile) => {
    if (!backupUser || !backupProfile) {
      setIsDirty(false);
      return;
    }
    const dirty = !deepEqual(newUser, backupUser) || !deepEqual(newProfile, backupProfile);
    setIsDirty(dirty);
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => {
      const updated = { ...prev, [name]: value };
      markDirtyIfNeeded(updated, profile);
      return updated;
    });
  };

  const handleProfileChange = (e, section) => {
    const { name, value } = e.target;
    setProfile((prev) => {
      const updated =
        section === "emergency"
          ? { ...prev, emergencyContact: { ...prev.emergencyContact, [name]: value } }
          : { ...prev, [name]: value };
      markDirtyIfNeeded(user, updated);
      return updated;
    });
  };

  const handleSave = async () => {
    if (!isDirty || !user || !profile) return;
    try {
      setSaving(true);
      setError(null);
      const payload = { name: user.name, ...profile };
      await updatePatientProfileApi(payload);
      
      setBackupUser(clone(user));
      setBackupProfile(clone(profile));
      setIsEditing(false);
      setIsDirty(false);
      setToast({ type: "success", message: "Profile updated successfully!" });
    } catch (err) {
      setToast({ type: "error", message: err?.response?.data?.message ||"Failed to save profile." });
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Container - added padding bottom for floating bar */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-40 relative">
        <Navbar activePage="" />

        <main className="max-w-6xl mx-auto px-4 md:px-6 pt-8">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            
            {/* Header / Hero Section */}
            <motion.div 
              variants={cardVariants} 
              className="relative w-full rounded-[2rem] bg-white dark:bg-gray-900 shadow-xl shadow-gray-200/50 dark:shadow-black/20 overflow-hidden mb-10 border border-gray-100 dark:border-gray-800"
            >
              {/* Decorative Background */}
              <div className="h-48 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              <div className="px-8 pb-8 relative">
                <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 gap-6">
                  {/* Avatar */}
                  <div className="relative group shrink-0">
                    <div className="h-32 w-32 rounded-3xl bg-white dark:bg-gray-800 p-1.5 shadow-2xl ring-4 ring-white/20 dark:ring-black/20">
                      <div className="h-full w-full rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                        <User size={48} strokeWidth={1.5} />
                      </div>
                    </div>
                    {isEditing && (
                      <motion.button 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="absolute bottom-[-10px] right-[-10px] p-2.5 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-100 dark:border-gray-600 text-teal-600 hover:text-teal-700 transition-colors z-10"
                      >
                        <Camera size={18} />
                      </motion.button>
                    )}
                  </div>

                  {/* Name & Email */}
                  <div className="flex-1 w-full min-w-0 mb-2">
                    {isEditing ? (
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-white/80 uppercase tracking-widest shadow-sm">Display Name</label>
                          <input
                            name="name"
                            value={user?.name ?? ""}
                            onChange={handleUserChange}
                            className="w-full text-3xl md:text-4xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-teal-200 focus:border-teal-500 outline-none pb-1 transition-colors placeholder-gray-300"
                            placeholder="Your Full Name"
                          />
                       </div>
                    ) : (
                      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
                        {user?.name || "Welcome Back"}
                      </h1>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
                        <div className="p-1 rounded bg-teal-50 dark:bg-teal-900/20 text-teal-500">
                          <Mail size={14} /> 
                        </div>
                        {user?.email || "No email linked"}
                      </div>
                      
                      {!isEditing && (
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
                           <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                           <span className="text-sm">Patient ID: {user?._id?.slice(-6).toUpperCase() || "—"}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats Badges */}
                  <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <StatBadge 
                      label="Current Age" 
                      value={calculateAge(profile?.dateOfBirth)} 
                      color="teal" 
                      icon={Sparkles}
                    />
                    <StatBadge 
                      label="User Role" 
                      value="Patient" 
                      color="indigo" 
                      icon={UserCheck}
                    />
                  </div>
                </div>
              </div>

              {/* Edit Toggle (Top Right of Card) */}
              <div className="absolute top-4 right-4 md:top-8 md:right-8">
                <AnimatePresence>
                  {!isEditing && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={startEdit}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full font-bold text-sm shadow-sm transition-all active:scale-95"
                    >
                      <Edit2 size={16} /> 
                      <span className="hidden sm:inline">Edit Profile</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Personal Info */}
              <motion.div variants={cardVariants} className="md:col-span-7 space-y-6">
                <SectionCard title="Vital Information" icon={UserCheck}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <EditableField 
                      label="Full Name" 
                      name="name" 
                      value={user?.name} 
                      icon={User} 
                      isEditing={isEditing} 
                      onChange={handleUserChange} 
                    />
                    <EditableField 
                      label="Date of Birth" 
                      name="dateOfBirth" 
                      type="date" 
                      value={profile?.dateOfBirth} 
                      icon={Calendar} 
                      isEditing={isEditing} 
                      onChange={handleProfileChange} 
                    />
                    <EditableSelect
                      label="Gender"
                      name="gender"
                      value={profile?.gender}
                      options={["MALE", "FEMALE", "OTHER"]}
                      icon={User}
                      isEditing={isEditing}
                      onChange={handleProfileChange}
                    />
                    <EditableSelect
                      label="Blood Group"
                      name="bloodGroup"
                      value={profile?.bloodGroup}
                      options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
                      icon={Droplets}
                      isEditing={isEditing}
                      onChange={handleProfileChange}
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Address & Location" icon={MapPin}>
                  <EditableField 
                    label="Home Address" 
                    name="address" 
                    value={profile?.address} 
                    icon={MapPin} 
                    isEditing={isEditing} 
                    onChange={handleProfileChange} 
                    fullWidth
                  />
                </SectionCard>
              </motion.div>

              {/* Right Column: Contact & Emergency */}
              <motion.div variants={cardVariants} className="md:col-span-5 space-y-6">
                <SectionCard title="Contact Security" icon={ShieldCheck}>
                   <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50 border border-gray-100 dark:border-gray-700 flex items-center justify-between group">
                      <div className="flex gap-3 items-center">
                         <div className="p-2.5 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-gray-400 group-hover:text-teal-500 transition-colors">
                           <Phone size={18} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{user?.phone || "—"}</p>
                         </div>
                      </div>
                      {user?.isPhoneVerified ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wide border border-emerald-200">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wide border border-amber-200">
                           <AlertCircle size={12} /> Unverified
                        </span>
                      )}
                   </div>
                </SectionCard>

                <SectionCard title="Emergency Contact" icon={HeartPulse} highlight>
                  <div className="space-y-4">
                    <EditableField 
                      label="Contact Name" 
                      name="name" 
                      value={profile?.emergencyContact?.name} 
                      icon={User} 
                      isEditing={isEditing} 
                      onChange={(e) => handleProfileChange(e, "emergency")} 
                      fullWidth
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <EditableField 
                        label="Relation" 
                        name="relation" 
                        value={profile?.emergencyContact?.relation} 
                        icon={UserCheck} 
                        isEditing={isEditing} 
                        onChange={(e) => handleProfileChange(e, "emergency")} 
                      />
                      <EditableField 
                        label="Phone" 
                        name="phone" 
                        value={profile?.emergencyContact?.phone} 
                        icon={Phone} 
                        isEditing={isEditing} 
                        onChange={(e) => handleProfileChange(e, "emergency")} 
                      />
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            </div>

            {error && <div className="mt-8 text-center text-red-500 font-bold bg-red-50 p-4 rounded-xl">{error}</div>}

          </motion.div>
        </main>

        {/* Floating Action Bar (Sticky Bottom) */}
        <AnimatePresence>
          {isEditing && (
            <motion.div 
              variants={actionBarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed bottom-8 left-0 right-0 z-40 flex justify-center px-4"
            >
              <div className="flex items-center gap-2 p-2 pr-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-2xl rounded-full max-w-lg w-full justify-between">
                
                <button 
                  onClick={cancelEdit} 
                  className="px-5 py-2.5 rounded-full text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <X size={18} /> Cancel
                </button>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isDirty ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20" : "bg-gray-100 text-gray-400 dark:bg-gray-800"}`}>
                    {isDirty ? "Unsaved Changes" : "No Changes"}
                  </span>
                  
                  <button 
                    onClick={handleSave} 
                    disabled={!isDirty || saving}
                    className={`
                      px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95
                      ${isDirty 
                        ? "bg-teal-600 text-white hover:bg-teal-700 hover:shadow-teal-500/25" 
                        : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                      }
                    `}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

/* ---------- Sub-Components for Clean Code ---------- */

const StatBadge = ({ label, value, color, icon: Icon }) => {
  const colors = {
    teal: "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800",
  };
  
  return (
    <div className={`px-4 py-2 rounded-xl border flex flex-col items-start min-w-[100px] ${colors[color]}`}>
      <div className="flex items-center gap-1.5 opacity-70 mb-0.5">
         <Icon size={12} />
         <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-lg font-black leading-tight">{value}</p>
    </div>
  );
};

const SectionCard = ({ title, icon: Icon, children, highlight }) => (
  <div className={`
    p-6 rounded-[1.5rem] border shadow-sm transition-all hover:shadow-md
    ${highlight 
      ? "bg-white dark:bg-gray-900 border-rose-100 dark:border-rose-900/30" 
      : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"}
  `}>
    <div className="flex items-center gap-3 mb-6">
      <div className={`
        p-2 rounded-xl border shadow-sm
        ${highlight 
          ? "bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/50" 
          : "bg-gray-50 text-teal-600 border-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-teal-400"}
      `}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

const EditableField = ({ label, value, name, icon: Icon, isEditing, onChange, type = "text", fullWidth }) => (
  <div className={`group ${fullWidth ? "col-span-full" : ""}`}>
    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block group-focus-within:text-teal-600 transition-colors">
      {label}
    </label>
    
    <div className={`
      relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
      ${isEditing 
        ? "bg-gray-50 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 focus-within:ring-2 focus-within:ring-teal-500 focus-within:bg-white dark:focus-within:bg-gray-900" 
        : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200"}
    `}>
      <span className={`transition-colors ${isEditing ? "text-gray-400 group-focus-within:text-teal-500" : "text-gray-400"}`}>
        <Icon size={18} />
      </span>
      
      {isEditing ? (
        <input
          type={type}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 outline-none"
          placeholder={`Enter ${label}`}
        />
      ) : (
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">
          {value || <span className="text-gray-300 font-normal italic">Not set</span>}
        </span>
      )}
    </div>
  </div>
);

const EditableSelect = ({ label, value, name, options, icon: Icon, isEditing, onChange }) => (
  <div className="group">
    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block group-focus-within:text-teal-600 transition-colors">
      {label}
    </label>
    
    <div className={`
      relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
      ${isEditing 
        ? "bg-gray-50 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 focus-within:ring-2 focus-within:ring-teal-500 focus-within:bg-white dark:focus-within:bg-gray-900" 
        : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200"}
    `}>
      <span className="text-gray-400"><Icon size={18} /></span>
      
      {isEditing ? (
        <div className="flex-1 relative">
           <select
            name={name}
            value={value ?? ""}
            onChange={onChange}
            className="w-full bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none appearance-none relative z-10 cursor-pointer"
          >
            <option value="" disabled>Select</option>
            {options.map(opt => <option key={opt} value={opt} className="dark:bg-gray-900">{opt}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 z-0" />
        </div>
      ) : (
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
          {value || <span className="text-gray-300 font-normal italic">Not set</span>}
        </span>
      )}
    </div>
  </div>
);

export default PatientProfile;