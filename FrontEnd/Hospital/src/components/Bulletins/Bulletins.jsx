import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  AlertCircle, 
  Circle, 
  Megaphone, 
  CreditCard, 
  Users, 
  FileText 
} from "lucide-react";

import { useTokenSocket } from "../../hooks/useTokenSocket";
import { useSocket } from "../../hooks/useSocket";
import BulletinHistoryModal from "./BulletinHistoryModal";
import { getMessageHistoryApi, markMessagesReadApi } from "../../api/message.api";

// --- UI Helpers ---
const getTypeStyles = (type) => {
  switch (type) {
    case "PAYMENT":
      return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-200", icon: CreditCard };
    case "QUEUE":
      return { color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-200", icon: Users };
    case "ANNOUNCEMENT":
      return { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-200", icon: Megaphone };
    default:
      return { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-200", icon: FileText };
  }
};

export default function Bulletins({
  departmentId,
  title = "Bulletins",
  maxItems = 10,
}) {
  const { socketRef, isConnected } = useSocket();
  const [bulletins, setBulletins] = useState([]);

  // Pop Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useTokenSocket({
    socketRef,
    onNewMessage: (message) => {
      // Logic Preserved
      if (!message || message.type !== "ANNOUNCEMENT") return;
      if (message.metadata?.departmentId && message.metadata.departmentId !== departmentId) return;

      setBulletins((prev) =>
        prev.some((m) => m._id === message._id) ? prev : [message, ...prev]
      );
    },
    onMissedMessages: (messages) => {
      // Logic Preserved
      if (!Array.isArray(messages)) return;
      const announcements = messages.filter((m) => m?.type === "ANNOUNCEMENT");
      if (!announcements.length) return;

      setBulletins((prev) => {
        const existingIds = new Set(prev.map((m) => m._id?.toString()));
        const fresh = announcements.filter((m) => !existingIds.has(m._id?.toString()));
        return [...fresh, ...prev];
      });
    },
  });

  // Fetch history logic preserved
  const fetchMessageHistory = useCallback(async (pageToLoad = 1) => {
    setLoadingHistory(true);
    try {
      const res = await getMessageHistoryApi({ page: pageToLoad, limit: 20 });
      const data = res.data;
      if (!data.success) throw new Error("Failed to fetch messages");

      setHistory((prev) =>
        pageToLoad === 1 ? data.messages : [...prev, ...data.messages]
      );
      setHasMore(data.hasMore);
      setPage(pageToLoad);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Mark read logic preserved
  const markReadWithFallback = async (messageIds) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      try {
        socket.emit("messages:read", messageIds);
        return;
      } catch (err) {
        console.warn("Socket mark read failed, falling back to HTTP", err);
      }
    }
    try {
      await markMessagesReadApi({ messageIds });
    } catch (err) {
      console.error("HTTP mark read failed", err);
    }
  };

  const markAllRead = () => {
    const unreadIds = history.filter((m) => m.readAt === null).map((m) => m._id);
    if (unreadIds.length === 0) return;
    setHistory((prev) =>
      prev.map((m) => (m.readAt === null ? { ...m, readAt: new Date().toISOString() } : m))
    );
    markReadWithFallback(unreadIds);
  };

  useEffect(() => {
    if (!isHistoryOpen) return;
    setHistory([]);
    setPage(1);
    setHasMore(true);
    fetchMessageHistory(1);
  }, [isHistoryOpen, fetchMessageHistory]);

  // Animations
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onClick={() => setIsHistoryOpen(true)}
      className="
        relative group cursor-pointer
        bg-white dark:bg-gray-900
        rounded-3xl
        border border-gray-200 dark:border-gray-800
        shadow-sm hover:shadow-md dark:shadow-none
        transition-all duration-300
        p-5 flex flex-col
        h-[260px] overflow-hidden
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20 transition-colors">
            <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              {title}
            </h4>
            <span className="text-[10px] text-gray-400 font-medium">
              {bulletins.length > 0 ? `${bulletins.length} New` : "Updated"}
            </span>
          </div>
        </div>

        {!isConnected ? (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 text-[9px] text-orange-600 font-bold">
            <Circle size={6} className="fill-orange-600 animate-pulse" />
            OFFLINE
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
             <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-500 opacity-60">Live</span>
          </div>
        )}
      </div>

      {/* Content Stream */}
      <div className="flex-1 space-y-3 overflow-hidden relative">
        <AnimatePresence initial={false} mode="popLayout">
          {bulletins.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center pb-4"
            >
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center mb-2">
                <Bell size={18} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-xs text-gray-400 font-medium">All caught up</p>
            </motion.div>
          ) : (
            bulletins.slice(0, maxItems).map((b) => {
              const style = getTypeStyles(b.type || "ANNOUNCEMENT");
              const Icon = style.icon;

              return (
                <motion.div
                  key={b._id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex gap-3 items-start p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className={`mt-0.5 min-w-[24px] h-6 rounded-lg ${style.bg} flex items-center justify-center`}>
                    <Icon size={12} className={style.color} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-[10px] font-bold ${style.color} opacity-80`}>
                        {b.title || b.type}
                      </span>
                      <span className="text-[9px] text-gray-400 tabular-nums">
                         {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-2">
                      {b.content}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        
        {/* Soft fade at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
      </div>

      <BulletinHistoryModal
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        bulletins={history}
        title="Notification Center"
        onMarkRead={(ids) => {
          setHistory(prev => prev.map(m => ids.includes(m._id) ? { ...m, readAt: new Date().toISOString() } : m));
          markReadWithFallback(ids);
        }}
        onMarkAllRead={markAllRead}
        onLoadMore={() => fetchMessageHistory(page + 1)}
        hasMore={hasMore}
        loadingMore={loadingHistory}
      />
    </motion.div>
  );
}