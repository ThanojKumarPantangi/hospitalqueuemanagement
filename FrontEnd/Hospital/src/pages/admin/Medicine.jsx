import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  Loader2,
  Pill,
  Sparkles,
  ChevronRight,
  Info
} from "lucide-react";
import {
  getAllMedicineApi,
  searchMedicinesApi,
  getMedicineByIdApi,
  createMedicineApi,
  updateMedicineApi,
  deleteMedicineApi,
} from "../../api/medicine.api";
import { showToast } from "../../utils/toastBus";

/* -------------------------
   constants & helpers 
   ------------------------- */
const PAGE_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 300;

const normalizeApiList = (res) => {
  const payload = res?.data ?? res;
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload?.success && Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

/* -------------------------
   Framer Motion variants 
   ------------------------- */
const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const listItemVariant = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { type: "spring", stiffness: 350, damping: 25 } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: { duration: 0.15 } 
  },
};

const modalBackdropVariant = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(4px)", transition: { duration: 0.2 } },
  exit: { opacity: 0, backdropFilter: "blur(0px)", transition: { duration: 0.2 } },
};

const modalVariant = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 28 } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10, 
    transition: { duration: 0.15 } 
  },
};

/* -------------------------
   defaultVariant 
   ------------------------- */
const defaultVariant = () => ({
  form: "",
  strength: "",
  defaultDosage: "",
  defaultFrequency: "",
  defaultInstructions: "",
});

/* -------------------------
   Skeleton helpers (subtle)
   ------------------------- */

const SkeletonLine = ({ className = "", width = "w-full", height = "h-3", rounded = "rounded-md" }) => (
  <div className={`${width} ${height} ${rounded} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse ${className}`} />
);

const SkeletonAvatar = ({ size = 10 }) => (
  <div className={`w-${size} h-${size} rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse`} />
);

const MedicineSkeletonItem = ({ keyId }) => (
  <div key={keyId} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-6 border-b border-gray-100 dark:border-gray-800/60">
    <div className="flex-1 min-w-0 flex items-start sm:items-center gap-4">
      <div className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-full items-center justify-center bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="min-w-0 flex-1 space-y-2 py-1">
        <SkeletonLine width="w-1/3" height="h-3" />
        <SkeletonLine width="w-1/4" height="h-2" />
      </div>
    </div>

    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
      <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse hidden sm:block" />
    </div>
  </div>
);

/* -------------------------
   component starts 
   ------------------------- */
