import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2 } from "lucide-react";

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modal = {
  hidden: { scale: 0.92, opacity: 0, y: 40 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 22,
    },
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    y: 20,
    transition: { duration: 0.2 },
  },
};

// Only for UI display
const getDurationLabel = (role) => {
  switch (role) {
    case "PATIENT":
      return "30 days";
    case "DOCTOR":
      return "24 hours";
    case "ADMIN":
      return "12 hours";
    default:
      return "a limited time";
  }
};

const TrustDeviceModal = ({ isOpen, onClose, onConfirm, loading, role }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={backdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 space-y-5">
              
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Trust this device?
                </h2>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                You won’t be asked for verification again on this device for{" "}
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {role ? getDurationLabel(role) : "a limited time"}
                </span>.
                <br />
                Only trust personal and secure devices.
              </p>

              {/* Divider */}
              <div className="h-px bg-gray-200 dark:bg-gray-800" />

              {/* Buttons */}
              <div className="flex gap-3">
                
                {/* Not Now */}
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  Not now
                </button>

                {/* Trust */}
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Trust device"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TrustDeviceModal;