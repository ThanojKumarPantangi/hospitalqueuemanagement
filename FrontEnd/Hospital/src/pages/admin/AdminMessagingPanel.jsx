import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Megaphone,
  User,
  Building2,
  MessageSquareText,
  Type,
  FileText,
  Tag,
  Loader2,
  ChevronRight,
} from "lucide-react";

import { showToast } from "../../utils/toastBus";
import {
  sendDepartmentAnnouncementApi,
  sendMessageApi,
  sendGlobalWaitingPatientsApi,
  sendGlobalActiveDoctorsApi,
  previewRecipientsApi,
} from "../../api/message.api";
import { getAllDepartmentsApi } from "../../api/token.api";

/* ===========================
   API Helpers
=========================== */
async function apiSendMessage(payload) {
  try {
    const { data } = await sendMessageApi(payload);
    return data;
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Network error. Please check your internet connection.";
    throw new Error(msg);
  }
}

async function apiSendDepartmentAnnouncement(payload) {
  try {
    const { data } = await sendDepartmentAnnouncementApi(payload);
    return data;
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Network error. Please check your internet connection.";
    throw new Error(msg);
  }
}

async function apiSendGlobalWaitingPatients(payload) {
  try {
    const { data } = await sendGlobalWaitingPatientsApi(payload);
    return data;
  } catch (err) {
    throw new Error(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to send waiting patients message."
    );
  }
}

async function apiSendGlobalActiveDoctors(payload) {
  try {
    const { data } = await sendGlobalActiveDoctorsApi(payload);
    return data;
  } catch (err) {
    throw new Error(
      err?.response?.data?.message || err?.message || "Failed to send doctors message."
    );
  }
}

async function apiGetAllDepartments() {
  try {
    const { data } = await getAllDepartmentsApi();
    return data;
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to load departments.";
    throw new Error(msg);
  }
}

async function apiPreviewRecipients(payload) {
  try {
    const { data } = await previewRecipientsApi(payload);
    return data;
  } catch (err) {
    throw new Error(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to preview recipients."
    );
  }
}

/* ---------------------------
   Reusable Field UI
---------------------------- */
const Field = ({ icon, label, children }) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <span className="text-gray-500 dark:text-gray-400">{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      {children}
    </div>
  );
};

const TabButton = ({ active, icon, title, desc, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border transition
        ${
          active
            ? "border-gray-900 dark:border-gray-200 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg"
            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900/60 text-gray-900 dark:text-gray-100"
        }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-xl ${
            active ? "bg-white/10 dark:bg-black/10" : "bg-gray-100 dark:bg-gray-800"
          }`}
        >
          {icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{title}</p>
            <ChevronRight className={`w-4 h-4 ${active ? "opacity-80" : "opacity-40"}`} />
          </div>
          <p
            className={`text-xs mt-1 ${
              active ? "text-white/80 dark:text-gray-700" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {desc}
          </p>
        </div>
      </div>
    </button>
  );
};

/* ===========================
   MAIN COMPONENT
=========================== */
export default function AdminMessagingPanel() {
  const [mode, setMode] = useState("user"); // "user" | "department" | "waitingPatients" | "activeDoctors"

  // user message form
  const [toUserId, setToUserId] = useState("");
  const [msgTitle, setMsgTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("ANNOUNCEMENT");
  const [metadata, setMetadata] = useState("");

  // department / announcement form
  const [departmentId, setDepartmentId] = useState("");
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  // departments dropdown
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // general UI state
  const [loading, setLoading] = useState(false);

  // preview modal & caching
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const previewCacheRef = useRef(new Map()); // key -> { data, ts }

  const canSendUserMessage = useMemo(() => {
    return toUserId.trim() && content.trim();
  }, [toUserId, content]);

  // department mode requires departmentId, global modes only require content
  const canSendAnnouncement = useMemo(() => {
    if (mode === "department") {
      return departmentId.trim() && annContent.trim();
    }
    return annContent.trim();
  }, [mode, departmentId, annContent]);

  const shortId = (id = "") => {
  if (!id) return "";
  return `…${id.slice(-6)}`;
};


  // Load departments once
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setDepartmentsLoading(true);
        const data = await apiGetAllDepartments();

        // expected response:
        // { success: true, departments: [...] }
        const list = data?.departments || [];

        if (mounted) {
          setDepartments(list);

          // auto-select first department if none selected
          if (!departmentId && list.length > 0) {
            setDepartmentId(list[0]._id);
          }
        }
      } catch (err) {
        showToast({
          type: "error",
          message: err.message || "Failed to load departments",
        });
      } finally {
        if (mounted) setDepartmentsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetUserForm = () => {
    setToUserId("");
    setMsgTitle("");
    setContent("");
    setType("ANNOUNCEMENT");
    setMetadata("");
  };

  const resetAnnouncementForm = () => {
    // keep departmentId so admin doesn't lose selection; reset title/content
    setAnnTitle("");
    setAnnContent("");
  };

  /* ===========================
     Preview Recipients (with 30s cache)
  =========================== */
  const getPreviewCacheKey = (modeKey, deptId) => `${modeKey}:${deptId || ""}`;

  const handlePreviewRecipients = async ({ force = false } = {}) => {
    const key = getPreviewCacheKey(mode, departmentId);

    try {
      // check cache
      if (!force && previewCacheRef.current.has(key)) {
        const entry = previewCacheRef.current.get(key);
        const ageMs = Date.now() - entry.ts;
        if (ageMs <= 30 * 1000) {
          setPreviewData(entry.data);
          setPreviewOpen(true);
          return;
        }
      }

      setPreviewLoading(true);

      const data = await apiPreviewRecipients({
        mode,
        departmentId: mode === "department" ? departmentId : undefined,
      });

      // store cache
      previewCacheRef.current.set(key, { data, ts: Date.now() });

      setPreviewData(data);
      setPreviewOpen(true);
    } catch (err) {
      showToast({ type: "error", message: err.message || "Failed to preview recipients" });
    } finally {
      setPreviewLoading(false);
    }
  };

  /* ===========================
     SEND HANDLER
  =========================== */
  const handleSend = async () => {
    try {
      setLoading(true);

      if (mode === "user") {
        if (!canSendUserMessage) {
          showToast({
            type: "error",
            message: "toUserId and content are required",
          });
          return;
        }

        let parsedMetadata = undefined;
        if (metadata.trim()) {
          try {
            parsedMetadata = JSON.parse(metadata);
          } catch {
            showToast({
              type: "error",
              message: "Metadata must be valid JSON (or keep it empty).",
            });
            return;
          }
        }

        await apiSendMessage({
          toUserId,
          title: msgTitle || undefined,
          content,
          type: type || undefined,
          metadata: parsedMetadata,
        });

        showToast({
          type: "success",
          message: "Message sent successfully",
        });

        resetUserForm();
        return;
      }

      // Announcement / global modes
      if (!canSendAnnouncement) {
        // canSendAnnouncement already accounts for department requirement in department mode
        showToast({
          type: "error",
          message:
            mode === "department"
              ? "departmentId and content are required"
              : "content is required",
        });
        return;
      }

      if (mode === "department") {
        await apiSendDepartmentAnnouncement({
          departmentId,
          title: annTitle || undefined,
          content: annContent,
        });

        showToast({
          type: "success",
          message: "Department announcement sent successfully",
        });

        resetAnnouncementForm();
        // invalidate cache for this key
        previewCacheRef.current.delete(getPreviewCacheKey(mode, departmentId));
        return;
      }

      if (mode === "waitingPatients") {
        await apiSendGlobalWaitingPatients({
          title: annTitle || undefined,
          content: annContent,
        });

        showToast({
          type: "success",
          message: "Message sent to all waiting patients",
        });

        resetAnnouncementForm();
        previewCacheRef.current.delete(getPreviewCacheKey(mode, departmentId));
        return;
      }

      if (mode === "activeDoctors") {
        await apiSendGlobalActiveDoctors({
          title: annTitle || undefined,
          content: annContent,
        });

        showToast({
          type: "success",
          message: "Message sent to all active doctors",
        });

        resetAnnouncementForm();
        previewCacheRef.current.delete(getPreviewCacheKey(mode, departmentId));
        return;
      }
    } catch (err) {
      showToast({
        type: "error",
        message: err.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     RENDER
  =========================== */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Hospital Queue • Admin</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              Messaging & Announcements
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Send direct messages to users or publish department-wide announcements.
            </p>
          </div>

          <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <MessageSquareText className="w-5 h-5" />
              <p className="text-sm font-semibold">Quick Actions</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose a mode and send instantly.</p>
          </motion.div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
          {/* Left: Mode Selector */}
          <div className="space-y-3">
            <TabButton active={mode === "user"} onClick={() => setMode("user")} icon={<User className="w-5 h-5" />} title="Send Message" desc="Direct message to a specific user (toUserId)" />

            <TabButton active={mode === "department"} onClick={() => setMode("department")} icon={<Building2 className="w-5 h-5" />} title="Department Announcement" desc="Broadcast message to all users in a department" />

            <TabButton active={mode === "waitingPatients"} onClick={() => setMode("waitingPatients")} icon={<Megaphone className="w-5 h-5" />} title="Waiting Patients (Today)" desc="Broadcast to all patients with WAITING tokens today" />

            <TabButton active={mode === "activeDoctors"} onClick={() => setMode("activeDoctors")} icon={<User className="w-5 h-5" />} title="Active Doctors" desc="Broadcast to all active & available doctors" />

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <Megaphone className="w-5 h-5" />
                <p className="font-semibold text-sm">Tip</p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">Keep messages short and clear for faster queue handling.</p>
            </motion.div>
          </div>

          {/* Right: Forms */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {mode === "user" ? (
                <motion.div key="userForm" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.25 }} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Admin → Send Message</p>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">Direct User Message</h2>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Send className="w-4 h-4" />
                      <span className="text-sm font-medium">Instant Delivery</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                    <Field icon={<User className="w-4 h-4" />} label="To User ID *">
                      <input
                        value={toUserId}
                        onChange={(e) => setToUserId(e.target.value)}
                        placeholder="e.g. 66b12c9d2a..."
                        className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15"
                      />
                    </Field>

                    <Field icon={<Tag className="w-4 h-4" />} label="Type (optional)">
                      <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15">
                        <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
                        <option value="QUEUE">QUEUE</option>
                        <option value="PAYMENT">PAYMENT</option>
                        <option value="GENERAL">GENERAL</option>
                      </select>
                    </Field>

                    <Field icon={<Type className="w-4 h-4" />} label="Title (optional)">
                      <input value={msgTitle} onChange={(e) => setMsgTitle(e.target.value)} placeholder="e.g. Doctor is delayed" className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15" />
                    </Field>

                    <Field icon={<FileText className="w-4 h-4" />} label="Metadata (optional JSON)">
                      <input value={metadata} onChange={(e) => setMetadata(e.target.value)} placeholder='e.g. {"priority":"high"}' className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15" />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field icon={<MessageSquareText className="w-4 h-4" />} label="Content *">
                      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write the message..." rows={5} className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15 resize-none" />
                    </Field>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-5">
                    <button disabled={loading} onClick={resetUserForm} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition disabled:opacity-50">
                      Clear
                    </button>

                    <motion.button whileTap={{ scale: 0.98 }} disabled={loading} onClick={handleSend} className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:opacity-60">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="deptForm" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.25 }} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {mode === "department" && "Admin → Department Announcement"}
                        {mode === "waitingPatients" && "Admin → Waiting Patients Announcement"}
                        {mode === "activeDoctors" && "Admin → Active Doctors Announcement"}
                      </p>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                        {mode === "department" && "Broadcast Announcement"}
                        {mode === "waitingPatients" && "Waiting Patients (Today)"}
                        {mode === "activeDoctors" && "Active Doctors"}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Megaphone className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {mode === "department" && "Department Wide"}
                        {mode === "waitingPatients" && "Broadcast to waiting patients"}
                        {mode === "activeDoctors" && "Broadcast to active doctors"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                    {mode === "department" && (
                      <Field icon={<Building2 className="w-4 h-4" />} label="Select Department *">
                        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={departmentsLoading} className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15 disabled:opacity-60">
                          {departmentsLoading ? (
                            <option value="">Loading departments...</option>
                          ) : departments.length === 0 ? (
                            <option value="">No departments found</option>
                          ) : (
                            departments.map((d) => (
                              <option key={d._id} value={d._id}>
                                {d.name}
                              </option>
                            ))
                          )}
                        </select>
                      </Field>
                    )}

                    <Field icon={<Type className="w-4 h-4" />} label="Title (optional)">
                      <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="e.g. OP timings changed" className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15" />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field icon={<MessageSquareText className="w-4 h-4" />} label="Content *">
                      <textarea value={annContent} onChange={(e) => setAnnContent(e.target.value)} placeholder="Write the department announcement..." rows={6} className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15 resize-none" />
                    </Field>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-5">
                    <button disabled={loading} onClick={resetAnnouncementForm} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition disabled:opacity-50">
                      Clear
                    </button>

                    {/* Preview Recipients button */}
                    <button
                      disabled={previewLoading}
                      onClick={() => handlePreviewRecipients({ force: false })}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition disabled:opacity-50"
                    >
                      {previewLoading ? "Checking..." : "Preview Recipients"}
                    </button>

                    <motion.button whileTap={{ scale: 0.98 }} disabled={loading || (mode === "department" && (departmentsLoading || !departmentId)) || !canSendAnnouncement} onClick={handleSend} className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:opacity-60">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Megaphone className="w-4 h-4" />
                          Send Announcement
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Recipients ({previewData?.count || 0})</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePreviewRecipients({ force: true })} className="text-sm px-2 py-1 rounded-md border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Refresh</button>
                  <button onClick={() => setPreviewOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
              </div>

              {/* Warning banner */}
              <div className="mt-3 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 text-sm text-yellow-800 dark:text-yellow-300">
                Recipients may change before sending — this is a snapshot. If you want the latest list, click Refresh.
              </div>

              <div className="mt-4 max-h-64 overflow-auto space-y-2">
                {previewData?.recipients?.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">No recipients found</p>
                ) : (
                  previewData.recipients.map((u) => (
                    <div key={u._id} className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
                      <div>
                        <div className="text-gray-900 dark:text-gray-100 font-medium">{u.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">ID {shortId(u._id)}</div>
                      </div>
                      <div className="text-gray-500">{u.role}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 text-right">
                <button onClick={() => setPreviewOpen(false)} className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
