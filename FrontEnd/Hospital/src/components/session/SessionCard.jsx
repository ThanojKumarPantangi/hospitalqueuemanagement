import { motion } from "framer-motion";
import { Monitor, Smartphone, LogOut, MapPin, Clock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { logoutSessionApi } from "../../api/session.api";

export default function SessionCard({ session, isCurrent, onLogout }) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await logoutSessionApi(session._id);
      onLogout();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const isMobile = /mobile|iphone|android/i.test(session.device || "");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className={`
        relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all duration-300
        /* LIGHT THEME: Soft white, subtle border */
        bg-white border-slate-200 shadow-sm
        /* DARK THEME: Deep charcoal, glass stroke */
        dark:bg-[#1a1a1a] dark:border-white/5 dark:shadow-2xl
        ${isCurrent ? "ring-2 ring-emerald-500/50 dark:ring-emerald-500/30" : ""}
      `}
    >
      {/* LEFT SECTION: Icon and Info */}
      <div className="flex items-start gap-4 w-full">
        {/* Device Icon Wrapper */}
        <div
          className={`
            shrink-0 p-3.5 rounded-2xl transition-colors
            ${isCurrent 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20" 
              : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
            }
          `}
        >
          {isMobile ? <Smartphone size={24} strokeWidth={2} /> : <Monitor size={24} strokeWidth={2} />}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-slate-900 dark:text-white truncate text-lg">
              {session.device || "Unknown Device"}
            </h3>

            {isCurrent && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                <ShieldCheck size={12} />
                Current
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
              <MapPin size={14} />
              <span className="font-mono">{session.ipAddress || "0.0.0.0"}</span>
            </div>

            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-400 dark:text-slate-500">
              <Clock size={14} />
              <span>
                {new Date(session.lastSeenAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Action Button */}
      <div className="w-full sm:w-auto mt-2 sm:mt-0">
        {!isCurrent && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={loggingOut}
            onClick={handleLogout}
            className={`
              w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
              ${loggingOut
                ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-white/5 dark:text-slate-600"
                : "text-red-600 bg-red-50 hover:bg-red-600 hover:text-white dark:text-red-400 dark:bg-red-400/10 dark:hover:bg-red-500 dark:hover:text-white shadow-sm"
              }
            `}
          >
            <LogOut size={16} strokeWidth={2.5} />
            {loggingOut ? "Removing..." : "Logout"}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}