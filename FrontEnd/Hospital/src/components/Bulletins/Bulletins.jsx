import { useState ,useEffect,useCallback} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertCircle, Circle } from "lucide-react";

import { useTokenSocket } from "../../hooks/useTokenSocket";
import { useSocket } from "../../hooks/useSocket";
import BulletinHistoryModal from "./BulletinHistoryModal";
import {getMessageHistoryApi,markMessagesReadApi} from "../../api/message.api"

export default function Bulletins({
  departmentId,
  title = "Bulletins",
  maxItems = 10,
}) {
  const { socketRef, isConnected } = useSocket();
  const [bulletins, setBulletins] = useState([]);

    // Pop Modal
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);



  /* ===============================
      SOCKET → BULLETIN INTEGRATION
  =============================== */
  useTokenSocket({
    socketRef,
    onNewMessage: (message) => {
      if (!message || message.type !== "ANNOUNCEMENT") return;
      if (
        message.metadata?.departmentId &&
        message.metadata.departmentId !== departmentId
      )
        return;

      setBulletins((prev) =>
        prev.some((m) => m._id === message._id)
          ? prev
          : [message, ...prev]
      );
    },
  onMissedMessages: (messages) => {
    if (!Array.isArray(messages)) return;

    // ✅ Only keep announcements
    const announcements = messages.filter(
      (m) => m?.type === "ANNOUNCEMENT"
    );

    if (!announcements.length) return;

    setBulletins((prev) => {
      const existingIds = new Set(
        prev.map((m) => m._id?.toString())
      );

      const fresh = announcements.filter(
        (m) => !existingIds.has(m._id?.toString())
      );

      return [...fresh, ...prev];
    });
  },
  });

// Fetch the message 
const fetchMessageHistory = useCallback(async (pageToLoad = 1) => {
  setLoadingHistory(true);

  try {
    const res = await getMessageHistoryApi({
      page: pageToLoad,
      limit: 20,
    });


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

// Mark the Message as Read
const markReadWithFallback = async (messageIds) => {
  const socket = socketRef.current;

  // Prefer socket if available
  if (socket && socket.connected) {
    try {
      socket.emit("messages:read", messageIds);
      return;
    } catch (err) {
      console.warn("Socket mark read failed, falling back to HTTP", err);
    }
  }

  // Fallback to HTTP
  try {
    await markMessagesReadApi({ messageIds });
  } catch (err) {
    console.error("HTTP mark read failed", err);
  }
};
// Mark All them Read
const markAllRead = () => {
  const unreadIds = history
    .filter((m) => m.readAt === null)
    .map((m) => m._id);

  if (unreadIds.length === 0) return;

  // 1️⃣ Optimistic UI update
  setHistory((prev) =>
    prev.map((m) =>
      m.readAt === null
        ? { ...m, readAt: new Date().toISOString() }
        : m
    )
  );

  // 2️⃣ Backend sync (socket → HTTP fallback)
  markReadWithFallback(unreadIds);
};



useEffect(() => {
  if (!isHistoryOpen) return;

  setHistory([]);
  setPage(1);
  setHasMore(true);

  fetchMessageHistory(1);
}, [isHistoryOpen, fetchMessageHistory]);


  /* ===============================
      ANIMATION VARIANTS
  =============================== */
  const containerVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96 },
  };

  return (
    <motion.div
      variants={containerVariants}
      onClick={() => setIsHistoryOpen(true)}
      initial="hidden"
      animate="visible"
      className="
        relative
        bg-white dark:bg-gray-900
        rounded-[2rem]
        border border-gray-100 dark:border-gray-800
        shadow-lg dark:shadow-none
        p-4
        flex flex-col
        h-[240px]   
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-100 dark:bg-rose-500/10 rounded-xl">
            <Bell className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <h4 className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400">
            {title}
          </h4>
        </div>

        {/* Connection Status */}
        {!isConnected ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-[9px] text-orange-600 font-bold">
            <Circle size={7} className="fill-orange-600 animate-pulse" />
            OFFLINE
          </span>
        ) : (
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
        )}
      </div>

      {/* Scrollable Content */}
      <div
        className="
          flex-1
          space-y-2
          overflow-y-auto
          pr-1
          scrollbar-none
        "
        style={{
          scrollbarWidth: "none",        // Firefox
          msOverflowStyle: "none",       // IE
        }}
      >
        <style>
          {`
            .scrollbar-none::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>

        <AnimatePresence initial={false}>
          {bulletins.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-dashed">
                <Bell size={16} className="text-gray-300" />
              </div>
              <p className="text-[11px] text-gray-400">
                No active announcements
              </p>
            </motion.div>
          ) : (
            bulletins.slice(0, maxItems).map((b) => (
              <motion.div
                key={b._id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className="
                  flex gap-3
                  p-3
                  rounded-xl
                  bg-gray-50 dark:bg-gray-800/40
                  hover:bg-white dark:hover:bg-gray-800
                  transition-colors
                  border border-transparent
                  hover:border-rose-100 dark:hover:border-rose-900/30
                "
              >
                <div className="mt-0.5">
                  <div className="p-1 rounded-lg bg-rose-100/50 dark:bg-rose-500/10">
                    <AlertCircle size={13} className="text-rose-500" />
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <p className="text-[12px] text-gray-700 dark:text-gray-300 leading-snug">
                    {b.content}
                  </p>

                  {b.createdAt && (
                    <span className="text-[9px] text-gray-400">
                      {new Date(b.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Subtle bottom glow */}
      <div className="pointer-events-none absolute bottom-0 left-6 right-6 h-6 bg-gradient-to-t from-rose-500/5 to-transparent" />
        <BulletinHistoryModal
            open={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            bulletins={history}
            title={`${title} – History`}

            onMarkRead={(messageIds) => {
            setHistory((prev) =>
              prev.map((m) =>
                messageIds.includes(m._id)
                  ? { ...m, readAt: new Date().toISOString() }
                  : m
              )
            );

            // 2️⃣ Backend sync (socket → HTTP fallback)
            markReadWithFallback(messageIds);
            }}
            onMarkAllRead={markAllRead}
        />

    </motion.div>
    
  );
}
