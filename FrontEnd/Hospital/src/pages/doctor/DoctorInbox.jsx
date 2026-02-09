import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageSquare,
  PlusCircle,
  Search,
  Send,
  Paperclip,
  Smile,
  CheckCheck,
  ChevronLeft,
  User,
  ShieldCheck,
  X,
  Loader2,
  Tag,
  Clock,
  Filter,
  CornerDownRight,
  ArrowLeft
} from "lucide-react";
import { showToast } from "../../utils/toastBus";
import { motion, AnimatePresence } from "framer-motion";

// Hooks
import { useSocket } from "../../hooks/useSocket";
import { useTokenSocket } from "../../hooks/useTokenSocket";

// Components
import DoctorNavbar from "../../components/Navbar/DoctorNavbar";

// API
import {
  getUserThreadsApi,
  getUserThreadMessagesApi,
  replyToThreadApi,
  sendMessageToAdminApi,
} from "../../api/message.api";

/* =========================================
   🎨 COMPLEX ANIMATION VARIANTS
========================================= */

// Sidebar: On mobile it slides, on desktop it stays put
const sidebarContainerVariants = {
  desktop: {
    x: 0,
    opacity: 1,
    display: "flex",
    width: "420px", // Fixed width for desktop
    transition: { type: "spring", bounce: 0, duration: 0.4 }
  },
  tablet: {
    x: 0,
    opacity: 1,
    display: "flex",
    width: "360px",
    transition: { type: "spring", stiffness: 250, damping: 28 }
  },
  mobileOpen: {
    x: 0,
    opacity: 1,
    display: "flex",
    width: "100%", // Full width for mobile
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },
  mobileClosed: {
    x: "-20%",
    opacity: 0,
    display: "none",
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
};

// Chat Area: Slides in from right on mobile
const chatAreaVariants = {
  desktop: {
    x: 0,
    opacity: 1,
    display: "flex",
    transition: { duration: 0.3 }
  },
  tablet: {
    x: 0,
    opacity: 1,
    display: "flex",
    transition: { duration: 0.28 }
  },
  mobileOpen: {
    x: 0,
    opacity: 1,
    display: "flex",
    zIndex: 50,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },
  mobileClosed: {
    x: "100%",
    opacity: 0,
    display: "none",
    zIndex: 50,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
};

// Chat Empty / Intro Container Animation
const chatContainerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.2,
    },
  },
};

// Staggered list loading for threads
const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

// Individual thread items popping in
const threadItemVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 }
  },
};

// Message bubble animation
const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
};

// Modal Backdrop
const modalBackdropVariants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(4px)" },
  exit: { opacity: 0, backdropFilter: "blur(0px)" },
};

// Modal Content Pop
const modalContentVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },
  exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } },
};

/* =========================================
   🧩 SUB-COMPONENTS (Visual Helpers)
========================================= */

const DotPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.05] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="dot-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" className="fill-slate-900 dark:fill-white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dot-pattern)" />
  </svg>
);

const ThreadSkeleton = () => (
  <div className="space-y-4 p-4">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: "mirror" }}
        className="flex gap-4 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"
      >
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
      </motion.div>
    ))}
  </div>
);

/* =========================================
   🚀 MAIN COMPONENT: DOCTOR INBOX
========================================= */
export default function DoctorInbox() {
  /* ---------- SOCKET ---------- */
  const { socketRef, isConnected } = useSocket();

  /* ---------- STATE MANAGEMENT ---------- */
  const [threads, setThreads] = useState([]);
  const [filteredThreads, setFilteredThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);

  // Inputs
  const [reply, setReply] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("GENERAL");
  const [newContent, setNewContent] = useState("");

  // Loading States
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  // Ticket closed state
  const [isClosed, setIsClosed] = useState(false);
  const [closedAt, setClosedAt] = useState(null);

  // Responsive Layout State
  const [isDesktop, setIsDesktop] = useState(true);
  const [isTablet, setIsTablet] = useState(false);

  // Swipe gesture state for iOS-style back
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartXRef = useRef(null);
  const swipeRef = useRef(null);

  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  /* =========================================
     📏 RESPONSIVE HANDLER
  ========================================= */
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsDesktop(w >= 1024);
      setIsTablet(w >= 768 && w < 1024);
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* =========================================
     MOBILE SCROLL LOCK (CHAT MODE)
  ========================================= */
  useEffect(() => {
    if ((!isDesktop && !isTablet) && activeThread && isSwiping === false) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDesktop, isTablet, activeThread, isSwiping]);

  /* =========================================
     📥 DATA FETCHING
  ========================================= */
  const loadThreads = useCallback(async () => {
    try {
      setIsLoadingThreads(true);
      const { data } = await getUserThreadsApi();

      setThreads(data.threads || []);
      setFilteredThreads(data.threads || []);
    } catch (err) {
      showToast({
        type: "error",
        message: "Unable to load your inbox. Please retry.",
      });
      console.error("Failed to load threads", err);
    } finally {
      setIsLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  /* =========================================
     🔌 SOCKET EVENT LISTENERS
  ========================================= */
  useTokenSocket({
    socketRef,
    onNewMessage: (message) => {
      if (!message || !message.threadId) return;

      // 1. If currently viewing this thread, append message
      if (activeThread && message.threadId === activeThread.threadId) {
        setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
      }

      // 2. Update threads list (move to top, update preview)
      setThreads((prev) => {
        const exists = prev.some((t) => t.threadId === message.threadId);
        if (exists) {
          const updated = prev.map((t) =>
            t.threadId === message.threadId
              ? { ...t, lastMessage: message.content, updatedAt: message.createdAt, unread: true }
              : t
          );
          return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }

        // New thread entirely
        const newThread = {
          threadId: message.threadId,
          lastMessage: message.content,
          category: message.category || "GENERAL",
          updatedAt: message.createdAt,
          unread: true,
        };
        return [newThread, ...prev];
      });
    },
    onMissedMessages: () => {
      // Re-fetch logic if needed
    },
  });

  /* =========================================
     🔍 FILTER LOGIC
  ========================================= */
  useEffect(() => {
    if (!searchTerm) {
      setFilteredThreads(threads);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredThreads(
        threads.filter(
          (t) =>
            (t.category || "").toLowerCase().includes(lower) ||
            (t.lastMessage || "").toLowerCase().includes(lower)
        )
      );
    }
  }, [searchTerm, threads]);

  /* =========================================
     ⚙️ LOGIC: CLOSED TICKET DETECTION
  ========================================= */
  const deriveClosedInfo = (threadObj, msgs = []) => {
    if (threadObj) {
      if (threadObj.ticketStatus === "CLOSED") {
        return { closed: true, at: threadObj.closedAt || null };
      }
      if (threadObj.metadata && threadObj.metadata.ticketStatus === "CLOSED") {
        return { closed: true, at: threadObj.metadata.closedAt || null };
      }
    }

    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (m && m.metadata) {
        if (m.metadata.ticketStatus === "CLOSED") {
          return { closed: true, at: m.metadata.closedAt || m.createdAt || null };
        }
        if (m.metadata.closedAt) {
          return { closed: true, at: m.metadata.closedAt };
        }
      }
    }

    return { closed: false, at: null };
  };

  /* =========================================
     👆 INTERACTION HANDLERS
  ========================================= */
  const openThread = async (thread) => {
    if (activeThread?.threadId === thread.threadId) return;

    setActiveThread(thread);
    setIsLoadingMessages(true);
    setMessages([]);
    setIsClosed(false);
    setClosedAt(null);

    // Optimistic unread clear
    setThreads((prev) => prev.map((t) => (t.threadId === thread.threadId ? { ...t, unread: false } : t)));

    try {
      const { data } = await getUserThreadMessagesApi(thread.threadId);
      const msgs = data.messages || [];

      const { closed, at } = deriveClosedInfo(thread, msgs);
      setIsClosed(Boolean(closed));
      setClosedAt(at ? new Date(at).toISOString() : null);

      setMessages(msgs);
    } catch (err) {
      showToast({
        type: "error",
        message: "Failed to load messages",
      });
      console.error("Failed to load messages", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Close the active thread (Back button on mobile)
  const handleBackToInbox = () => {
    setIsSwiping(false);
    setSwipeX(0);
    setActiveThread(null);
  };

  const sendReply = async () => {
    if (!reply.trim() || isSending || !activeThread) return;
    if (isClosed) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      threadId: activeThread.threadId,
      content: reply,
      senderRole: "DOCTOR",
      createdAt: new Date().toISOString(),
      __optimistic: true,
    };

    // UI Updates
    setMessages((prev) => [...prev, optimisticMessage]);
    setThreads((prev) =>
      prev.map((t) =>
        t.threadId === activeThread.threadId ? { ...t, lastMessage: optimisticMessage.content, updatedAt: optimisticMessage.createdAt } : t
      )
    );
    setReply("");

    // Auto-resize
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setIsSending(true);
    try {
      const res = await replyToThreadApi({
        threadId: activeThread.threadId,
        content: optimisticMessage.content,
      });
      showToast({
        type: "success",
        message: res?.data?.message || "Message sent",
      });
    } catch (err) {
      console.error("Reply failed", err);
      showToast({
        type: "error",
        message: "Message failed to send. Please try again.",
      });
      // Rollback
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setReply(optimisticMessage.content);
    } finally {
      setIsSending(false);
    }
  };

  const createNewThread = async () => {
    if (!newContent.trim()) return;

    setIsCreatingThread(true);
    try {
      const res = await sendMessageToAdminApi({
        category: newCategory,
        content: newContent,
      });
      await loadThreads(); // Refresh list
      showToast({
        type: "success",
        message: "Ticket created successfully",
      });
      setIsModalOpen(false);
      setNewContent("");
      setNewCategory("GENERAL");
    } catch (err) {
      showToast({
        type: "error",
        message: "Failed to create ticket",
      });
      console.error("Thread creation failed", err);
    } finally {
      setIsCreatingThread(false);
    }
  };

  const handleKeyDown = (e) => {
    if (isClosed) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  // Auto-scroll logic
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeThread]);


  useEffect(() => {
    // Cleanup target ref
    swipeRef.current = { isActive: false, startX: 0 };
  }, []);

  // Handlers attached to the chat view container
  const onTouchStart = (e) => {
    if (isDesktop || isTablet) return;
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const startX = touch.clientX;
    touchStartXRef.current = startX;
    if (startX <= 28) {
      swipeRef.current = { isActive: true, startX };
      setIsSwiping(true);
      setSwipeX(0);
    } else {
      swipeRef.current = { isActive: false, startX };
      setIsSwiping(false);
      setSwipeX(0);
    }
  };

  const onTouchMove = (e) => {
    if (!swipeRef.current?.isActive) return;
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const dx = Math.max(0, touch.clientX - swipeRef.current.startX);
    const capped = Math.min(dx, 300);
    setSwipeX(capped);
  };

  const onTouchEnd = (e) => {
    if (!swipeRef.current?.isActive) {
      setSwipeX(0);
      setIsSwiping(false);
      swipeRef.current = { isActive: false, startX: null };
      return;
    }
    const dx = swipeX;
    const threshold = 120; // px required to trigger back
    if (dx > threshold) {
      setSwipeX(500);
      setTimeout(() => {
        handleBackToInbox();
        setSwipeX(0);
      }, 180);
    } else {
      setSwipeX(0);
      setIsSwiping(false);
    }
    swipeRef.current = { isActive: false, startX: null };
  };

  // Mouse-based drag for dev testing on non-touch (optional)
  const onMouseDown = (e) => {
    if (isDesktop || isTablet) return;
    const startX = e.clientX;
    touchStartXRef.current = startX;
    if (startX <= 28) {
      swipeRef.current = { isActive: true, startX };
      setIsSwiping(true);
      setSwipeX(0);
      const onMove = (me) => {
        if (!swipeRef.current.isActive) return;
        const dx = Math.max(0, me.clientX - swipeRef.current.startX);
        const capped = Math.min(dx, 300);
        setSwipeX(capped);
      };
      const onUp = (ue) => {
        if (!swipeRef.current.isActive) return;
        const dx = Math.max(0, ue.clientX - swipeRef.current.startX);
        const threshold = 120;
        if (dx > threshold) {
          setSwipeX(500);
          setTimeout(() => {
            handleBackToInbox();
            setSwipeX(0);
          }, 180);
        } else {
          setSwipeX(0);
          setIsSwiping(false);
        }
        swipeRef.current = { isActive: false, startX: null };
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }
  };

  /* =========================================
     🎨 RENDER UI
  ========================================= */

  const getSidebarState = () => {
    if (isDesktop) return "desktop";
    if (isTablet) return "tablet";
    return activeThread ? "mobileClosed" : "mobileOpen";
  };

  const getChatState = () => {
    if (isDesktop) return "desktop";
    if (isTablet) return "tablet";
    return activeThread ? "mobileOpen" : "mobileClosed";
  };

  const sidebarExtraClasses = isTablet
    ? "lg:relative w-[360px] md:w-[340px] flex-shrink-0"
    : "lg:relative";

  const chatExtraClasses = isTablet
    ? "ml-[360px] lg:ml-0"
    : "";

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">

      {/* 1. Global Navigation */}
      <div className="flex-shrink-0 z-50">
        <DoctorNavbar />
      </div>

      {/* Layout isolation wrapper — helps prevent overlap issues on mobile */}
      <div className="relative w-full h-full flex-1 overflow-hidden">

        {/* 2. Main Inbox Container (Flex Row) */}
        <div className="flex-1 flex overflow-hidden relative h-full">

          {/* SIDEBAR (Thread List) */}
          <motion.div
            variants={sidebarContainerVariants}
            initial={false}
            animate={getSidebarState()}
            className={`flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl z-30 h-full absolute lg:relative ${sidebarExtraClasses}`}
            style={{
              width: isDesktop ? 420 : isTablet ? 360 : undefined,
              left: isDesktop || isTablet ? 0 : undefined
            }}
          >
            {/* Header */}
            <div className="p-6 pb-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 sticky top-0">
              {/* Connection Status */}
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
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                        Live Sync
                      </span>
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
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">
                        Connecting...
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Title & Add Button */}
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3">
                  <span className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                    <MessageSquare size={22} strokeWidth={2.5} />
                  </span>
                  Doctor Inbox
                </h1>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsModalOpen(true)}
                  className="group flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white text-xs font-bold rounded-full transition-all shadow-md hover:shadow-xl hover:shadow-indigo-500/20"
                >
                  <PlusCircle size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span>New Ticket</span>
                </motion.button>
              </div>

              {/* Search Input */}
              <div className="relative group mb-2">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-3.5 bg-slate-100 dark:bg-slate-800/50 border border-transparent dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner dark:text-white dark:placeholder-slate-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-2 relative z-0">
              {isLoadingThreads ? (
                <ThreadSkeleton />
              ) : filteredThreads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"
                  >
                    <Filter size={32} />
                  </motion.div>
                  <p className="font-medium">No consultations found</p>
                  <p className="text-xs mt-1 opacity-70">Start a new consultation to connect with a Admin</p>
                </div>
              ) : (
                <motion.div variants={listContainerVariants} initial="hidden" animate="visible" className="space-y-2 pt-2">
                  {filteredThreads.map((thread) => {
                    const isActive = activeThread?.threadId === thread.threadId;
                    return (
                      <motion.button
                        key={thread.threadId}
                        variants={threadItemVariants}
                        onClick={() => openThread(thread)}
                        className={`
                          relative w-full text-left p-4 rounded-2xl transition-all duration-300 group overflow-hidden
                          ${isActive
                            ? "shadow-lg shadow-indigo-500/10 z-10"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          }
                        `}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="active-thread-bg"
                            className="absolute inset-0 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl"
                            initial={false}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}

                        <div className="relative z-10 flex gap-4 items-start">
                          <div className={`
                            flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm transition-colors duration-300
                            ${isActive
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            }
                          `}>
                            <ShieldCheck size={22} />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-[3px] border-white dark:border-slate-900 rounded-full" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-sm font-bold truncate ${isActive ? "text-indigo-900 dark:text-white" : "text-slate-800 dark:text-slate-200"}`}>
                                ADMIN
                              </span>
                              <span className={`text-[10px] font-medium flex items-center gap-1 ${isActive ? "text-indigo-600/70 dark:text-indigo-300/70" : "text-slate-400"}`}>
                                {new Date(thread.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`
                                px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border
                                ${isActive
                                  ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 border-indigo-200 dark:border-indigo-500/30"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`}
                              >
                                {thread.category}
                              </span>
                              {thread.unread && (
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/50" title="Unread Message"></span>
                              )}
                            </div>

                            <p className={`text-xs truncate leading-relaxed ${isActive ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`}>
                              {thread.lastMessage || "No messages yet..."}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Mobile Backdrop - ensure sidebar overlays properly on phones */}
          {!isDesktop && !isTablet && !activeThread && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-20"
            />
          )}

          {/* CHAT AREA (Detail View) */}
          <motion.div
            variants={chatAreaVariants}
            initial={false}
            animate={getChatState()}
            className={`flex-1 flex flex-col relative bg-[#F8FAFC] dark:bg-[#0B1120] z-10 transition-colors duration-300 absolute inset-0 lg:relative h-full ${chatExtraClasses}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            style={{
              transform: !isDesktop && !isTablet && swipeX ? `translateX(${Math.min(swipeX, 600)}px)` : undefined,
              transition: isSwiping ? "none" : "transform 180ms ease"
            }}
          >
            <DotPattern />

            <AnimatePresence mode="wait">
              {!activeThread ? (
                // --- EMPTY STATE ---
                <motion.div
                  key="empty-state"
                  variants={chatContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 relative z-10 p-8"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-48 h-48 bg-gradient-to-tr from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full blur-3xl absolute"
                  />
                  <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-indigo-100 dark:shadow-black/50 border border-slate-100 dark:border-slate-700 relative z-10">
                    <MessageSquare size={48} className="text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-3 text-center">Admin Conversations</h2>
                  <p className="text-sm max-w-md text-center leading-relaxed opacity-80">
                    Select a conversation from the sidebar or start a new consultation to engage with Admin.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-transform active:scale-95 flex items-center gap-2"
                  >
                    <PlusCircle size={18} /> Start Consultation
                  </button>
                </motion.div>
              ) : (
                // --- ACTIVE CHAT INTERFACE ---
                <motion.div
                  key="chat-view"
                  className="flex flex-col h-full relative z-10 w-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Chat Header */}
                  <header className="px-4 md:px-6 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">

                      {/* BACK BUTTON (Mobile Only) */}
                      {!isDesktop && (
                        <button
                          onClick={handleBackToInbox}
                          className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                          <ArrowLeft size={24} />
                        </button>
                      )}

                      <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-md ring-2 ring-white dark:ring-slate-800">
                          <User size={20} />
                        </div>
                        {!isClosed && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm animate-pulse"></div>}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Admin Conversations</h2>
                          {isClosed && (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
                              Closed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/30">
                            {activeThread.category}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono">ID: #{activeThread.threadId.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </header>

                  {/* Messages List */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-8" id="chat-scroller">
                    {isLoadingMessages ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <Loader2 size={36} className="animate-spin text-indigo-500" />
                        <p className="text-xs font-bold text-indigo-500/60 uppercase tracking-widest animate-pulse">Decrypting secure chat...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-end min-h-full pb-4">
                        <div className="text-center mb-8">
                          <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-300 dark:border-slate-700">
                            Start of conversation
                          </span>
                        </div>

                        <AnimatePresence initial={false}>
                          {messages.map((msg, index) => {
                            const isDoctor = msg.senderRole === "DOCTOR";
                            const isLast = index === messages.length - 1;

                            return (
                              <motion.div
                                key={msg._id || index}
                                variants={messageVariants}
                                initial="hidden"
                                animate="visible"
                                layout
                                className={`flex gap-4 w-full mb-1 ${isDoctor ? "flex-row-reverse" : "flex-row"}`}
                              >
                                {/* Avatar */}
                                <div className={`
                                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-auto shadow-sm ring-2 ring-white dark:ring-slate-900 z-10
                                  ${isDoctor
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                  }
                                `}>
                                  {isDoctor ? <User size={14} /> : <ShieldCheck size={14} />}
                                </div>

                                <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isDoctor ? "items-end" : "items-start"}`}>
                                  {/* Sender Name */}
                                  {!isDoctor && index > 0 && messages[index-1].senderRole === "DOCTOR" && (
                                    <span className="text-[10px] text-slate-400 ml-2 mb-1">ADMIN</span>
                                  )}

                                  <div className={`
                                    relative px-5 py-3.5 text-sm leading-relaxed shadow-sm transition-all duration-300
                                    ${isDoctor
                                      ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl rounded-tr-sm shadow-indigo-500/20"
                                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm"
                                    }
                                    ${msg.__optimistic ? "opacity-70" : "opacity-100"}
                                  `}>
                                    {msg.content}
                                  </div>

                                  <div className={`flex items-center gap-1 mt-1.5 px-1 opacity-70 hover:opacity-100 transition-opacity ${isDoctor ? "flex-row-reverse" : "flex-row"}`}>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isDoctor && isLast && !msg.__optimistic && (
                                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                        <CheckCheck size={12} className="text-indigo-500 dark:text-indigo-400" />
                                      </motion.span>
                                    )}
                                    {msg.__optimistic && (
                                      <Clock size={10} className="text-slate-400 animate-pulse" />
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                        <div ref={messagesEndRef} className="h-4" />
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 md:p-6 bg-gradient-to-t from-slate-100 via-slate-50 to-transparent dark:from-slate-950 dark:via-slate-900/80 sticky bottom-0 z-20">
                    <motion.div
                      layout
                      className={`
                        relative flex flex-col gap-2 p-1.5 rounded-[24px] border shadow-2xl transition-all duration-300 backdrop-blur-xl
                        ${isClosed
                          ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed"
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
                          if (isClosed) return;
                          setReply(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={isSending || isClosed}
                        placeholder={isClosed ? "This ticket is closed." : "Type your reply here..."}
                        rows={1}
                        className="w-full max-h-32 px-4 py-3 bg-transparent resize-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none custom-scrollbar rounded-xl disabled:cursor-not-allowed"
                      />

                      <div className="flex items-center justify-between px-2 pb-1">
                        <div className="flex items-center gap-1">
                          <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors" disabled={isClosed}><Paperclip size={18} /></button>
                          <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-full transition-colors" disabled={isClosed}><Smile size={18} /></button>
                        </div>

                        <motion.button
                          whileHover={!isClosed && !isSending ? { scale: 1.05 } : {}}
                          whileTap={!isClosed && !isSending ? { scale: 0.95 } : {}}
                          onClick={sendReply}
                          disabled={!reply.trim() || isSending || isClosed}
                          className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                            ${!reply.trim() || isSending || isClosed
                              ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                            }
                          `}
                        >
                          <AnimatePresence mode="wait">
                            {isSending ? (
                              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <Loader2 size={16} className="animate-spin" />
                              </motion.div>
                            ) : (
                              <motion.div key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                <span>{isClosed ? "Closed" : "Send"}</span>
                                <Send size={16} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      </div>
                    </motion.div>
                    <div className="text-center mt-2">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Replies are typically within a few minutes.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* CREATE NEW THREAD MODAL */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                variants={modalBackdropVariants}
                initial="hidden" animate="visible" exit="exit"
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
              />

              <motion.div
                variants={modalContentVariants}
                initial="hidden" animate="visible" exit="exit"
                className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-[32px] shadow-2xl shadow-black/50 overflow-hidden border border-slate-200 dark:border-slate-700"
              >
                {/* Decorative Header Blob */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-600 to-purple-700" />
                <div className="absolute top-0 left-0 right-0 h-32 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

                <div className="relative px-8 pt-8 pb-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white shadow-lg">
                      <PlusCircle size={28} />
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <h3 className="text-2xl font-black text-white leading-tight mb-1">New Support Request</h3>
                  <p className="text-indigo-100 text-sm font-medium opacity-90">Describe the case and we&apos;ll assist you shortly.</p>
                </div>

                <div className="p-8 pt-4 space-y-6 bg-white dark:bg-slate-800 rounded-t-[32px] -mt-6 relative z-10">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                      <Tag size={12} />
                      Category
                    </label>
                    <div className="relative group">
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full pl-4 pr-10 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <option value="GENERAL">General Inquiry</option>
                        <option value="QUEUE">Queue / Waiting List</option>
                        <option value="BILLING">Billing & Payments</option>
                        <option value="COMPLAINT">Technical Complaint</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                        <ChevronLeft size={16} className="-rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                      <CornerDownRight size={12} />
                      Message
                    </label>
                    <textarea
                      rows={4}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Please describe the case in detail..."
                      className="w-full p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-400"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createNewThread}
                      disabled={!newContent.trim() || isCreatingThread}
                      className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                    >
                      {isCreatingThread ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      Submit Ticket
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
