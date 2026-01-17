import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

const CustomCalendar = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

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

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

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
            ${
              isSelected
                ? "bg-teal-600 text-white shadow-lg shadow-teal-500/40"
                : isToday
                ? "border border-teal-500 text-teal-600"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
        >
          {d}
        </motion.button>
      );
    }
    return days;
  };

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // 🔑 Dynamic year range (Option 1)
  const BASE_YEAR = currentMonth.getFullYear();
  const RANGE = 12;
  const YEARS = Array.from(
    { length: RANGE * 2 + 1 },
    (_, i) => BASE_YEAR - RANGE + i
  );

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm shadow-sm hover:border-teal-500/50 transition-all min-w-[160px]"
      >
        <CalendarIcon size={18} className="text-teal-600" />
        <span className="font-bold text-gray-600 dark:text-gray-300">
          {selectedDate ? new Date(selectedDate).toLocaleDateString() : "Filter by Date"}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] md:bg-transparent"
              onClick={() => {
                setIsOpen(false);
                setShowMonthPicker(false);
                setShowYearPicker(false);
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] mx-auto
                         md:absolute md:top-full md:right-0 md:translate-y-0 md:mt-3
                         w-[calc(100%-2rem)] max-w-[340px] md:w-[320px]
                         bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800
                         rounded-[2.5rem] p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={() => {
                    setShowMonthPicker(!showMonthPicker);
                    setShowYearPicker(false);
                  }}
                  className="font-black text-xs uppercase tracking-widest text-teal-600 hover:underline"
                >
                  {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                </button>

                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Month Picker */}
              {showMonthPicker && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {months.map((m, idx) => (
                    <button
                      key={m}
                      onClick={() => {
                        setCurrentMonth(new Date(currentMonth.getFullYear(), idx, 1));
                        setShowMonthPicker(false);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold
                        ${
                          idx === currentMonth.getMonth()
                            ? "bg-teal-600 text-white"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                        }`}
                    >
                      {m}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setShowYearPicker(true);
                      setShowMonthPicker(false);
                    }}
                    className="col-span-3 py-2 mt-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 dark:bg-teal-500/10"
                  >
                    Select Year
                  </button>
                </div>
              )}

              {/* Year Picker */}
              {showYearPicker && (
                <div className="grid grid-cols-4 gap-2 max-h-[180px] overflow-y-auto mb-4">
                  {YEARS.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
                        setShowYearPicker(false);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold
                        ${
                          year === currentMonth.getFullYear()
                            ? "bg-teal-600 text-white"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                        }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}

              {/* Calendar Grid */}
              {!showMonthPicker && !showYearPicker && (
                <>
                  <div className="grid grid-cols-7 mb-2">
                    {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                      <div key={d} className="h-10 w-10 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {renderDays()}
                  </div>
                </>
              )}

              {selectedDate && (
                <button
                  onClick={() => {
                    onDateSelect("");
                    setIsOpen(false);
                  }}
                  className="w-full mt-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50/50 dark:bg-rose-500/5 rounded-2xl"
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
