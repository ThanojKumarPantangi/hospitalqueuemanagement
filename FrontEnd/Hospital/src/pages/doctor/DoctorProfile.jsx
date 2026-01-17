import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, ShieldCheck, GraduationCap, Briefcase, 
  Clock, IndianRupee, FileText, Calendar, Plus, Trash2,
  Save,ChevronRight, Sparkles, AlertCircle
} from 'lucide-react';
import Toast from "../../components/ui/Toast";
import Navbar from "../../components/Navbar/DoctorNavbar";
import {getMyDoctorProfileApi,updateDoctorProfileApi} from "../../api/doctor.api";
import Tooltip from "../../components/tooltip/Tooltip"

const DoctorProfile = () => {

    const [formData, setFormData] = useState();
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);


// Doctor Profile APi
 useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const res = await getMyDoctorProfileApi();
        const profile = res?.data?.profile;
        if (!profile || !isMounted) return;

        setFormData({
          user: profile.user ?? {},
          specialization: profile.profile?.specialization ?? "",
          qualifications: profile.profile?.qualifications ?? [],
          experienceYears: profile.profile?.experienceYears ?? 0,

          // 🔒 READ-ONLY (from Department)
          consultationFee: profile.profile?.department?.consultationFee ?? 0,
          slotDurationMinutes: profile.profile?.department?.slotDurationMinutes ?? 10,

          opdTimings: profile.profile?.opdTimings ?? [],
          bio: profile.profile?.bio ?? "",
        });


      } catch (error) {
        console.error("Failed to fetch doctor profile:", error);
      }
    }

    fetchData();
    return () => { isMounted = false; };
  }, []);


  // --- Animation Variants ---
  const containerVars = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1, delayChildren: 0.2 } 
    }
  };

  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  // --- Logic Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateTiming = (index, field, value) => {
    const newTimings = [...formData.opdTimings];
    newTimings[index][field] = value;
    setFormData(prev => ({ ...prev, opdTimings: newTimings }));
  };

  const addTiming = () => {
    setFormData(prev => ({
      ...prev,
      opdTimings: [...prev.opdTimings, { day: "SUN", startTime: "10:00", endTime: "12:00" }]
    }));
  };

  const removeTiming = (index) => {
    setFormData(prev => ({
      ...prev,
      opdTimings: prev.opdTimings.filter((_, i) => i !== index)
    }));
  };

  const saveProfile = async () => {
  try {
    setIsSaving(true);

    const bio =
      typeof formData.bio === "string" && formData.bio.trim() !== ""
        ? formData.bio.trim()
        : "DOCTOR HAS NOT CREATED HIS BIO YET";

    const payload = {
      bio,
      opdTimings: (formData.opdTimings ?? []).map(t => ({
        day: t.day,
        startTime: t.startTime,
        endTime: t.endTime,
      })),
    };

    const res=await updateDoctorProfileApi(payload);
    setToast({
      type: "success",
      message:res?.response?.data?.message ||"Profile updated successfully",
    });

  } catch (error) {
    setToast({
      type: "error",
      message:error?.response?.data?.message||"Failed to update doctor profile",
    });
    console.error("Failed to update doctor profile:", error);
  } finally {
    setIsSaving(false);
  }
};


  return (
    <>
        {/* Notifications */}
        {toast && (
        <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
        />
        )}
        <div className="min-h-screen bg-[#fcfcfd] dark:bg-gray-950 transition-colors duration-500 pb-24">
            <Navbar activePage="Profile" />
            <motion.main 
                variants={containerVars}
                initial="hidden"
                animate="visible"
                className="max-w-6xl mx-auto px-4 pt-12"
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* ================= LEFT: IDENTITY CARD (READ ONLY) ================= */}
                <motion.div variants={itemVars} className="lg:col-span-4 space-y-6">
                    <div className="sticky top-24">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden relative">
                        {/* Decorative Background Element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                        
                        <div className="flex flex-col items-center text-center relative z-10">
                        <div className="relative mb-6">
                            <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="w-36 h-36 rounded-[2.2rem] bg-gradient-to-tr from-teal-500 to-emerald-400 p-1.5 shadow-lg shadow-teal-500/20"
                            >
                            <div className="w-full h-full rounded-[1.8rem] bg-white dark:bg-gray-900 overflow-hidden">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Doctor" className="w-full h-full object-cover" />
                            </div>
                            </motion.div>
                            {formData?.user?.isVerified && (
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl border-4 border-white dark:border-gray-900 shadow-lg"
                            >
                                <ShieldCheck size={22} />
                            </motion.div>
                            )}
                        </div>

                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                            DR. {formData?.user?.name?.toUpperCase()}
                        </h2>
                        <div className="mt-1 px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {formData?.specialization?.toUpperCase()}
                        </div>

                        <div className="w-full mt-8 pt-8 border-t border-gray-50 dark:border-gray-800 space-y-5">
                            {[
                            { icon: GraduationCap, label: "Education", val: (formData?.qualifications ?? []).join(", ") },
                            { icon: Briefcase, label: "Experience", val: formData?.experienceYears ? `${formData.experienceYears} Years` : "-" },
                            { icon: User, label: "Doctor ID", val: formData?.user?.doctorRollNo || "-", mono: true }

                            ].map((info, i) => (
                            <div key={i} className="flex items-center gap-4 text-left group">
                                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 group-hover:text-teal-500 transition-colors">
                                <info.icon size={20} />
                                </div>
                                <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{info.label}</p>
                                <p className={`text-sm font-bold text-gray-700 dark:text-gray-200 ${info.mono ? 'font-mono' : ''}`}>{info.val}</p>
                                </div>
                            </div>
                            ))}
                        </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 p-4 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 flex gap-3">
                        <AlertCircle className="text-amber-600 shrink-0" size={20} />
                        <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                        Read-only fields are verified by the hospital administration. Contact ADMIN to request changes.
                        </p>
                    </div>
                    </div>
                </motion.div>

                {/* ================= RIGHT: EDITABLE SETTINGS ================= */}
                <motion.div variants={itemVars} className="lg:col-span-8 space-y-8">
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-gray-800">
                    
                    {/* Header */}
                    <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20">
                        <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <Sparkles size={24} className="text-teal-500" />
                            Manage Profile
                        </h3>
                        <p className="text-xs font-medium text-gray-500 mt-1">Configure your clinical availability and public bio</p>
                        </div>
                        <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={saveProfile}
                        disabled={isSaving}
                        className="relative overflow-hidden group px-8 py-3 bg-gray-900 dark:bg-teal-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-teal-500/20 transition-all disabled:opacity-70"
                        >
                        <span className={`flex items-center gap-2 ${isSaving ? 'opacity-0' : 'opacity-100'}`}>
                            <Save size={18} /> Save Updates
                        </span>
                        {isSaving && (
                            <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                        )}
                        </motion.button>
                    </div>

                    <div className="p-8 space-y-10">
                        {/* BIO SECTION */}
                        <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                            <FileText size={16} className="text-teal-500" />
                            Professional Biography
                        </div>
                        <textarea 
                            name="bio"
                            value={formData?.bio}
                            onChange={handleChange}
                            placeholder="Tell patients about your expertise..."
                            className="w-full bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-teal-500/30 focus:bg-white dark:focus:bg-gray-800 rounded-[1.5rem] p-5 text-sm font-medium transition-all outline-none dark:text-white min-h-[120px]"
                        />
                        </div>

                        {/* FEE & SLOT ROW */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                              <IndianRupee size={16} className="text-teal-500" />
                              Consultation Fee

                              <Tooltip text="This fee is set by hospital administration and cannot be edited">
                                <AlertCircle size={14} className="text-gray-400 cursor-help" />
                              </Tooltip>
                            </div>

                            <input
                              type="number"
                              value={formData?.consultationFee ?? ""}
                              disabled
                              className="w-full bg-gray-100 dark:bg-gray-800/40 border-2 border-dashed border-gray-300 rounded-2xl py-4 pl-12 pr-6 text-base font-black outline-none cursor-not-allowed dark:text-gray-400"
                            />
                          </div>


                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                              <Clock size={16} className="text-teal-500" />
                              Slot Duration

                              <Tooltip text="Slot duration is defined by the department for queue consistency">
                                <AlertCircle size={14} className="text-gray-400 cursor-help" />
                              </Tooltip>
                            </div>

                            <select
                              value={formData?.slotDurationMinutes}
                              disabled
                              className="w-full bg-gray-100 dark:bg-gray-800/40 border-2 border-dashed border-gray-300 rounded-2xl p-4 text-base font-black outline-none cursor-not-allowed dark:text-gray-400"
                            >
                              {[5, 10, 15, 20, 30].map(m => (
                                <option key={m} value={m}>{m} Minutes / Patient</option>
                              ))}
                            </select>
                          </div>

                        </div>

                        {/* OPD TIMINGS SECTION */}
                        <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                            <Calendar size={16} className="text-teal-500" />
                            OPD Schedule
                            </div>
                            <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={addTiming}
                            className="px-4 py-2 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-teal-100 transition-colors"
                            >
                            <Plus size={14} /> Add Timing
                            </motion.button>
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence>
                            {(formData?.opdTimings ?? []).map((timing, idx) => (
                                <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-[1.5rem] border border-transparent hover:border-teal-500/20 transition-all"
                                >
                                <div className="flex-1 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                                    <Calendar size={18} className="text-teal-500" />
                                    </div>
                                    <select 
                                    value={timing.day}
                                    onChange={(e) => updateTiming(idx, 'day', e.target.value)}
                                    className="bg-transparent border-none text-sm font-black text-gray-800 dark:text-white focus:ring-0 outline-none"
                                    >
                                    {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(d => <option key={d} 
                                            className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white"
                                            value={d}   
                                        >{d}</option>)}
                                    </select>
                                </div>

                                <div className="flex items-center gap-4 flex-[2]">
                                    <div className="flex-1 relative">
                                    <input 
                                        type="time" 
                                        value={timing.startTime}
                                        onChange={(e) => updateTiming(idx, 'startTime', e.target.value)}
                                        className="w-full bg-white dark:bg-gray-800 border-none rounded-xl text-xs font-bold p-3 dark:text-white shadow-sm"
                                    />
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300" />
                                    <div className="flex-1 relative">
                                    <input 
                                        type="time" 
                                        value={timing.endTime}
                                        onChange={(e) => updateTiming(idx, 'endTime', e.target.value)}
                                        className="w-full bg-white dark:bg-gray-800 border-none rounded-xl text-xs font-bold p-3 dark:text-white shadow-sm"
                                    />
                                    </div>
                                </div>

                                <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => removeTiming(idx)}
                                    className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors self-end sm:self-center"
                                >
                                    <Trash2 size={18} />
                                </motion.button>
                                </motion.div>
                            ))}
                            </AnimatePresence>
                        </div>
                        </div>
                    </div>
                    </div>
                </motion.div>
                </div>
            </motion.main>
        </div>
    </>
    
  );
};

export default DoctorProfile;