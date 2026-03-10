import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Building,
  Bell,
  Timer,
  RefreshCcw,
  UserCheck,
  QrCode,
  Ticket,
  ChevronRight
} from "lucide-react";

export default function TokenHeroCard({
  token,
  isCalled,
  isNear,
  setShowCreateTokenModal,
  onLocationClick
}) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-[2.75rem] p-8 md:p-10 shadow-2xl min-h-[360px] flex items-center ${
        !token
          ? "bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800"
          : isCalled
          ? "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 ring-8 ring-emerald-500/20"
          : isNear
          ? "bg-gradient-to-br from-orange-400 via-rose-500 to-red-600 ring-8 ring-orange-500/20"
          : "bg-gradient-to-br from-slate-800 via-slate-900 to-black"
      }`}
    >
      <AnimatePresence mode="wait">
        {token ? (
          /* ================= ACTIVE TOKEN ================= */
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.45 }}
            className="relative z-10 w-full flex flex-col lg:flex-row lg:items-center justify-between gap-10"
          >
            {/* LEFT BLOCK */}
            <div className="space-y-5">
              {/* STATUS BADGE */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest border border-white/30">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                {token.status}
              </div>

              {/* CONSULTATION TYPE */}
              <div className="flex items-center gap-2 text-white/90 text-sm font-bold uppercase tracking-wider">
                {token?.consultationType === "REMOTE" ? <Video size={16} /> : <Building size={16} />}
                {token?.consultationType === "REMOTE" ? "Video Consultation" : "In-Hospital Visit"}
              </div>

              {/* TOKEN NUMBER */}
              <h1 className="text-8xl md:text-9xl font-black tracking-tighter text-white drop-shadow-xl">
                #{token.tokenNumber}
              </h1>

              {/* MESSAGE */}
              <div className="flex items-center gap-3 text-white/90">
                <div className={`p-2 rounded-lg ${isCalled ? "bg-emerald-400/30 animate-bounce" : "bg-white/20"}`}>
                  {isCalled ? <Bell size={22} /> : <Timer size={22} />}
                </div>
                <p className="text-xl font-semibold italic">
                  {isCalled ? (
                    token?.consultationType === "REMOTE"
                      ? "Doctor is ready. Please join the video call."
                      : "It’s your turn. Please proceed to the consultation room."
                  ) : token?.minMinutes === undefined || token?.maxMinutes === undefined ? (
                    "Please wait. You will receive updates shortly."
                  ) : (
                    `About ${token.minMinutes}–${token.maxMinutes} minutes remaining`
                  )}
                </p>
              </div>
            </div>

            {/* RIGHT GLASS CARD */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 max-w-md w-full bg-black/30 backdrop-blur-2xl rounded-[2rem] p-8 border border-white/10"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-8">
                <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.25em]">
                  Queue Progress
                </h4>
                <RefreshCcw size={14} className="text-white/30 animate-spin-slow" />
              </div>

              {/* STEPPER */}
              <div className="relative flex justify-between px-2 mb-10">
                <div className="absolute top-4 left-0 w-full h-1 bg-white/10 rounded-full" />
                <motion.div
                  className="absolute top-4 left-0 h-1 bg-emerald-400 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: isCalled ? "100%" : isNear ? "60%" : "20%" }}
                  transition={{ duration: 0.9 }}
                />

                {[
                  { label: "Queue", active: true },
                  { label: "Near", active: isNear || isCalled },
                  { label: "Calling", active: isCalled, pulse: isCalled },
                ].map((s, i) => (
                  <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full border-4 border-slate-900 flex items-center justify-center transition-all
                        ${s.active ? "bg-emerald-400" : "bg-white/10"}
                        ${s.pulse ? "animate-pulse scale-110 shadow-[0_0_16px_rgba(52,211,153,0.6)]" : ""}
                      `}
                    >
                      {s.active && <UserCheck size={14} className="text-slate-900" />}
                    </div>
                    <span className={`text-[10px] font-bold uppercase ${s.active ? "text-white" : "text-white/30"}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white">{token?.waitingCount ?? 0}</span>
                    <span className="text-emerald-400 text-xs font-bold mb-1">AHEAD</span>
                  </div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    Patients Remaining
                  </p>
                </div>

                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-teal-50 transition-all active:scale-95">
                    <QrCode size={16} /> QR
                  </button>
                  <button
                    onClick={onLocationClick}
                    disabled={!isCalled}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all active:scale-95">
                    <Video size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* ================= EMPTY STATE ================= */
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full flex flex-col items-center text-center space-y-8"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="h-24 w-24 rounded-[2rem] bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center"
            >
              <Ticket size={48} />
            </motion.div>

            <div className="max-w-md">
              <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-3">
                No Active Token
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Booking takes less than 30 seconds. Choose a department to begin.
              </p>
            </div>

            <button
              onClick={() => setShowCreateTokenModal(true)}
              className="group flex items-center gap-4 bg-teal-600 hover:bg-teal-700 text-white px-10 py-5 rounded-2xl font-bold shadow-xl transition-all hover:-translate-y-1 active:scale-95"
            >
              Generate Token
              <ChevronRight className="group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}