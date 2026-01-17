import BaseModal from "./BaseModal";
import Badge from "../badge/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Ban, CalendarDays, Clock3, ShieldAlert } from "lucide-react";

const CancelTokenModal = ({
  open,
  onClose,
  token,
  upcomingTokens,
  cancellingId,
  handleCancelToken,
}) => {
  const cardHover = {
    whileHover: { y: -2, scale: 1.01 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring", stiffness: 240, damping: 18 },
  };

  const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
  };

  const noAppointments = !token && upcomingTokens.length === 0;

  return (
    <BaseModal open={open} onClose={onClose} rounded="rounded-[2.5rem]" maxWidth="max-w-2xl">
      {/* Top Gradient */}
      <div className="h-2 bg-gradient-to-r from-red-500 to-orange-500" />

      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
              Manage <span className="text-red-500">Appointments</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Cancel your active or upcoming visits safely.
            </p>
          </div>

          <motion.div
            {...cardHover}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl border
                       bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
          >
            <ShieldAlert size={16} className="text-red-500" />
            <span className="text-[11px] font-black text-gray-500 dark:text-gray-400">
              Cancellation Manager
            </span>
          </motion.div>
        </div>

        {/* Small info strip */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Active
            </p>
            <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
              {token ? "1 Appointment" : "None"}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Upcoming
            </p>
            <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
              {upcomingTokens?.length || 0} Visits
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Tip
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Active tokens cannot be cancelled once called.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 mb-7 max-h-[440px] overflow-y-auto no-scrollbar space-y-3">
        {noAppointments ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-10 text-center bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 dark:bg-red-900/20">
              <Ban className="text-red-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-bold">
              No active appointments found.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              You can create a new token from dashboard anytime.
            </p>
          </motion.div>
        ) : (
          <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
            {/* Active Token */}
            <AnimatePresence>
              {token && (
                <motion.div
                  variants={itemVariants}
                  layout
                  className="p-4 rounded-3xl bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-900/30 flex justify-between items-center gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg">
                      <Clock3 size={18} />
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
                        Active Now
                      </span>

                      <p className="font-black text-gray-900 dark:text-white flex flex-wrap items-center gap-2 mt-1">
                        #{token.tokenNumber} – {token.departmentName}
                        <Badge date={new Date()} />
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Status: <span className="font-bold">{token.status}</span>
                      </p>
                    </div>
                  </div>

                  <motion.button
                    {...cardHover}
                    disabled={cancellingId === token._id || token.status === "CALLED"}
                    onClick={() => handleCancelToken(token._id)}
                    className="bg-red-500 hover:bg-red-600 active:bg-red-700
                    text-white px-5 py-3 rounded-2xl text-xs font-black
                    transition-all active:scale-95 disabled:opacity-40"
                  >
                    {cancellingId === token._id ? "..." : "Cancel"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upcoming Tokens */}
            <AnimatePresence>
              {upcomingTokens.map((t) => (
                <motion.div
                  key={t._id}
                  variants={itemVariants}
                  layout
                  className="p-4 rounded-3xl bg-gray-50 dark:bg-gray-800/50
                  border border-gray-200 dark:border-gray-700
                  flex justify-between items-center gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                      <CalendarDays size={18} className="text-gray-500" />
                    </div>

                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Upcoming Visit
                      </span>

                      <p className="font-black text-gray-800 dark:text-gray-200 flex flex-wrap items-center gap-2 mt-1">
                        #{t.tokenNumber} – {t.departmentName}
                        <Badge date={t.appointmentDate} />
                      </p>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Planned visit date shown above.
                      </p>
                    </div>
                  </div>

                  <motion.button
                    {...cardHover}
                    disabled={cancellingId === t._id}
                    onClick={() => handleCancelToken(t._id)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                    px-5 py-3 rounded-2xl text-xs font-black
                    transition-all active:scale-95 disabled:opacity-40"
                  >
                    {cancellingId === t._id ? "Wait..." : "Cancel"}
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-8 bg-[#18181b] border-t border-zinc-800 rounded-b-[2rem]">
        <motion.button
          {...cardHover}
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-zinc-800/50 border border-zinc-700
          text-zinc-300 font-black tracking-wide transition-all
          hover:bg-zinc-700 hover:text-white active:scale-95 hover:border-zinc-500"
        >
          Close Manager
        </motion.button>
      </div>
    </BaseModal>
  );
};

export default CancelTokenModal;