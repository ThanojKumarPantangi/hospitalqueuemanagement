import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

const CustomCalendar = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isSelected = selectedDate === dateStr;
      const isToday = new Date().toISOString().slice(0, 10) === dateStr;

      days.push(
        <motion.button
          key={d}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            onDateSelect(dateStr);
            setIsOpen(false);
          }}
          className={`h-10 w-10 flex items-center justify-center rounded-xl text-xs font-bold transition-all
            ${isSelected ? "bg-teal-600 text-white shadow-lg shadow-teal-500/40" : 
              isToday ? "border border-teal-500 text-teal-600" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}
          `}
        >
          {d}
        </motion.button>
      );
    }
    return days;
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm shadow-sm hover:border-teal-500/50 transition-all min-w-[160px]"
      >
        <CalendarIcon size={18} className="text-teal-600" />
        <span className="font-bold text-gray-600 dark:text-gray-300">
          {selectedDate ? new Date(selectedDate).toLocaleDateString() : "Filter by Date"}
        </span>
      </button>

    {/* Calendar Dropdown */}
    <AnimatePresence>
        {isOpen && (
            <>
            {/* Backdrop: Darkens the background on mobile to focus on the calendar */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-none" 
                onClick={() => setIsOpen(false)} 
            />
            
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="
                /* Mobile: Fixed center of screen */
                fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] mx-auto
                /* Desktop: Absolute dropdown under button */
                md:absolute md:top-full md:left-auto md:right-0 md:translate-y-0 md:inset-x-auto md:mt-3
                
                w-[calc(100%-2rem)] max-w-[340px] md:w-[320px]
                bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 
                rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-xl
                "
            >
                {/* ... (Rest of your internal calendar content remains the same) ... */}
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <h4 className="font-black text-xs uppercase tracking-widest text-teal-600">
                    {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                </h4>
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <ChevronRight size={20} />
                </button>
                </div>

                {/* Day Labels */}
                <div className="grid grid-cols-7 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} className="h-10 w-10 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase">
                    {day}
                    </div>
                ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1">
                {renderDays()}
                </div>

                {/* Clear Option */}
                {selectedDate && (
                <button
                    onClick={() => { onDateSelect(""); setIsOpen(false); }}
                    className="w-full mt-4 py-3 text-[10px] font-black text-rose-500 bg-rose-50/50 dark:bg-rose-500/5 uppercase tracking-widest rounded-2xl transition-all"
                >
                    Clear Filter
                </button>
                )}
            </motion.div>
            </>
        )}
    </AnimatePresence>
    </div>
  );
};

export default CustomCalendar;