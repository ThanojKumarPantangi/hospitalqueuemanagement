import React, { useEffect, useRef, useState } from "react";
import {
  createTemplateApi,
  getTemplatesApi,
  updateTemplateApi,
  deleteTemplateApi,
  searchMedicinesApi,
} from "../../api/medicine.api";
import { showToast } from "../../utils/toastBus";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, Trash2, Edit2, Lock, Unlock,
  Search, Pill, FileText, Stethoscope,
  CalendarDays, Activity, AlertCircle, Clock,
  Save, CheckCircle2
} from "lucide-react";

/* ---------------- Helpers ---------------- */

const createEmptyMedicine = () => ({
  id: crypto.randomUUID(),
  medicineId: "",
  medicineName: "",
  variants: [],
  form: "",
  strength: "",
  dosage: "",
  isDosageLocked: true,
  frequency: "",
  duration: "",
  instructions: "",
});

const buildVariantOptionsFromSearch = (searchArray = []) => {
  const out = [];
  (searchArray || []).forEach((item, itemIdx) => {
    // flattened variant object (detect presence of form/strength)
    if (item && (item.medicineId || item._id || item.medicine_id) && (item.form !== undefined || item.strength !== undefined)) {
      const medicineId = item.medicineId || item.medicine_id || item._id;
      const name = item.name || item.medicineName || (item.medicine && item.medicine.name) || "";
      const form = item.form || (item.variant && item.variant.form) || "";
      const strength = item.strength || (item.variant && item.variant.strength) || "";
      const defaultDosage = item.defaultDosage ?? item.default_dosage ?? "";
      const defaultFrequency = item.defaultFrequency ?? item.default_frequency ?? "";
      const defaultInstructions = item.defaultInstructions ?? item.default_instructions ?? "";
      const key = `${medicineId || "m"}|||${form}|||${strength}|||${itemIdx}`;
      out.push({ key, medicineId, name, form, strength, defaultDosage, defaultFrequency, defaultInstructions });
      return;
    }

    // full medicine doc with variants
    if (item && (item._id || item.id) && Array.isArray(item.variants) && item.variants.length > 0) {
      const medicineId = item._id || item.id;
      const name = item.name || "";
      item.variants.forEach((v, vi) => {
        const form = v?.form || "";
        const strength = v?.strength || "";
        const defaultDosage = v?.defaultDosage ?? v?.default_dosage ?? "";
        const defaultFrequency = v?.defaultFrequency ?? v?.default_frequency ?? "";
        const defaultInstructions = v?.defaultInstructions ?? v?.default_instructions ?? "";
        const key = `${medicineId}|||${form}|||${strength}|||${itemIdx}-${vi}`;
        out.push({ key, medicineId, name, form, strength, defaultDosage, defaultFrequency, defaultInstructions });
      });
      return;
    }

    // fallback - unknown shape but has id/name: add without variant details
    if (item && (item._id || item.id || item.medicineId || item.name)) {
      const medicineId = item._id || item.id || item.medicineId || `fallback-${itemIdx}`;
      const name = item.name || item.medicineName || "";
      const key = `${medicineId}|||no-variant|||${itemIdx}`;
      out.push({ key, medicineId, name, form: "", strength: "", defaultDosage: "", defaultFrequency: "", defaultInstructions: "" });
    }
  });

  return out;
};

/* ---------------- Animation Variants ---------------- */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// Updated Modal Animations
const backdropVariants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(8px)", transition: { duration: 0.3 } },
  exit: { opacity: 0, backdropFilter: "blur(0px)", transition: { duration: 0.2 } }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 30, rotateX: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    rotateX: 0,
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 350,
      mass: 0.8
    } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20, 
    transition: { duration: 0.2, ease: "easeIn" } 
  }
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } },
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }
};

const medicineCardVariants = {
  hidden: { opacity: 0, x: -20, height: 0, marginBottom: 0 },
  visible: { opacity: 1, x: 0, height: "auto", marginBottom: 20, transition: { type: "spring", bounce: 0.3 } },
  exit: { opacity: 0, x: 50, height: 0, marginBottom: 0, transition: { duration: 0.2 } }
};

/* ---------------- Component ---------------- */

const DoctorTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    defaultDiagnosis: "",
    defaultFollowUpDays: "",
    medicines: [createEmptyMedicine()],
  });

  const [variantOptions, setVariantOptions] = useState([]);
  const [searchIndex, setSearchIndex] = useState(null);
  const searchTimeoutRef = useRef(null);
  const modalRef = useRef(null);

  /* ---------------- Fetch Templates ---------------- */

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await getTemplatesApi();
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setTemplates(list);
    } catch (err) {
      console.error("fetchTemplates error", err);
      showToast({ type: "error", message: err?.response?.data?.message || "Failed to fetch templates" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  /* ---------------- Search (debounced) ---------------- */

  const handleSearch = (value, index) => {
    updateMedicine(index, "medicineName", value);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!value || value.trim().length < 2) {
      setVariantOptions([]);
      setSearchIndex(null);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await searchMedicinesApi(value.trim());
        const dataArray = Array.isArray(res?.data?.data) ? res.data.data : [];
        const options = buildVariantOptionsFromSearch(dataArray);
        setVariantOptions(options);
        setSearchIndex(index);
      } catch (err) {
        console.error("searchMedicinesApi error", err);
        setVariantOptions([]);
        setSearchIndex(null);
      }
    }, 300);
  };

  const clearSearch = () => {
    setVariantOptions([]);
    setSearchIndex(null);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  };

  /* ---------------- Variant selection (GLOBAL DEFAULTS) ---------------- */

  const selectVariantOption = (opt, index) => {
    const medicineId = opt?.medicineId || opt?.medicine_id || opt?._id || "";
    const name = opt?.name || opt?.medicineName || "";
    const form = opt?.form || "";
    const strength = opt?.strength || "";
    const defaultDosage = opt?.defaultDosage ?? opt?.default_dosage ?? "";
    const defaultFrequency = opt?.defaultFrequency ?? opt?.default_frequency ?? "";
    const defaultInstructions = opt?.defaultInstructions ?? opt?.default_instructions ?? "";

    setFormData((prev) => {
      const next = prev.medicines.map((m, i) =>
        i === index
          ? {
              ...m,
              medicineId,
              medicineName: name,
              form,
              strength,
              dosage: strength || defaultDosage || "", 
              isDosageLocked: true, 
              frequency: defaultFrequency || "", 
              instructions: defaultInstructions || "", 
              duration: "",
            }
          : m
      );
      return { ...prev, medicines: next };
    });

    clearSearch();
  };

  /* ---------------- Modal Controls ---------------- */

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormData({ name: "", defaultDiagnosis: "", defaultFollowUpDays: "", medicines: [createEmptyMedicine()] });
    clearSearch();
    setIsModalOpen(true);
  };

  const openEditModal = (template) => {
    setEditingTemplate(template);
    const meds = Array.isArray(template.medicines) ? template.medicines : [];
    const mapped = meds.map((m) => {
      const medObj = m.medicine && typeof m.medicine === "object" ? m.medicine : null;
      const medicineId = medObj?._id || m.medicine || m.medicineId || "";
      const medicineName = medObj?.name || m.medicineName || "";
      const variants = Array.isArray(medObj?.variants) ? medObj.variants : [];
      return {
        id: crypto.randomUUID(),
        medicineId,
        medicineName,
        variants,
        form: m.variant?.form || "",
        strength: m.variant?.strength || "",
        dosage: m.dosage || "",
        isDosageLocked: true,
        frequency: m.frequency || "",
        duration: m.duration || "",
        instructions: m.instructions || "",
      };
    });

    setFormData({
      name: template.name || "",
      defaultDiagnosis: template.defaultDiagnosis || "",
      defaultFollowUpDays: template.defaultFollowUpDays ?? "",
      medicines: mapped.length ? mapped : [createEmptyMedicine()],
    });
    clearSearch();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
        setEditingTemplate(null);
        clearSearch();
    }, 300); // Wait for exit animation
  };

  /* ---------------- Medicine Row logic ---------------- */

  const addMedicine = () => setFormData((p) => ({ ...p, medicines: [...p.medicines, createEmptyMedicine()] }));
  const removeMedicine = (id) => setFormData((p) => ({ ...p, medicines: p.medicines.filter((m) => m.id !== id) }));

  const updateMedicine = (index, field, value) =>
    setFormData((p) => {
      const updated = p.medicines.map((m, i) => (i === index ? { ...m, [field]: value } : m));
      return { ...p, medicines: updated };
    });

  const toggleDosageLock = (index) =>
    setFormData((p) => {
      const updated = p.medicines.map((m, i) => (i === index ? { ...m, isDosageLocked: !m.isDosageLocked } : m));
      return { ...p, medicines: updated };
    });

  /* ---------------- Submit ---------------- */

  const handleSubmit = async () => {
    if (!formData.name || !formData.name.trim()) {
      showToast({ type: "error", message: "Template name required" });
      return;
    }

    const medicinesPayload = formData.medicines
      .filter((m) => m.medicineId)
      .map((m) => ({
        medicine: m.medicineId,
        variant: { form: m.form, strength: m.strength },
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
      }));

    if (medicinesPayload.length === 0) {
      showToast({ type: "error", message: "Add at least one valid medicine." });
      return;
    }

    const payload = {
      name: formData.name,
      defaultDiagnosis: formData.defaultDiagnosis || "",
      defaultFollowUpDays: formData.defaultFollowUpDays !== "" ? Number(formData.defaultFollowUpDays) : null,
      medicines: medicinesPayload,
    };

    try {
      if (editingTemplate && editingTemplate._id) {
        await updateTemplateApi(editingTemplate._id, payload);
        showToast({ type: "success", message: "Template updated successfully" });
      } else {
        await createTemplateApi(payload);
        showToast({ type: "success", message: "Template created successfully" });
      }
      closeModal();
      fetchTemplates();
    } catch (err) {
      console.error("save template error", err);
      showToast({ type: "error", message: err?.response?.data?.message || "Operation failed" });
    }
  };

  /* ---------------- Delete ---------------- */

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this template? This action cannot be undone.")) return;
    try {
      await deleteTemplateApi(id);
      showToast({ type: "success", message: "Template deleted" });
      fetchTemplates();
    } catch (err) {
      console.error("delete template error", err);
      showToast({ type: "error", message: "Delete failed" });
    }
  };

  /* ---------------- Common Form Element Styles ---------------- */
  // Refined input styling for a cleaner look
  const inputBaseClass = "w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-slate-100 placeholder:text-slate-400 font-medium shadow-sm hover:border-slate-300 dark:hover:border-slate-600";
  const labelClass = "block text-[12px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2 ml-1";

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">

      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <FileText className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Prescription Templates
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Manage and quickly apply your frequently used prescriptions.
              </p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateModal} 
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Plus size={20} strokeWidth={2.5} /> 
            <span>New Template</span>
          </motion.button>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm"
          >
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-full mb-5">
              <FileText className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Templates Created</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
              Speed up your workflow by creating standard prescriptions for common diagnoses.
            </p>
            <motion.button 
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={openCreateModal} 
              className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-xl font-medium shadow-lg transition-all flex items-center gap-2"
            >
              <Plus size={18} /> Create Your First Template
            </motion.button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {templates.map((t) => (
              <motion.div 
                key={t._id || t.name} 
                variants={itemVariants}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300 flex flex-col h-full"
              >
                <div className="absolute top-4 right-4 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(t)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-xl transition-colors shadow-sm" aria-label="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(t._id)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-xl transition-colors shadow-sm" aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mb-6 pr-20 flex-1">
                  <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 line-clamp-1" title={t.name}>
                    {t.name}
                  </h3>
                  {t.defaultDiagnosis && (
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg mt-3 border border-indigo-100 dark:border-indigo-800/50">
                      <Stethoscope size={14} />
                      <span className="truncate">{t.defaultDiagnosis}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-5 mt-auto">
                  <div className="flex items-center gap-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-sky-50 dark:bg-sky-900/30 rounded-lg text-sky-500">
                        <Pill size={16} />
                      </div>
                      <span>{Array.isArray(t.medicines) ? t.medicines.length : 0} Meds</span>
                    </div>
                    {t.defaultFollowUpDays && (
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-500">
                          <CalendarDays size={16} />
                        </div>
                        <span>{t.defaultFollowUpDays}d F/U</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Improved Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden perspective-1000">
              
              {/* Animated Backdrop */}
              <motion.div 
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={closeModal}
                className="absolute inset-0 bg-slate-900/60"
              />
              
              {/* Modal Container */}
              <motion.div 
                ref={modalRef} 
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] border border-slate-200/50 dark:border-slate-800 overflow-hidden"
              >
                {/* Decorative Header Background */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10 pointer-events-none" />

                {/* Modal Header */}
                <div className="flex justify-between items-start px-8 py-6 border-b border-slate-100 dark:border-slate-800/80 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl shadow-inner">
                      <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {editingTemplate ? "Edit Template" : "New Template"}
                      </h2>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Configure rapid-assignment settings and drug protocols.
                      </p>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeModal} 
                    className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </motion.button>
                </div>

                {/* Modal Body (Scrollable Form) */}
                <div className="no-scrollbar overflow-y-auto p-4 sm:p-8 space-y-10 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 relative z-0">
                  
                  {/* General Settings Section */}
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 rounded-l-[2rem] opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">General Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-12">
                        <label className={labelClass}>Template Name <span className="text-rose-500 ml-1">*</span></label>
                        <input 
                          placeholder="e.g., Standard Viral Fever Protocol" 
                          className={`${inputBaseClass} text-lg py-4`} 
                          value={formData.name} 
                          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} 
                          autoFocus 
                        />
                      </div>
                      <div className="md:col-span-7">
                        <label className={labelClass}>Default Diagnosis <span className="text-slate-400 normal-case font-normal ml-1">(Optional)</span></label>
                        <div className="relative group/input">
                          <Activity size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" />
                          <input placeholder="e.g., Viral Pyrexia" className={`${inputBaseClass} pl-12`} value={formData.defaultDiagnosis} onChange={(e) => setFormData((p) => ({ ...p, defaultDiagnosis: e.target.value }))} />
                        </div>
                      </div>
                      <div className="md:col-span-5">
                        <label className={labelClass}>Follow-up (Days)</label>
                        <div className="relative group/input">
                          <CalendarDays size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" />
                          <input placeholder="e.g., 5" type="number" className={`${inputBaseClass} pl-12`} value={formData.defaultFollowUpDays ?? ""} onChange={(e) => setFormData((p) => ({ ...p, defaultFollowUpDays: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medications List Section */}
                  <div>
                    <div className="flex items-center justify-between mb-6 px-2 z-20  bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm py-2 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-sky-100 dark:bg-sky-900/40 rounded-xl">
                          <Pill className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Prescribed Medications</h3>
                        <span className="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 py-1 px-3 rounded-full text-sm font-bold ml-2">
                          {formData.medicines.length}
                        </span>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={addMedicine} 
                        className="text-sm flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-500 hover:shadow-md text-sky-600 dark:text-sky-400 font-bold px-5 py-2.5 rounded-xl transition-all"
                      >
                        <Plus size={18} strokeWidth={2.5} /> Add Drug
                      </motion.button>
                    </div>

                    <div className="space-y-6">
                      <AnimatePresence initial={false}>
                        {formData.medicines.map((m, index) => (
                          <motion.div 
                            key={m.id} 
                            layout
                            variants={medicineCardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200/80 dark:border-slate-800 relative z-10 hover:border-sky-200 dark:hover:border-sky-800/50 transition-colors overflow-visible"
                          >
                            {/* Card Content */}
                            <div className="p-6 sm:p-8">
                              {/* Header & Remove */}
                              <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm shadow-inner">
                                    {(index + 1).toString().padStart(2, '0')}
                                  </div>
                                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Drug Details</h4>
                                </div>
                                <motion.button 
                                  whileHover={{ scale: 1.1, backgroundColor: "rgb(254 226 226)" }}
                                  whileTap={{ scale: 0.9 }}
                                  type="button" 
                                  onClick={() => removeMedicine(m.id)} 
                                  className="p-2.5 text-rose-500 dark:text-rose-400 hover:text-rose-700 rounded-xl transition-colors bg-rose-50/50 dark:bg-rose-900/20" 
                                  aria-label="Remove medicine"
                                >
                                  <Trash2 size={20} />
                                </motion.button>
                              </div>

                              <div className="space-y-6">
                                {/* Search Row */}
                                <div className="relative z-30">
                                  <label className={labelClass}>Drug Name <span className="text-rose-500">*</span></label>
                                  <div className="relative group/search">
                                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-sky-500 transition-colors" />
                                    <input
                                      placeholder="Search medicine by name..."
                                      className={`${inputBaseClass} pl-12 text-base py-3.5`}
                                      value={m.medicineName}
                                      onChange={(e) => handleSearch(e.target.value, index)}
                                      onFocus={() => { if (m.medicineName && m.medicineName.length >= 2) setSearchIndex(index); }}
                                    />

                                    {/* Selected Variant Badge */}
                                    {(m.form || m.strength) && (
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-100 dark:border-sky-800/50 shadow-sm">
                                          {m.form} {m.strength ? `· ${m.strength}` : ""}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Glassmorphic Dropdown Menu */}
                                  <AnimatePresence>
                                    {searchIndex === index && Array.isArray(variantOptions) && variantOptions.length > 0 && (
                                      <motion.div 
                                        variants={dropdownVariants}
                                        initial="hidden" animate="visible" exit="exit"
                                        className="absolute left-0 right-0 mt-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-72 overflow-auto py-2 z-50 ring-1 ring-black/5"
                                      >
                                        {variantOptions.map((opt, oi) => (
                                          <div
                                            key={opt.key || `${opt.medicineId || "m"}|||${opt.form}|||${opt.strength}|||${oi}`}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => selectVariantOption(opt, index)}
                                            className="px-6 py-3.5 cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                                          >
                                            <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                                              <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-400">
                                                <Pill size={16} />
                                              </div>
                                              {opt.name}
                                            </div>
                                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-inner">
                                              {opt.form ? `${opt.form} ${opt.strength ? `· ${opt.strength}` : ''}` : "General"}
                                            </div>
                                          </div>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>

                                {/* Prescription Rules Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 z-10 relative">
                                  <div className="sm:col-span-4">
                                    <label className={labelClass}>Dosage</label>
                                    <div className="relative group/input">
                                      <input 
                                        placeholder="e.g., 500mg" 
                                        className={`${inputBaseClass} pr-12 ${m.isDosageLocked ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-dashed cursor-not-allowed opacity-80' : ''}`} 
                                        value={m.dosage} 
                                        onChange={(e) => updateMedicine(index, "dosage", e.target.value)} 
                                        disabled={!!m.isDosageLocked} 
                                      />
                                      <button 
                                        type="button" 
                                        onClick={() => toggleDosageLock(index)} 
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${m.isDosageLocked ? 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30' : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 shadow-sm'}`}
                                        title={m.isDosageLocked ? "Unlock to edit dosage" : "Lock dosage"}
                                      >
                                        {m.isDosageLocked ? <Lock size={16} /> : <Unlock size={16} />}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="sm:col-span-4">
                                    <label className={labelClass}>Frequency</label>
                                    <div className="relative group/input">
                                      <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-sky-500 transition-colors" />
                                      <input placeholder="e.g., 1-0-1" className={`${inputBaseClass} pl-12`} value={m.frequency} onChange={(e) => updateMedicine(index, "frequency", e.target.value)} />
                                    </div>
                                  </div>

                                  <div className="sm:col-span-4">
                                    <label className={labelClass}>Duration</label>
                                    <div className="relative group/input">
                                      <CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-sky-500 transition-colors" />
                                      <input placeholder="e.g., 5 Days" className={`${inputBaseClass} pl-12`} value={m.duration} onChange={(e) => updateMedicine(index, "duration", e.target.value)} />
                                    </div>
                                  </div>
                                </div>

                                {/* Instructions */}
                                <div className="relative z-0">
                                  <label className={labelClass}>Special Instructions</label>
                                  <div className="relative group/input">
                                    <AlertCircle size={20} className="absolute left-4 top-4 text-slate-400 group-focus-within/input:text-amber-500 transition-colors" />
                                    <textarea 
                                      placeholder="e.g., Take after meals, avoid dairy..." 
                                      className={`${inputBaseClass} pl-12 py-3.5 resize-none min-h-[90px]`} 
                                      value={m.instructions} 
                                      onChange={(e) => updateMedicine(index, "instructions", e.target.value)} 
                                    />
                                  </div>
                                </div>

                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between z-10 backdrop-blur-md rounded-b-[2.5rem]">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                    <span className="text-rose-500 text-lg leading-none">*</span> Required fields
                  </span>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                    <button onClick={closeModal} className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                      Cancel
                    </button>
                    <motion.button 
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSubmit} 
                      className="px-8 py-3 flex items-center gap-2 rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/30 transition-all border border-indigo-500/20"
                    >
                      <Save size={20} />
                      {editingTemplate ? "Save Changes" : "Create Template"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DoctorTemplates;