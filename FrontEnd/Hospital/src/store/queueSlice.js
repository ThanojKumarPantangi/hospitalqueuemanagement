import { createSlice } from "@reduxjs/toolkit";

const queueSlice = createSlice({
  name: "queue",

  initialState: {
    currentToken: null,
    departments: {},

    // ✅ separated cleanly
    announcements: [],
    chatMessagesByThread: {},

    threads: [],
    activeThread: null,
    isTicketClosed: false,
  },

  reducers: {
    /* ---------------- TOKEN / DEPARTMENT (UNCHANGED) ---------------- */
    setToken: (state, action) => {
      state.currentToken = action.payload;
    },

    setDepartments: (state, action) => {
      const list = action.payload;

      list.forEach((dept) => {
        const existing = state.departments[dept._id] || {};

        state.departments[dept._id] = {
          _id: dept._id,
          name: dept.name?.toUpperCase(),
          isOpen: dept.isOpen,

          serving: dept.serving ?? "-",
          waiting: dept.waiting ?? 0,

          doctor:
            existing.doctor && existing.doctor !== "Assigned"
              ? existing.doctor
              : dept.isOpen
              ? "Assigned"
              : "-",

          currentPatient:
            existing.currentPatient && existing.currentPatient !== "-"
              ? existing.currentPatient
              : "-",

          avgWait: dept.isOpen
            ? `${dept.slotDurationMinutes}m`
            : "-",

          skippedCount: existing.skippedCount || 0,
        };
      });
    },

    tokenCalled: (state, action) => {
      const { tokenId, doctorName, departmentId, tokenNumber, patientName } =
        action.payload;

      if (state.currentToken && state.currentToken._id === tokenId) {
        state.currentToken.status = "CALLED";
        state.currentToken.doctorName = doctorName;
      }

      const dept = state.departments[departmentId];
      if (!dept) return;

      dept.isOpen = true;
      dept.serving = tokenNumber;
      dept.doctor = doctorName;
      dept.currentPatient = patientName;
    },

    tokenCompleted: (state, action) => {
      const { tokenId, departmentId } = action.payload;

      if (state.currentToken && state.currentToken._id === tokenId) {
        state.currentToken = null;
      }

      const dept = state.departments[departmentId];
      if (!dept) return;

      dept.serving = null;
      dept.currentPatient = null;
    },

    tokenSkipped: (state, action) => {
      const { tokenId, departmentId } = action.payload;

      if (state.currentToken && state.currentToken._id === tokenId) {
        state.currentToken = null;
      }

      const dept = state.departments[departmentId];
      if (!dept) return;

      dept.skippedCount = (dept.skippedCount || 0) + 1;
    },

    tokenNoShow: (state, action) => {
      const { tokenId } = action.payload;

      if (state.currentToken && state.currentToken._id === tokenId) {
        state.currentToken = null;
      }
    },

    queueUpdated: (state, action) => {
      const {
        tokenId,
        departmentId,
        patientsAhead,
        minMinutes,
        maxMinutes,
        waitingCount,
        estimatedWait,
      } = action.payload;

      if (state.currentToken && state.currentToken._id === tokenId) {
        if (typeof patientsAhead === "number") {
          state.currentToken.waitingCount = patientsAhead;
        }
        if (typeof minMinutes === "number") {
          state.currentToken.minMinutes = minMinutes;
        }
        if (typeof maxMinutes === "number") {
          state.currentToken.maxMinutes = maxMinutes;
        }
      }

      const dept = state.departments[departmentId];
      if (!dept) return;

      if (typeof waitingCount === "number") {
        dept.waiting = waitingCount;
      }

      if (estimatedWait !== undefined) {
        dept.avgWait = estimatedWait;
      }
    },

    /* ---------------- ANNOUNCEMENTS ---------------- */
    newMessage: (state, action) => {
      const msg = action.payload;
      if (!msg || msg.type !== "ANNOUNCEMENT") return;

      const exists = state.announcements.some((m) => m._id === msg._id);
      if (!exists) state.announcements.unshift(msg); // latest first
    },

    missedMessages: (state, action) => {
      if (!Array.isArray(action.payload)) return;

      const existingIds = new Set(state.announcements.map((m) => m._id));

      const fresh = action.payload.filter(
        (m) => m?.type === "ANNOUNCEMENT" && !existingIds.has(m._id)
      );

      state.announcements = [...fresh, ...state.announcements];
    },

    /* ---------------- CHAT (NORMALIZED) ---------------- */
    newChatMessage: (state, action) => {
        const msg = action.payload;
        if (!msg || !msg.threadId) return;

        const threadId = msg.threadId;

        // ensure message array
        if (!state.chatMessagesByThread[threadId]) {
            state.chatMessagesByThread[threadId] = [];
        }

        const exists = state.chatMessagesByThread[threadId].some(
            (m) => m._id === msg._id
        );

        if (!exists) {
            state.chatMessagesByThread[threadId].push(msg);
        }

        //  check if thread exists
        const threadExists = state.threads.some(
            (t) => t.threadId === threadId
        );

        if (!threadExists) {
            //  NEW THREAD (your missing logic)
            state.threads.unshift({
            threadId,
            lastMessage: msg.content,
            category: msg.category || "GENERAL",
            updatedAt: msg.createdAt,
            unread: true,
            ticketStatus: "OPEN",
            });
            return;
        }
        //  update existing thread
        state.threads = state.threads.map((t) => {
            if (t.threadId !== threadId) return t;

            return {
            ...t,
            lastMessage: msg.content,
            updatedAt: msg.createdAt,
            unread: state.activeThread?.threadId !== threadId,
            };
        });

        // 
        state.threads.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
    },

    ticketClosed: (state, action) => {
      const payload = action.payload;
      if (!payload?.threadId) return;

      const threadId = payload.threadId;
      const closedAt = payload.closedAt || new Date().toISOString();

      state.threads = state.threads.map((t) =>
        t.threadId === threadId
          ? { ...t, ticketStatus: "CLOSED", updatedAt: closedAt }
          : t
      );

      if (state.activeThread?.threadId === threadId) {
        if (!state.chatMessagesByThread[threadId]) {
          state.chatMessagesByThread[threadId] = [];
        }

        state.chatMessagesByThread[threadId].push({
          _id: `sys-${Date.now()}`,
          content: "This ticket has been closed by admin.",
          senderRole: "ADMIN",
          createdAt: closedAt,
          metadata: { system: true },
        });

        state.isTicketClosed = true;
      }
    },

    /* ---------------- HELPERS ---------------- */
    setThreads: (state, action) => {
      state.threads = action.payload || [];
    },

    setActiveThread: (state, action) => {
      state.activeThread = action.payload;
      state.isTicketClosed = false;
    },

    loadThreadMessages: (state, action) => {
        const { threadId, messages } = action.payload;

        state.chatMessagesByThread[threadId] = messages || [];
    },
  },
});

export const {
  setToken,
  setDepartments,
  tokenCalled,
  tokenCompleted,
  tokenSkipped,
  tokenNoShow,
  queueUpdated,

  newMessage,
  missedMessages,

  newChatMessage,
  ticketClosed,

  setThreads,
  setActiveThread,
  loadThreadMessages,
} = queueSlice.actions;

export default queueSlice.reducer;