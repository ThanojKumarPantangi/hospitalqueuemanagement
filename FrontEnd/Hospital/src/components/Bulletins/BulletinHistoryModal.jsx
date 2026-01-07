import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Clock, Calendar } from "lucide-react";

export default function BulletinHistoryModal({
  open,
  onClose,
  bulletins = [],
  title = "Announcement History",
}) {
  // Animation Variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20, x: "-50%" },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: "-50%", 
      x: "-50%",
      transition: { type: "spring", damping: 25, stiffness: 300 } 
    },
    exit: { opacity: 0, scale: 0.95, y: 20, x: "-50%", transition: { duration: 0.2 } }
  };

  const listVariants = {
    visible: { transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop with stronger blur */}
          <motion.div
            className="fixed inset-0 z-[60] bg-gray-950/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="
              fixed z-[70]
              left-1/2 top-1/2
              w-[95vw] max-w-lg
              max-h-[85vh]
              bg-white/90 dark:bg-gray-900/90
              backdrop-blur-xl
              rounded-[2.5rem]
              shadow-[0_20px_50px_rgba(0,0,0,0.3)]
              border border-white/20 dark:border-gray-800/50
              flex flex-col
              overflow-hidden
            "
          >
            {/* Header: Visual Depth */}
            <div className="relative px-6 py-5 border-b border-gray-100 dark:border-gray-800/50 flex items-center justify-between bg-white/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                <div>
                  <h3 className="text-base font-black tracking-tight text-gray-800 dark:text-white">
                    {title}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {bulletins.length} Notifications
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-rose-500 transition-colors"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Content: Staggered List */}
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {bulletins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4 border border-dashed border-gray-200 dark:border-gray-700">
                    <AlertCircle className="text-gray-300" size={32} />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">History is empty</p>
                </div>
              ) : (
                bulletins.map((b) => (
                  <motion.div
                    key={b._id}
                    variants={itemVariants}
                    className="group relative flex gap-4 p-4 rounded-3xl bg-gray-50/50 dark:bg-gray-800/30 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 hover:bg-white dark:hover:bg-gray-800/50 transition-all duration-300"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500">
                        <AlertCircle size={16} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                        {b.content}
                      </p>
                      
                      {b.createdAt && (
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                            <Calendar size={10} />
                            {new Date(b.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400/80 uppercase">
                            <Clock size={10} />
                            {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>

            {/* Footer shadow/fade effect */}
            <div className="h-6 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}