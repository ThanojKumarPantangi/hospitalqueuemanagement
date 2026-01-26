import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, ChevronDown } from "lucide-react";

const CustomCalendar = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // --- LOGIC (Preserved) ---
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (showMonthPicker || showYearPicker) return;
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (showMonthPicker || showYearPicker) return;
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const BASE_YEAR = currentMonth.getFullYear();
  const RANGE = 12;
  const YEARS = Array.from({ length: RANGE * 2 + 1 }, (_, i) => BASE_YEAR - RANGE + i);

  // --- ANIMATION VARIANTS ---
  const slideVariants = {
    enter: { x: 20, opacity: 0, scale: 0.95 },
    center: { x: 0, opacity: 1, scale: 1 },
    exit: { x: -20, opacity: 0, scale: 0.95 },
  };

  // --- RENDER HELPERS ---
  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty start slots
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isSelected = selectedDate === dateStr;
      const isToday = new Date().toISOString().slice(0, 10) === dateStr;

      days.push(
        <motion.button
          layoutId={isSelected ? "selected-day" : undefined}
          key={d}
          whileHover={{ scale: 1.1, backgroundColor: isSelected ? "" : "rgba(0,0,0,0.05)" }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onDateSelect(dateStr);
            setIsOpen(false);
          }}
          className={`
            relative h-9 w-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors
            ${isSelected ? "bg-teal-600 text-white shadow-md shadow-teal-500/30 font-bold z-10" : "text-slate-700 dark:text-slate-300"}
            ${!isSelected && isToday ? "text-teal-600 font-bold" : ""}
          `}
        >
          {d}
          {!isSelected && isToday && (
            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-500 rounded-full" />
          )}
        </motion.button>
      );
    }
    return days;
  };

  return (
    <div className="relative z-50">
      {/* --- Trigger Button --- */}
      <motion.button
        layout
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.98 }}
        className={`
          group flex items-center justify-between gap-3 px-4 py-3 min-w-[200px]
          bg-white dark:bg-slate-900 border rounded-2xl shadow-sm hover:shadow-md transition-all
          ${isOpen ? "border-teal-500 ring-2 ring-teal-500/10" : "border-slate-200 dark:border-slate-800 hover:border-teal-500/50"}
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${selectedDate ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-500"} transition-colors`}>
             <CalendarIcon size={18} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
            <span className={`text-sm font-semibold ${selectedDate ? "text-slate-800 dark:text-slate-100" : "text-slate-500"}`}>
              {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'}) : "Select Date"}
            </span>
          </div>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </motion.button>

      {/* --- Animate Presence for Modal --- */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop (Mobile only primarily) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-sm md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
              className="
                fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] mx-auto
                md:absolute md:top-full md:left-0 md:translate-y-2 md:mx-0
                w-[320px] bg-white dark:bg-slate-900 
                border border-slate-100 dark:border-slate-800
                rounded-3xl shadow-2xl overflow-hidden
              "
            >
              <motion.div layout className="p-5">
                
                {/* --- Header Navigation --- */}
                <div className="flex items-center justify-between mb-6">
                  <motion.button 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePrevMonth} 
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </motion.button>

                  <motion.button
                    layout
                    onClick={() => {
                      if (showYearPicker) {
                        setShowYearPicker(false);
                        setShowMonthPicker(false);
                      } else if (showMonthPicker) {
                        setShowYearPicker(true);
                        setShowMonthPicker(false);
                      } else {
                        setShowMonthPicker(true);
                      }
                    }}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <span className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-teal-600 transition-colors">
                      {currentMonth.toLocaleString("default", { month: "long" })}
                    </span>
                    <span className="text-xs font-medium text-slate-400 group-hover:text-teal-500 transition-colors">
                      {currentMonth.getFullYear()}
                    </span>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }}
                    onClick={handleNextMonth} 
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </motion.button>
                </div>

                {/* --- Content Views --- */}
                <div className="relative min-h-[280px]">
                  <AnimatePresence mode="popLayout" initial={false}>
                    
                    {/* 1. Month Picker */}
                    {showMonthPicker && (
                      <motion.div
                        key="month-picker"
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 grid grid-cols-3 gap-3 content-start"
                      >
                        {months.map((m, idx) => (
                          <motion.button
                            key={m}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setCurrentMonth(new Date(currentMonth.getFullYear(), idx, 1));
                              setShowMonthPicker(false);
                            }}
                            className={`
                              py-2 rounded-xl text-sm font-semibold transition-colors
                              ${idx === currentMonth.getMonth() ? "bg-teal-600 text-white shadow-lg shadow-teal-500/30" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"}
                            `}
                          >
                            {m}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}

                    {/* 2. Year Picker */}
                    {showYearPicker && (
                      <motion.div
                        key="year-picker"
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 grid grid-cols-4 gap-2 content-start overflow-y-auto max-h-[280px] custom-scrollbar pr-2"
                      >
                        {YEARS.map((year) => (
                          <motion.button
                            key={year}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
                              setShowYearPicker(false);
                            }}
                            className={`
                              py-2 rounded-xl text-xs font-bold transition-colors
                              ${year === currentMonth.getFullYear() ? "bg-teal-600 text-white shadow-lg shadow-teal-500/30" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"}
                            `}
                          >
                            {year}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}

                    {/* 3. Calendar Grid (Default) */}
                    {!showMonthPicker && !showYearPicker && (
                      <motion.div
                        key="calendar-view"
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                      >
                        {/* Weekday Labels */}
                        <div className="grid grid-cols-7 mb-2">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                            <div key={d} className="flex justify-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {d}
                            </div>
                          ))}
                        </div>
                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-y-1 gap-x-1 justify-items-center">
                          {renderDays()}
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

                {/* --- Footer (Clear) --- */}
                <AnimatePresence>
                  {selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDateSelect("");
                          setIsOpen(false);
                        }}
                        className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-xl transition-colors"
                      >
                        <X size={14} /> Clear Selection
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomCalendar;