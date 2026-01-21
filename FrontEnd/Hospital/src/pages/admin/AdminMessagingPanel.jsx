import React, { useEffect, useMemo, useState } from "react";
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
            active
              ? "bg-white/10 dark:bg-black/10"
              : "bg-gray-100 dark:bg-gray-800"
          }`}
        >
          {icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{title}</p>
            <ChevronRight
              className={`w-4 h-4 ${active ? "opacity-80" : "opacity-40"}`}
            />
          </div>
          <p
            className={`text-xs mt-1 ${
              active
                ? "text-white/80 dark:text-gray-700"
                : "text-gray-500 dark:text-gray-400"
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
  const [mode, setMode] = useState("user"); // "user" | "department"

  // user message form
  const [toUserId, setToUserId] = useState("");
  const [msgTitle, setMsgTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("ANNOUNCEMENT");
  const [metadata, setMetadata] = useState("");

  // department announcement form
  const [departmentId, setDepartmentId] = useState("");
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  // departments dropdown
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const [loading, setLoading] = useState(false);

  const canSendUserMessage = useMemo(() => {
    return toUserId.trim() && content.trim();
  }, [toUserId, content]);

  const canSendAnnouncement = useMemo(() => {
    return departmentId.trim() && annContent.trim();
  }, [departmentId, annContent]);

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
    setDepartmentId(departments?.[0]?._id || "");
    setAnnTitle("");
    setAnnContent("");
  };

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
      } else {
        if (!canSendAnnouncement) {
          showToast({
            type: "error",
            message: "departmentId and content are required",
          });
          return;
        }

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hospital Queue • Admin
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              Messaging & Announcements
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Send direct messages to users or publish department-wide announcements.
            </p>
          </div>

          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <MessageSquareText className="w-5 h-5" />
              <p className="text-sm font-semibold">Quick Actions</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Choose a mode and send instantly.
            </p>
          </motion.div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
          {/* Left: Mode Selector */}
          <div className="space-y-3">
            <TabButton
              active={mode === "user"}
              onClick={() => setMode("user")}
              icon={<User className="w-5 h-5" />}
              title="Send Message"
              desc="Direct message to a specific user (toUserId)"
            />

            <TabButton
              active={mode === "department"}
              onClick={() => setMode("department")}
              icon={<Building2 className="w-5 h-5" />}
              title="Department Announcement"
              desc="Broadcast message to all users in a department"
            />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <Megaphone className="w-5 h-5" />
                <p className="font-semibold text-sm">Tip</p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                Keep messages short and clear for faster queue handling.
              </p>
            </motion.div>
          </div>

          {/* Right: Forms */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {mode === "user" ? (
                <motion.div
                  key="userForm"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-5 md:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Admin → Send Message
                      </p>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                        Direct User Message
                      </h2>
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
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15"
                      >
                        <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
                        <option value="QUEUE">QUEUE</option>
                        <option value="PAYMENT">PAYMENT</option>
                        <option value="GENERAL">GENERAL</option>
                      </select>
                    </Field>

                    <Field icon={<Type className="w-4 h-4" />} label="Title (optional)">
                      <input
                        value={msgTitle}
                        onChange={(e) => setMsgTitle(e.target.value)}
                        placeholder="e.g. Doctor is delayed"
                        className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15"
                      />
                    </Field>

                    <Field
                      icon={<FileText className="w-4 h-4" />}
                      label="Metadata (optional JSON)"
                    >
                      <input
                        value={metadata}
                        onChange={(e) => setMetadata(e.target.value)}
                        placeholder='e.g. {"priority":"high"}'
                        className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15"
                      />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field
                      icon={<MessageSquareText className="w-4 h-4" />}
                      label="Content *"
                    >
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write the message..."
                        rows={5}
                        className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15 resize-none"
                      />
                    </Field>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-5">
                    <button
                      disabled={loading}
                      onClick={resetUserForm}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition disabled:opacity-50"
                    >
                      Clear
                    </button>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                      onClick={handleSend}
                      className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:opacity-60"
                    >
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
                <motion.div
                  key="deptForm"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-5 md:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Admin → Department Announcement
                      </p>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                        Broadcast Announcement
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Megaphone className="w-4 h-4" />
                      <span className="text-sm font-medium">Department Wide</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                    <Field
                      icon={<Building2 className="w-4 h-4" />}
                      label="Select Department *"
                    >
                      <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        disabled={departmentsLoading}
                        className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15 disabled:opacity-60"
                      >
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

                    <Field icon={<Type className="w-4 h-4" />} label="Title (optional)">
                      <input
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        placeholder="e.g. OP timings changed"
                        className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15"
                      />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field
                      icon={<MessageSquareText className="w-4 h-4" />}
                      label="Content *"
                    >
                      <textarea
                        value={annContent}
                        onChange={(e) => setAnnContent(e.target.value)}
                        placeholder="Write the department announcement..."
                        rows={6}
                        className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/15 resize-none"
                      />
                    </Field>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-5">
                    <button
                      disabled={loading}
                      onClick={resetAnnouncementForm}
                      className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition disabled:opacity-50"
                    >
                      Clear
                    </button>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      disabled={loading || departmentsLoading || !departmentId}
                      onClick={handleSend}
                      className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition disabled:opacity-60"
                    >
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
    </div>
  );
}