const MedicineManager = () => {
  // list state & paging
  const [medicines, setMedicines] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // search
  const [query, setQuery] = useState("");
  const searchTimeoutRef = useRef(null);
  const [isSearching, setIsSearching] = useState(false);

  // to avoid re-triggering search when we programmatically set query on selection
  const skipSearchRef = useRef(false);
  

  // ui state
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);

  // modal/form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [form, setForm] = useState({
    id: null,
    name: "",
    genericName: "",
    category: "",
    variants: [defaultVariant()],
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ref for click outside
  const wrapperRef = useRef(null);
  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ---------------------
  // Loading: initial getAll
  // ---------------------
  const loadPage = useCallback(
    async (p = 1, replace = false) => {
      setIsLoadingList(true);
      try {
        const res = await getAllMedicineApi({ page: p, limit: PAGE_LIMIT });
        const list = normalizeApiList(res);
        if (replace) {
          setMedicines(list);
        } else {
          setMedicines((prev) => (p === 1 ? list : [...prev, ...list]));
        }
        setHasMorePages(list.length === PAGE_LIMIT);
        setPage(p);
        setIsOpen(true);
      } catch (err) {
        console.error("getAll error", err);
        showToast({
          type: "error",
          message: err.response?.data?.message || "Failed to load medicines",
        });
      } finally {
        setIsLoadingList(false);
      }
    },
    []
  );

  useEffect(() => {
    loadPage(1, true);
  }, [loadPage]);

  // ---------------------
  // Search: debounced
  // ---------------------
  useEffect(() => {
    // clear previous debounce
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // If we just programmatically updated query (e.g. selection), skip one search cycle
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      setIsSearching(false);
      return;
    }

    // If query is empty or <2 chars -> fallback to full list after debounce
    if (!query || query.trim().length < 2) {
      searchTimeoutRef.current = setTimeout(() => {
        loadPage(1, true);
      }, SEARCH_DEBOUNCE_MS);
      return () => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      };
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await searchMedicinesApi(query.trim(), { page: 1, limit: 50 });
        const list = normalizeApiList(res);
        setMedicines(list);
        setHasMorePages(false);
        setActiveIndex(-1);
        setIsOpen(true);
      } catch (err) {
        console.error("search error", err);
        showToast({
          type: "error",
          message: err.response?.data?.message || "Failed to load medicines",
        });
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, loadPage]);

  const loadMore = async () => {
    if (isLoadingList) return;
    const next = page + 1;
    try {
      setIsLoadingList(true);
      const res = await getAllMedicineApi({ page: next, limit: PAGE_LIMIT });
      const list = normalizeApiList(res);
      setMedicines((prev) => [...prev, ...list]);
      setPage(next);
      setHasMorePages(list.length === PAGE_LIMIT);
    } catch (err) {
      console.error("load more error", err);
      showToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load medicines",
      });
    } finally {
      setIsLoadingList(false);
    }
  };

  // ---------------------
  // Keyboard navigation
  // ---------------------
  const handleInputKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown") {
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev + 1;
        return next >= medicines.length ? 0 : next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev - 1;
        return next < 0 ? Math.max(0, medicines.length - 1) : next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < medicines.length) {
        selectMedicine(medicines[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const selectMedicine = (med) => {
    // Avoid triggering the search effect when we programmatically set query
    skipSearchRef.current = true;
    setQuery(med.name || "");
    setIsOpen(false);
    setActiveIndex(-1);
  };

  // ---------------------
  // Create / Edit / Delete
  // ---------------------
  const openCreate = () => {
    setModalMode("create");
    setForm({
      id: null,
      name: query || "",
      genericName: "",
      category: "",
      variants: [defaultVariant()],
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = async (med) => {
    const id = med.medicineId || med._id || med.id;
    if (!id) {
      showToast({
        type: "error",
        message: "No Id to edit",
      });
      return;
    }
    setIsLoadingList(true); // used also to indicate modal loading skeleton
    try {
      const res = await getMedicineByIdApi(id);
      const payload = res?.data ?? res;
      const medFull = payload?.success ? payload.data : payload;
      setForm({
        id: id,
        name: medFull.name || "",
        genericName: medFull.genericName || "",
        category: medFull.category || "",
        variants: Array.isArray(medFull.variants) && medFull.variants.length > 0 ? medFull.variants : [defaultVariant()],
        isActive: medFull.isActive ?? true,
      });
      setModalMode("edit");
      setIsModalOpen(true);
    } catch (err) {
      console.error("openEdit error", err);
      showToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load medicine details",
      });
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleDelete = async (med) => {
    const id = med.medicineId || med._id || med.id;
    if (!id) return;
    if (!window.confirm(`Are you sure you want to delete "${med.name}"? This action cannot be undone.`)) return;
    try {
      await deleteMedicineApi(id);
      setMedicines((prev) => prev.filter((m) => (m.medicineId || m._id || m.id) !== id));
      showToast({
        type: "success",
        message: "Successfully deleted",
      });
    } catch (err) {
      console.error("delete error", err);
      showToast({
        type: "error",
        message: err.response?.data?.message || "Failed to delete medicine",
      });
    }
  };

  const handleFormChange = (path, value) => {
    if (path.startsWith("variants")) {
      const [, idxStr, field] = path.split(".");
      const idx = parseInt(idxStr, 10);
      setForm((prev) => {
        const variants = prev.variants ? [...prev.variants] : [];
        variants[idx] = { ...(variants[idx] || defaultVariant()), [field]: value };
        return { ...prev, variants };
      });
    } else {
      setForm((prev) => ({ ...prev, [path]: value }));
    }
  };

  const addVariant = () => {
    setForm((prev) => ({ ...prev, variants: [...(prev.variants || []), defaultVariant()] }));
  };

  const removeVariant = (index) => {
    setForm((prev) => {
      const variants = [...(prev.variants || [])];
      variants.splice(index, 1);
      return { ...prev, variants: variants.length ? variants : [defaultVariant()] };
    });
  };

  const validateForm = () => {
    if (!form.name || form.name.trim() === "") {
      showToast({ type: "error", message: "Name is required" });
      return false;
    }
    if (!form.variants || form.variants.length === 0) {
      showToast({ type: "error", message: "Add at least one variant" });
      return false;
    }
    for (let i = 0; i < form.variants.length; i++) {
      const v = form.variants[i];
      if (!v.form || !v.form.trim()) {
        showToast({ type: "error", message: `Variant ${i + 1}: form is required` });
        return false;
      }
      if (!v.strength || !v.strength.trim()) {
        showToast({ type: "error", message: `Variant ${i + 1}: strength is required` });
        return false;
      }
    }
    return true;
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    const payload = {
      name: form.name,
      genericName: form.genericName,
      category: form.category,
      variants: form.variants,
      isActive: form.isActive,
    };
    try {
      if (modalMode === "create") {
        await createMedicineApi(payload);
        showToast({ type: "success", message: "Medicine created successfully" });
      } else {
        await updateMedicineApi(form.id, payload);
        showToast({ type: "success", message: "Medicine updated successfully" });
      }
      setIsModalOpen(false);
      // refresh based on current query
      if (!query || query.trim().length < 2) {
        loadPage(1, true);
      } else {
        try {
          const res = await searchMedicinesApi(query.trim(), { page: 1, limit: 50 });
          const list = normalizeApiList(res);
          setMedicines(list);
        } catch {
          loadPage(1, true);
        }
      }
    } catch (err) {
      console.error("submit error", err);
      showToast({
        type: "error",
        message: err.response?.data?.message || "Failed to save medicine",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleItemClick = (med) => {
    selectMedicine(med);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-6 md:p-8 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20 shadow-xl ring-1 ring-white/10">
              <Pill size={24} className="animate-pulse" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Medicine Directory</h2>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                Manage medicines and inventory variants
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-xl shadow-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-medium sm:w-auto w-full"
            aria-label="Add new medicine"
          >
            <Plus size={18} />
            <span>Add Medicine</span>
          </motion.button>
        </div>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 overflow-hidden">
          
          {/* Search Input */}
          <div ref={wrapperRef} className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700/50">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                {isSearching ? (
                  // subtle skeleton instead of spinner
                  <div className="w-6 h-3 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                ) : (
                  <Search size={20} />
                )}
              </div>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setIsOpen(true)}
                placeholder="Search by generic or brand name..."
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all shadow-sm"
                aria-label="Search medicines"
                aria-autocomplete="list"
                aria-expanded={isOpen}
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); loadPage(1, true); }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* List Section */}
          <div className={`transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-100"}`}>
            <div className="px-6 py-3 bg-gray-50/50 dark:bg-gray-900/20 flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <span>{isSearching ? "Searching..." : isLoadingList ? "Loading..." : `${medicines.length} Results`}</span>
              <span>Page {page}</span>
            </div>

            <ul className="max-h-[500px] overflow-y-auto custom-scrollbar">
              {/* Show subtle skeletons while list loads */}
              {isLoadingList && (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <MedicineSkeletonItem keyId={i} key={i} />
                  ))}
                </>
              )}

              {/* original empty-state preserved */}
              {medicines.length === 0 && !isLoadingList && (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Search size={24} className="text-gray-400" />
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 font-medium">No medicines found</div>
                  <p className="text-sm text-gray-400">Try adjusting your search or add a new medicine.</p>
                </div>
              )}

              <AnimatePresence mode="popLayout">
                <motion.div
                  variants={containerVariant}
                  initial="hidden"
                  animate="visible"
                >
                  {!isLoadingList && medicines.map((med, idx) => {
                    // ensure stable unique key even if some IDs duplicate in backend
                    const rawId = med.medicineId || med._id || med.id;
                    const id = rawId ?? `no-id`;
                    const uniqueKey = `${id}-${idx}`;

                    const variant = Array.isArray(med.variants) && med.variants.length > 0 ? med.variants[0] : {};
                    const selected = idx === activeIndex;
                    
                    return (
                      <motion.li
                        layout
                        variants={listItemVariant}
                        key={uniqueKey}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => handleItemClick(med)}
                        className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-6 border-b border-gray-100 dark:border-gray-800/60 cursor-pointer transition-all ${
                          selected ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        }`}
                        role="option"
                        aria-selected={selected}
                      >
                        <div className="flex-1 min-w-0 flex items-start sm:items-center gap-4">
                          <div className={`hidden sm:flex flex-shrink-0 w-10 h-10 rounded-full items-center justify-center transition-colors ${
                            selected ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500"
                          }`}>
                            <Pill size={18} />
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base">
                                {med.name}
                              </span>
                              {med.isActive !== false ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                                  <CheckCircle size={10} /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 ring-1 ring-inset ring-gray-500/20">
                                  Inactive
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                              <span className="truncate">{variant.form || med.form || "Unknown form"} {variant.strength ? `• ${variant.strength}` : ""}</span>
                              {med.category && (
                                <>
                                  <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                  <span className="truncate px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-medium">{med.category}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:opacity-0 sm:-translate-x-2 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 transition-all duration-200">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(med); }}
                            className="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            title="Edit Medicine"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(med); }}
                            className="flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
                            title="Delete Medicine"
                          >
                            <Trash2 size={16} />
                          </button>
                          <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 ml-1 hidden sm:block" />
                        </div>
                      </motion.li>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </ul>

            {/* Pagination Footer */}
            <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between rounded-b-3xl">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Info size={16} />
                {isLoadingList ? "Syncing database..." : hasMorePages ? "Showing partial results" : "All records loaded"}
              </div>
              
              {!isSearching && hasMorePages && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={loadMore}
                  disabled={isLoadingList}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoadingList ? (
                    <div className="w-4 h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  ) : null}
                  {isLoadingList ? "Loading..." : "Load More"}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Overlay & Container */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            variants={modalBackdropVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              variants={modalVariant}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
            >
              {/* Modal Header (Sticky) */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {modalMode === "create" ? "Add New Medicine" : "Edit Medicine Details"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {modalMode === "create" ? "Fill in the details to catalog a new item." : "Update information and manage inventory variants."}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <label className="hidden sm:flex items-center gap-2 text-sm font-medium cursor-pointer select-none bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
                    <input
                      type="checkbox"
                      checked={!!form.isActive}
                      onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 transition-colors"
                      aria-label="Active status"
                    />
                    Is Active
                  </label>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-all"
                    aria-label="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-gray-50/30 dark:bg-transparent">
                {/* If modal is loading (openEdit), show modal skeletons instead of form */}
                {isLoadingList && modalMode === "edit" ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <SkeletonLine width="w-1/3" height="h-5" />
                      <SkeletonLine width="w-2/3" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <SkeletonLine width="w-full" />
                      <SkeletonLine width="w-full" />
                    </div>

                    <div className="space-y-4">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                            <SkeletonLine width="w-1/4" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <SkeletonLine width="w-full" />
                            <SkeletonLine width="w-full" />
                            <SkeletonLine width="w-full" />
                            <SkeletonLine width="w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form id="medicine-form" onSubmit={submitForm} className="space-y-8">
                    
                    {/* General Info Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">General Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand Name <span className="text-red-500">*</span></label>
                          <input
                            required
                            name="name"
                            value={form.name}
                            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. Tylenol"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white shadow-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Generic Name</label>
                          <input
                            name="genericName"
                            value={form.genericName}
                            onChange={(e) => setForm((prev) => ({ ...prev, genericName: e.target.value }))}
                            placeholder="e.g. Paracetamol"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white shadow-sm"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Therapeutic Category</label>
                          <input
                            name="category"
                            value={form.category}
                            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                            placeholder="e.g. Analgesic, Antipyretic"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Variants Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Inventory Variants</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add different forms, strengths, and dosages for this medicine.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                          {form.variants.map((v, idx) => (
                            <motion.div
                              layout
                              key={idx}
                              initial={{ opacity: 0, scale: 0.98, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, height: 0, overflow: "hidden" }}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                              className="relative border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800 shadow-sm group"
                            >
                              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold">
                                    {idx + 1}
                                  </span>
                                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Variant Details</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeVariant(idx)}
                                  className="flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
                                  title="Remove Variant"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Form <span className="text-red-500">*</span></label>
                                  <input
                                    required
                                    value={v.form}
                                    onChange={(e) => handleFormChange(`variants.${idx}.form`, e.target.value)}
                                    placeholder="e.g. Tablet, Syrup"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Strength <span className="text-red-500">*</span></label>
                                  <input
                                    required
                                    value={v.strength}
                                    onChange={(e) => handleFormChange(`variants.${idx}.strength`, e.target.value)}
                                    placeholder="e.g. 500mg"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Default Dosage</label>
                                  <input
                                    value={v.defaultDosage}
                                    onChange={(e) => handleFormChange(`variants.${idx}.defaultDosage`, e.target.value)}
                                    placeholder="e.g. 1 Tablet"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Default Frequency</label>
                                  <input
                                    value={v.defaultFrequency}
                                    onChange={(e) => handleFormChange(`variants.${idx}.defaultFrequency`, e.target.value)}
                                    placeholder="e.g. Twice a day"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                  />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Special Instructions</label>
                                  <input
                                    value={v.defaultInstructions}
                                    onChange={(e) => handleFormChange(`variants.${idx}.defaultInstructions`, e.target.value)}
                                    placeholder="e.g. Take after meals"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        <motion.button
                          layout
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          type="button"
                          onClick={addVariant}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all"
                        >
                          <Plus size={18} /> Add Another Variant
                        </motion.button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Modal Footer (Sticky) */}
              <div className="flex-shrink-0 flex items-center justify-between sm:justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 mt-auto">
                <label className="sm:hidden flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  Active
                </label>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="medicine-form"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-md shadow-blue-500/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        <span>{modalMode === "create" ? "Create Medicine" : "Save Changes"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicineManager;