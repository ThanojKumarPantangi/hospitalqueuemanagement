import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Smile,
  CheckCheck,
  User,
  ShieldAlert,
  Loader2,
  X,
  Lock,
  Archive,
  Menu,
  Inbox,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// API
import {
  getAdminThreadsApi,
  getThreadMessagesApi,
  replyToThreadApi,
  closeTicketApi,
} from "../../api/message.api";

// SOCKET HOOKS
import { useSocket } from "../../hooks/useSocket";
import { useTokenSocket } from "../../hooks/useTokenSocket";
import { showToast } from "../../utils/toastBus";

/* =========================================
   🎨 ANIMATION VARIANTS
========================================= */

const sidebarContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
};

const threadItemVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 } 
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
};

const chatWindowVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" } 
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
};

const messageVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 25 },
  },
};

// 🆕 Button Animation Variants (From your snippet)
const buttonVariants = {
  idle: { scale: 1, opacity: 1 },
  pressed: { scale: 0.95 },
  loading: { scale: 0.98, opacity: 0.8 },
};

const buttonTap = { scale: 0.95 };

/* =========================================
   🧩 SUB-COMPONENTS
========================================= */

const DotPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="dot-pattern-admin" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" className="fill-slate-900 dark:fill-white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dot-pattern-admin)" />
  </svg>
);

const ThreadListSkeleton = () => (
  <div className="space-y-3 p-4">
    {[...Array(6)].map((_, i) => (
      <motion.div 
        key={i}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: "mirror" }}
        className="flex gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"
      >
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
      </motion.div>
    ))}
  </div>
);

/* =========================================
   🚀 MAIN COMPONENT: ADMIN INBOX
========================================= */
export default function AdminInbox() {
  /* ---------- SOCKET ---------- */
  const { socketRef, isConnected } = useSocket();

  /* ---------- STATE ---------- */
  const [threads, setThreads] = useState([]);
  const [filteredThreads, setFilteredThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [isTicketClosed, setIsTicketClosed] = useState(false);
  
  /* ---------- UI STATE ---------- */
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  // 🆕 State for the Close Ticket Button Animation
  const [isClosing, setIsClosing] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  
  // FILTER STATE: 'open' | 'closed'
  const [activeTab, setActiveTab] = useState("open");

  /* ---------- REFS ---------- */
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  /* ============================
      LOGIC & API CALLS
  ============================ */

  const loadThreads = useCallback(async () => {
    try {
      setIsLoadingThreads(true);
      const { data } = await getAdminThreadsApi();
      showToast({ type: "success", message: "Threads refreshed" });
      setThreads(data.threads || []);
    } catch (error) {
      showToast({ type: "error", message: "Failed to load threads" });
      console.error("Failed to load threads", error);
    } finally {
      setIsLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Filter Logic
  useEffect(() => {
    let result = threads;

    // Filter by Tab
    if (activeTab === "open") {
      result = result.filter(t => t.ticketStatus === "OPEN");
    } else {
      result = result.filter(t => t.ticketStatus === "CLOSED");
    }

    // Filter by Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          (t.user?.name || "").toLowerCase().includes(lower) ||
          (t.category || "").toLowerCase().includes(lower) ||
          (t.lastMessage || "").toLowerCase().includes(lower)
      );
    }

    setFilteredThreads(result);
  }, [searchTerm, threads, activeTab]);

  const openCount = threads.filter(t => t.ticketStatus === "OPEN").length;
  const closedCount = threads.filter(t => t.ticketStatus === "CLOSED").length;

  const openThread = async (thread) => {
    if (activeThread?.threadId === thread.threadId) return;
    
    setActiveThread(thread);
    setIsLoadingMessages(true);
    setMessages([]); 
    setShowMobileSidebar(false);
    setIsClosing(false); // Reset button state

    // Optimistic read
    setThreads((prev) =>
      prev.map((t) =>
        t.threadId === thread.threadId ? { ...t, unread: false } : t
      )
    );

    try {
      const { data } = await getThreadMessagesApi(thread.threadId);
      setMessages(data.messages || []);
      const root = (data.messages && data.messages.length > 0) ? data.messages[0] : null;
      setIsTicketClosed(!!(root && root.metadata && root.metadata.ticketStatus === "CLOSED"));
    } catch (error) {
      showToast({ type: "error", message: "Failed to fetch messages" });
      console.error("Failed to load messages", error);
      setIsTicketClosed(false);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || isSending || isTicketClosed) return;

    setIsSending(true);
    try {
      await replyToThreadApi({
        threadId: activeThread.threadId,
        content: reply,
        category: activeThread.category,
      });

      setReply("");
      const { data } = await getThreadMessagesApi(activeThread.threadId);
      setMessages(data.messages || []);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (error) {
      showToast({ type: "error", message: "Failed to send reply" });
      console.error("Failed to send reply", error);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeThread]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  /* ============================
      SOCKETS
  ============================ */
  useTokenSocket({
    socketRef,
    onNewMessage: (message) => {
      if (!message || !message.threadId) return;

      if (activeThread && message.threadId === activeThread.threadId) {
        setMessages((prev) =>
          prev.some((m) => m._id === message._id) ? prev : [...prev, message]
        );
      }

      setThreads((prev) => {
        const updated = prev.map((t) =>
          t.threadId === message.threadId
            ? {
                ...t,
                lastMessage: message.content,
                updatedAt: message.createdAt,
                unread: activeThread?.threadId !== message.threadId,
              }
            : t
        );
        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    },
    onMissedMessages: () => { /* Sync */ },
  });

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = (payload) => {
      if (!payload || !payload.threadId) return;

      if (activeThread && payload.threadId === activeThread.threadId) {
        setIsTicketClosed(true);
        setMessages((prev) => [
          ...prev,
          {
            _id: `sys-closed-${Date.now()}`,
            content: "This ticket has been closed by admin.",
            senderRole: "ADMIN",
            createdAt: payload.closedAt || new Date().toISOString(),
            metadata: { system: true },
          },
        ]);
      }

      setThreads((prev) =>
        prev.map((t) =>
          t.threadId === payload.threadId
            ? { ...t, updatedAt: payload.closedAt || t.updatedAt, ticketStatus: "CLOSED" }
            : t
        )
      );
    };

    socket.on("ticket:closed", handler);
    return () => socket.off("ticket:closed", handler);
  }, [socketRef, activeThread]);

  // 🆕 ANIMATED CLOSE TICKET FUNCTION
  const closeTicket = async () => {
    if (!activeThread || isTicketClosed || isClosing) return;

    setIsClosing(true); // Start animation

    try {
      await closeTicketApi(activeThread.threadId);
      
      // Artificial delay for animation visibility (optional)
      await new Promise(resolve => setTimeout(resolve, 600));

      setIsTicketClosed(true);
      showToast({ type: "success", message: "Ticket Closed" });

      setMessages((prev) => [
        ...prev,
        {
          _id: `sys-closed-${Date.now()}`,
          content: "Ticket closed by administrator.",
          senderRole: "ADMIN",
          createdAt: new Date().toISOString(),
          metadata: { system: true },
        },
      ]);

      setThreads((prev) =>
        prev.map((t) =>
          t.threadId === activeThread.threadId
            ? { ...t, updatedAt: new Date().toISOString(), ticketStatus: "CLOSED" }
            : t
        )
      );
    } catch (err) {
      console.error("Failed to close ticket", err);
      showToast({ type: "error", message: "Failed to close ticket" });
    } finally {
      setIsClosing(false); // Stop animation
    }
  };

  /* ============================
      RENDER UI
  ============================ */
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden relative transition-colors duration-300">
      
      {/* ---------------------------------------------------------
          LEFT SIDEBAR
          --------------------------------------------------------- */}
      <motion.div 
        className={`
          absolute inset-y-0 left-0 z-30 w-full md:w-[380px] lg:w-[420px] 
          bg-white dark:bg-slate-900 
          border-r border-slate-200 dark:border-slate-800 
          flex flex-col shadow-2xl md:shadow-[4px_0_24px_rgba(0,0,0,0.02)] md:relative 
          transform transition-all duration-300 ease-in-out
          ${showMobileSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-6 pb-2 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl z-20 sticky top-0">
          
          {/* Connection Badge */}
          <div className="flex items-center justify-end mb-4">
            <AnimatePresence mode="wait">
              {isConnected ? (
                <motion.div
                  key="online"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full shadow-sm"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Live</span>
                </motion.div>
              ) : (
                <motion.div
                  key="offline"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full shadow-sm"
                >
                  <Loader2 size={10} className="text-amber-600 dark:text-amber-400 animate-spin" />
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Connecting...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3">
              <span className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                <ShieldAlert size={22} strokeWidth={2.5} />
              </span>
              Admin Inbox
            </h1>
            <button 
              onClick={() => setShowMobileSidebar(false)}
              className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search */}
          <div className="relative group mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors duration-300" size={18} />
            <input 
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner placeholder-slate-400 dark:placeholder-slate-600 dark:text-white"
            />
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl mb-2">
            <button
              onClick={() => setActiveTab("open")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                activeTab === "open"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <Inbox size={16} />
              <span>Active</span>
              <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-md ${activeTab === "open" ? "bg-indigo-50 dark:bg-slate-600 text-indigo-700 dark:text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-500"}`}>
                {openCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("closed")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                activeTab === "closed"
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <CheckCircle2 size={16} />
              <span>Closed</span>
              <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-md ${activeTab === "closed" ? "bg-slate-100 dark:bg-slate-600 text-slate-800 dark:text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-500"}`}>
                {closedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4 space-y-1 relative z-10">
          {isLoadingThreads ? (
            <ThreadListSkeleton />
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-600">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                {activeTab === 'open' ? <Inbox size={28} className="opacity-50" /> : <Archive size={28} className="opacity-50" />}
              </div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">No {activeTab} tickets</p>
            </div>
          ) : (
            <motion.div variants={sidebarContainerVariants} initial="hidden" animate="visible" className="space-y-2 pt-2">
              {filteredThreads.map((thread) => {
                const isActive = activeThread?.threadId === thread.threadId;
                return (
                  <motion.button
                    key={thread.threadId}
                    variants={threadItemVariants}
                    layoutId={`thread-${thread.threadId}`}
                    onClick={() => openThread(thread)}
                    className={`
                      relative w-full text-left p-4 rounded-xl transition-all duration-300 group overflow-hidden
                      ${isActive 
                        ? "shadow-lg shadow-indigo-500/10 z-10" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                      }
                    `}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="active-thread-bg"
                        className="absolute inset-0 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-xl"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`
                              w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-slate-700 shadow-sm
                              ${
                                thread.user?.role === "DOCTOR"
                                  ? "bg-slate-800 dark:bg-slate-700 text-white"
                                  : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                              }
                            `}
                          >
                            {thread.user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>

                          <div className="flex flex-col">
                            <span
                              className={`text-sm font-bold leading-tight ${
                                isActive
                                  ? "text-indigo-950 dark:text-white"
                                  : "text-slate-700 dark:text-slate-200"
                              }`}
                            >
                              {thread.user?.name || "Unknown"}
                            </span>

                            {thread.user?.role && (
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                                {thread.user.role}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                          {new Date(thread.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2 pl-[42px]">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${isActive ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                          {thread.category}
                        </span>
                        {thread.unread && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md border border-red-100 dark:border-red-900/30 animate-pulse">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" /> New
                          </span>
                        )}
                        {thread.ticketStatus === "CLOSED" && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            <Lock size={10} /> Closed
                          </span>
                        )}
                      </div>
                      <p className={`text-xs pl-[42px] truncate leading-relaxed ${isActive ? "text-slate-600 dark:text-slate-300 font-medium" : "text-slate-400 dark:text-slate-500"}`}>
                        {thread.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ---------------------------------------------------------
          RIGHT SIDE: CHAT VIEW
          --------------------------------------------------------- */}
      <div className="flex-1 flex flex-col relative bg-[#F8FAFC] dark:bg-[#0B1120] z-0 transition-colors duration-300">
        <DotPattern />
        
        <AnimatePresence mode="wait">
          {!activeThread ? (
            <motion.div 
              key="empty-chat"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 relative z-10"
            >
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="w-32 h-32 bg-gradient-to-tr from-slate-100 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-white dark:border-slate-800"
              >
                <MessageSquare size={48} className="text-slate-300 dark:text-slate-600 ml-1" />
              </motion.div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Admin Dashboard</h3>
              <p className="text-sm max-w-xs text-center leading-relaxed text-slate-500 dark:text-slate-400">Select a support ticket.</p>
              <button 
                onClick={() => setShowMobileSidebar(true)}
                className="md:hidden mt-8 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
              >
                View Tickets
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="active-chat"
              variants={chatWindowVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col h-full relative z-10"
            >
              <header className="px-6 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between z-20">
                <div className="flex items-center gap-4">
                  <motion.button 
                    whileTap={buttonTap}
                    onClick={() => setShowMobileSidebar(true)}
                    className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <Menu size={20} />
                  </motion.button>

                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md ring-4 ring-slate-50 dark:ring-slate-800">
                      {activeThread.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    {!isTicketClosed && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[3px] border-white dark:border-slate-900 rounded-full shadow-sm"></div>
                    )}
                  </div>
                  
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      {activeThread.user?.name}
                      {activeThread.user?.role === 'ADMIN' && <ShieldAlert size={16} className="text-indigo-600 dark:text-indigo-400" />}
                    </h2>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/30">
                        {activeThread.category}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-slate-400 dark:text-slate-500 font-mono">ID: {activeThread.threadId.slice(-6).toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  
                  {/* 🆕 ANIMATED CLOSE BUTTON */}
                  {!isTicketClosed ? (
                    <motion.button
                      type="button"
                      onClick={closeTicket}
                      disabled={isClosing}
                      variants={buttonVariants}
                      initial="idle"
                      animate={isClosing ? "loading" : "idle"}
                      whileTap={!isClosing ? "pressed" : undefined}
                      className="hidden sm:flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 hover:border-red-600 transition-all shadow-sm min-w-[120px]"
                    >
                      <AnimatePresence mode="wait">
                        {isClosing ? (
                          <motion.span
                            key="loading"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="flex items-center gap-2"
                          >
                            <motion.span
                              className="w-3 h-3 rounded-full border-2 border-red-600/30 dark:border-red-400/30 border-t-red-600 dark:border-t-red-400"
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                            />
                            CLOSING...
                          </motion.span>
                        ) : (
                          <motion.span
                            key="idle"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            className="flex items-center gap-2"
                          >
                            <Lock size={14} />
                            CLOSE TICKET
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ) : (
                    <span className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      <Lock size={14} /> Closed
                    </span>
                  )}

                </div>
              </header>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6" id="chat-container">
                {isLoadingMessages ? (
                   <div className="flex flex-col items-center justify-center h-full gap-4">
                     <Loader2 size={36} className="animate-spin text-indigo-500" />
                     <p className="text-xs font-bold text-indigo-500/60 uppercase tracking-widest animate-pulse">Decrypting secure chat...</p>
                   </div>
                ) : (
                  <div className="flex flex-col justify-end min-h-full pb-4">
                     <div className="flex justify-center mb-8 opacity-60">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-slate-200/50 dark:border-slate-700/50">
                          Start of conversation
                        </span>
                     </div>

                     <AnimatePresence initial={false}>
                      {messages.map((msg, index) => {
                        const isAdmin = msg.senderRole === "ADMIN";
                        const isSystem = msg.metadata?.system;
                        const isLast = index === messages.length - 1;
                        
                        if (isSystem) {
                          return (
                            <motion.div 
                              key={msg._id || index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex justify-center my-6"
                            >
                              <span className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-semibold text-slate-500 dark:text-slate-400 shadow-sm">
                                <Lock size={12} />
                                {msg.content}
                              </span>
                            </motion.div>
                          );
                        }

                        return (
                          <motion.div
                            key={msg._id || index}
                            variants={messageVariants}
                            initial="hidden"
                            animate="visible"
                            layout
                            className={`flex gap-4 w-full mb-2 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}
                          >
                            <div className={`
                              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-auto shadow-sm ring-2 ring-white dark:ring-slate-800 z-10
                              ${isAdmin ? "bg-slate-800 dark:bg-indigo-600 text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"}
                            `}>
                              {isAdmin ? <ShieldAlert size={14} /> : <User size={14} />}
                            </div>

                            <div className={`flex flex-col max-w-[70%] md:max-w-[60%] ${isAdmin ? "items-end" : "items-start"}`}>
                              <div className={` 
                                  relative px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all duration-300
                                  ${isAdmin 
                                    ? "bg-gradient-to-br from-slate-800 to-slate-900 dark:from-indigo-600 dark:to-indigo-700 text-white rounded-2xl rounded-tr-sm shadow-slate-500/20 dark:shadow-indigo-500/20" 
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm"
                                  }
                                `}>
                                {msg.content}
                              </div>
                              <div className={`flex items-center gap-1 mt-1.5 px-1 opacity-70 hover:opacity-100 transition-opacity ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isAdmin && isLast && (
                                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <CheckCheck size={12} className="text-indigo-500 dark:text-indigo-400" />
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} className="h-2" />
                  </div>
                )}
              </div>

              <div className="p-4 md:p-6 bg-gradient-to-t from-slate-100 via-slate-50 to-transparent dark:from-slate-950 dark:via-slate-900/80 z-20 sticky bottom-0">
                <motion.div 
                  layout
                  className={`
                    relative flex flex-col gap-2 p-1.5 rounded-[24px] border shadow-2xl transition-all duration-300 backdrop-blur-xl
                    ${isTicketClosed
                      ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-70 cursor-not-allowed"
                      : isSending 
                        ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-80" 
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:focus-within:ring-indigo-500/20"
                    }
                  `}
                >
                  <textarea
                    ref={textareaRef}
                    value={reply}
                    onChange={(e) => {
                      setReply(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={isSending || isTicketClosed}
                    placeholder={isTicketClosed ? "🚫 This ticket is closed. Re-open to reply." : "Type your reply here..."}
                    rows={1}
                    className="w-full max-h-32 px-4 py-3 bg-transparent resize-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none custom-scrollbar rounded-xl disabled:cursor-not-allowed"
                  />

                  <div className="flex items-center justify-between px-2 pb-1">
                    <div className="flex items-center gap-1">
                      <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors" disabled={isTicketClosed}>
                        <Paperclip size={18} />
                      </button>
                      <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-full transition-colors" disabled={isTicketClosed}>
                        <Smile size={18} />
                      </button>
                    </div>

                    <motion.button
                      whileHover={!isTicketClosed && !isSending ? { scale: 1.05 } : {}}
                      whileTap={!isTicketClosed && !isSending ? { scale: 0.95 } : {}}
                      onClick={sendReply}
                      disabled={!reply.trim() || isSending || isTicketClosed}
                      className={`
                        flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                        ${isTicketClosed
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                          : !reply.trim() || isSending
                            ? "bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 cursor-not-allowed" 
                            : "bg-slate-900 dark:bg-indigo-600 text-white hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30"
                        }
                      `}
                    >
                      {isSending ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Sending</span>
                        </>
                      ) : (
                        <>
                          <span>Send Reply</span>
                          <Send size={16} />
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
                {!isTicketClosed && (
                  <div className="text-center mt-2 opacity-50 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Press <kbd className="font-sans px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 mx-1">Enter</kbd> to send</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}