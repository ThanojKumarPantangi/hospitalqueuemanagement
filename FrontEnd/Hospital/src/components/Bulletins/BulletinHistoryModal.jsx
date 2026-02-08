import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  Loader2,
  CheckCheck,
  Megaphone,
  CreditCard,
  Users,
  FileText,
} from "lucide-react";
import { useState } from "react";
import HoverReader from "../ui/HoverReader.jsx"

const getTypeConfig = (type) => {
  switch (type) {
    case "PAYMENT":
      return {
        label: "Payment",
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        border: "border-emerald-200 dark:border-emerald-800/30",
        icon: CreditCard,
      };
    case "QUEUE":
      return {
        label: "System",
        color: "text-purple-600",
        bg: "bg-purple-50 dark:bg-purple-500/10",
        border: "border-purple-200 dark:border-purple-800/30",
        icon: Users,
      };
    case "ANNOUNCEMENT":
      return {
        label: "News",
        color: "text-rose-600",
        bg: "bg-rose-50 dark:bg-rose-500/10",
        border: "border-rose-200 dark:border-rose-800/30",
        icon: Megaphone,
      };
    default:
      return {
        label: "General",
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-500/10",
        border: "border-blue-200 dark:border-blue-800/30",
        icon: FileText,
      };
  }
};

export default function BulletinHistoryModal({
  open,
  onClose,
  bulletins = [],
  title = "Notifications",
  onMarkRead,
  onMarkAllRead,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}) {
  const [filter, setFilter] = useState("ALL");

  const unreadCount = bulletins.filter((b) => !b.readAt).length;

  const filteredBulletins = bulletins.filter((b) => {
    if (filter === "UNREAD") return b.readAt === null;
    if (filter === "READ") return b.readAt !== null;
    return true;
  });

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, x: "-50%", y: "-45%" },
    visible: {
      opacity: 1,
      scale: 1,
      x: "-50%",
      y: "-50%",
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        mass: 0.8
      },
    },
    exit: { 
      opacity: 0, 
      scale: 0.98, 
      x: "-50%", 
      y: "-48%",
      transition: { duration: 0.2 }
    },
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="
              fixed z-[70] left-1/2 top-1/2
              w-[95vw] max-w-lg h-[80vh]
              bg-white dark:bg-gray-950
              rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)]
              border border-gray-200/50 dark:border-white/10
              flex flex-col
            "
          >
            {/* Header: Encapsulated with its own rounding */}
            <div className="px-8 pt-8 pb-6 rounded-t-[40px] bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                    {title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                      {unreadCount} New Messages
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-500 hover:scale-110 active:scale-90 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl">
                  {["ALL", "UNREAD"].map((key) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`
                        px-5 py-2 rounded-xl text-xs font-black transition-all
                        ${filter === key
                            ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-xl scale-105"
                            : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"}
                      `}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="flex items-center gap-2 text-xs font-black text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-4 py-2 rounded-xl transition"
                  >
                    <CheckCheck size={16} />
                    ALL READ
                  </button>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 no-scrollbar">
              {filteredBulletins.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20">
                  <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4 border border-dashed border-gray-200 dark:border-white/10">
                    <FileText size={32} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-400">Nothing to see here</p>
                </div>
              ) : (
                <div className="space-y-4 pt-6">
                  <AnimatePresence mode="popLayout">
                    {filteredBulletins.map((b) => {
                      const style = getTypeConfig(b.type);
                      const Icon = style.icon;
                      const isUnread = b.readAt === null;

                      return (
                        <motion.div
                          key={b._id}
                          layout
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                          className={`
                            notification-card-container 
                            relative p-5 rounded-[28px] bg-white dark:bg-white/5
                            border-2 transition-all duration-300
                            ${isUnread ? style.border : "border-transparent dark:border-white/5"}
                            ${isUnread ? "shadow-lg shadow-gray-200/50 dark:shadow-none" : "opacity-80 hover:opacity-100"}
                            hover:border-indigo-500 dark:hover:border-indigo-500/50
                          `}
                        >
                          <div className="flex gap-4">
                            <div className={`flex-shrink-0 w-12 h-12 rounded-[18px] flex items-center justify-center ${style.bg} ${style.color}`}>
                              <Icon size={22} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-tighter ${style.color}`}>
                                  {style.label}
                                </span>
                                <span className="text-[10px] font-medium text-gray-400">
                                  {new Date(b.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              <h4 className="text-[15px] font-black text-gray-900 dark:text-white mb-1 leading-tight">
                                {b.title || "No Title"}
                              </h4>

                              {/* ----------------- FIXED TRUNCATED MESSAGE START ----------------- */}
                              <div className="mt-1">
                                <HoverReader content={b.content} />
                              </div>

                              <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                                  <Clock size={12} />
                                  {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>

                                {isUnread ? (
                                  <button
                                    onClick={() => onMarkRead([b._id])}
                                    className="px-4 py-2 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-[11px] font-black hover:scale-105 active:scale-95 transition"
                                  >
                                    MARK READ
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1 text-[11px] font-black text-emerald-500 italic">
                                    <CheckCheck size={14} /> READ
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {hasMore && filter === "ALL" && (
                    <div className="pt-6 flex justify-center">
                      <button
                        disabled={loadingMore}
                        onClick={onLoadMore}
                        className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 text-xs font-black text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900"
                      >
                        {loadingMore ? (
                          <Loader2 size={16} className="animate-spin text-indigo-500" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-indigo-500 transition-colors" />
                        )}
                        {loadingMore ? "FETCHING..." : "LOAD PREVIOUS"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}