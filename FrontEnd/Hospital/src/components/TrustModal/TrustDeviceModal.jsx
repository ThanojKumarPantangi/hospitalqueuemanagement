import { motion, AnimatePresence } from "framer-motion";

const TrustDeviceModal = ({ isOpen, onClose, onConfirm, loading }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 space-y-4">
              
              {/* Title */}
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Trust this device?
              </h2>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                You won’t be asked for verification again on this device for a limited time.
                Only trust personal devices.
              </p>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                
                {/* No */}
                <button
                  onClick={onClose}
                  className="flex-1 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Not now
                </button>

                {/* Yes */}
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Trust device"}
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