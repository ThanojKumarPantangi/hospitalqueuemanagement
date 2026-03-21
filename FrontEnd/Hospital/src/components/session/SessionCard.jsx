import { motion } from "framer-motion";
import {
  Monitor,
  Smartphone,
  LogOut,
  MapPin,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { logoutSessionApi,RemoveTrustApi} from "../../api/session.api";
import {getDevice} from "../../utils/deviceAgent.js"
import getTimeLeft from "../../utils/timeLeft.js";
import { showToast } from "../../utils/toastBus.js";

export default function SessionCard({ session, isCurrent, onLogout,onRemove }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [trusting, setTrusting] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      const res=await logoutSessionApi(session._id);
      showToast({
        type: "success",
        message: res?.data?.message || "Logged out successfully",
      })
      onLogout();
    } catch (error) {
      console.error("Logout failed", error);
      showToast({
        type: "error",
        message: error?.response?.data?.message || "Failed to log out",
      });
    } finally {
      setLoggingOut(false);
    }
  };

  const handleTrust=async()=>{
    if (trusting) return;
    try {
      setTrusting(true);
      const res=await RemoveTrustApi({deviceId:session.deviceId});
      showToast({
        type: "success",
        message: res?.data?.message || "Trust removed successfully",
      })
      onRemove();
    } catch (error) {
      console.error("Remove trust failed", error);
      showToast({
        type: "error",
        message: error?.response?.data?.message || "Failed to remove trust",
      });
    } finally {
      setTrusting(false);
    }
  }
  
  const isMobile = /mobile|iphone|android/i.test(session.device || "");

  const locationText = [
    session?.location?.city,
    session?.location?.region,
    session?.location?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const timezoneText = session?.location?.timezone || "";

  const showLocation = Boolean(locationText || timezoneText);

  const timeLeft = getTimeLeft(session.trustExpiresAt);

  const ip = session?.ipAddress;
  const maskedIP = ip?.includes(':')
    ? ip.split(':').slice(0, 2).join(':') + ':...'
    : ip?.split('.').slice(0, 2).join('.') + '...';

    const device = getDevice(session.userAgent);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className={`
        relative
        flex flex-col sm:flex-row
        items-start sm:items-center
        gap-4
        p-5
        rounded-2xl
        border
        overflow-hidden
        transition-all duration-300
        bg-white border-slate-200 shadow-sm
        dark:bg-[#1a1a1a] dark:border-white/5 dark:shadow-2xl
        ${isCurrent ? "ring-2 ring-emerald-500/50 dark:ring-emerald-500/30" : ""}
      `}
    >
      {/* ================= LEFT ================= */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {/* Icon */}
        <div
          className={`
            shrink-0 p-3.5 rounded-2xl
            ${
              isCurrent
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20"
                : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
            }
          `}
        >
          {isMobile ? (
            <Smartphone size={24} strokeWidth={2} />
          ) : (
            <Monitor size={24} strokeWidth={2} />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          {/* Device Name */}
          <h3
            className="
              font-bold
              text-sm sm:text-lg
              text-slate-900 dark:text-white
              overflow-hidden text-ellipsis whitespace-nowrap
              max-w-full
            "
            title={device}
          >
            {device.fullName || "Unknown Device"}
          </h3>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {isCurrent && (
              <span className="
                inline-flex items-center gap-1 mt-1
                px-2 py-0.5
                text-[11px] font-bold uppercase tracking-wider
                rounded-md
                bg-emerald-100 text-emerald-700
                border border-emerald-200
                dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30
              ">
                <ShieldCheck size={12} />
                Current
              </span>
            )}

            {session.isTrusted && (
              <span className="
                inline-flex items-center gap-1 mt-1
                px-2 py-0.5
                text-[11px] font-bold uppercase tracking-wider
                rounded-md
                bg-emerald-100 text-emerald-700
                border border-emerald-200
                dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30
              ">
                <ShieldCheck size={12} />
                Trusted {timeLeft && `• ${timeLeft}`}
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
            {/* IP + Location + Timezone */}
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 min-w-0">
              <MapPin size={14} />
              <div className="min-w-0">
                <span className="font-mono truncate block">
                  {maskedIP}
                </span>

                {showLocation && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate block">
                    {locationText}
                    {timezoneText ? ` • ${timezoneText}` : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Last Seen */}
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-400 dark:text-slate-500">
              <Clock size={14} />
              <span>
                {new Date(session.lastSeenAt).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RIGHT ================= */}
      {!isCurrent && (
        <div className="shrink-0 w-full sm:w-auto mt-3 sm:mt-0 flex gap-2">
          
          {/* Logout */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={loggingOut}
            onClick={handleLogout}
            className={`
              flex-1 sm:flex-none
              flex items-center justify-center gap-2
              px-4 py-2.5
              rounded-xl
              text-sm font-bold
              transition-all
              ${
                loggingOut
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-white/5"
                  : "text-red-600 bg-red-50 hover:bg-red-600 hover:text-white dark:text-red-400 dark:bg-red-400/10 dark:hover:bg-red-500"
              }
            `}
          >
            <LogOut size={16} strokeWidth={2.5} />
            {loggingOut ? "Removing..." : "Logout"}
          </motion.button>

          {/* Remove Trust */}
          {session.isTrusted && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={trusting}
              onClick={handleTrust}
              className={`
                flex-1 sm:flex-none
                flex items-center justify-center gap-2
                px-4 py-2.5
                rounded-xl
                text-sm font-semibold
                transition-all
                ${
                  trusting
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-white/5"
                    : "text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white dark:text-blue-400 dark:bg-blue-400/10 dark:hover:bg-blue-500"
                }
              `}
            >
              <ShieldCheck size={16} />
              {trusting ? "Updating..." : "Remove Trust"}
            </motion.button>
          )}

        </div>
      )}
    </motion.div>
  );
}
