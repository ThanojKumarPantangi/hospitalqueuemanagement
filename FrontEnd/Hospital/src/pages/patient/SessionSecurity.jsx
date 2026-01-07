import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Monitor, Smartphone, Globe } from "lucide-react";
import SessionCard from "../../components/session/SessionCard";
import LogoutAllButton from "../../components/session/LogoutAllButton";
import Loader from "../../components/animation/Loader";
import Toast from "../../components/ui/Toast";
import Navbar from '../../components/Navbar/PatientNavbar';

import {getMySessionApi} from "../../api/session.api";

export default function SessionSecurity() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
  const fetchSessions = async () => {
    try {
      const res = await getMySessionApi();
      setSessions(res.data.sessions || []);
      setCurrentSessionId(res.data.currentSessionId || "");
    } catch (error) {
      console.error("Failed to fetch sessions", error);
      setToast({
        type: "error",
        message:
          error?.response?.data?.message || "Failed to fetch sessions",
      });
    } finally {
      setLoading(false);
    }
  };

  fetchSessions();
}, []);


  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#212121]/80 backdrop-blur-sm">
        <Loader />
      </div>
    );
  }

  return (
    <>
      {/* Notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 p-4 md:p-6 space-y-8 pb-24">
        <Navbar activePage="Security" />
        <main className="max-w-5xl mx-auto space-y-8">
          <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="text-emerald-500 w-8 h-8" />
            <h2 className="text-2xl font-bold text-white">Security & Sessions</h2>
          </div>
          <p className="text-gray-400">
            Manage your active sessions and log out of devices you dont recognize.
          </p>
          </motion.div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {sessions?.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  isCurrent={session._id === currentSessionId}
                  onLogout={() =>
                    setSessions((prev) => prev.filter((s) => s._id !== session._id))
                  }
                />
              ))}
            </AnimatePresence>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 pt-6 border-t border-gray-800"
          >
            <LogoutAllButton />
          </motion.div>
        </main>
      </div>
    </>
  );
}