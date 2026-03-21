import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { ScanText, Clock, Copy, Check, X } from "lucide-react";

export default function HoverReader({ content }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef(null);

  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Read time
  const readTime = useMemo(() => {
    if (!content) return "0 min read";
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / 200) + " min read";
  }, [content]);

  const getTruncatedText = (text) => {
    if (!text) return "";
    let short = text.split(" ").slice(0, 6).join(" ");
    if (short.length > 36) short = short.slice(0, 36);
    return text.length > short.length ? short + "…" : short;
  };

  // Position logic (desktop)
  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const margin = 12;
    const width = 360;
    const height = 320;

    let top = rect.bottom + margin;
    let left = rect.left;

    if (left + width > window.innerWidth) {
      left = window.innerWidth - width - margin;
    }

    if (top + height > window.innerHeight) {
      top = rect.top - height - margin;
    }

    setCoords({ top, left });
  };

  const handleOpen = () => {
    if (!isMobile) updatePosition();
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!content) return null;

  return (
    <>
      {/* TRIGGER */}
      <div
        ref={triggerRef}
        onMouseEnter={!isMobile ? handleOpen : undefined}
        onMouseLeave={!isMobile ? handleClose : undefined}
        onClick={isMobile ? handleOpen : undefined}
        className="inline-flex items-center gap-2 cursor-pointer group"
      >
        <p className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 transition">
          {getTruncatedText(content)}
        </p>
      </div>

      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* ================= MOBILE ================= */}
              {isMobile ? (
                <motion.div
                  className="fixed inset-0 z-[9999] flex items-end"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* BACKDROP */}
                  <div
                    className="
                      absolute inset-0 
                      bg-black/40 dark:bg-black/60
                      backdrop-blur-[2px]
                    "
                    onClick={handleClose}
                  />

                  {/* SHEET */}
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 24, stiffness: 260 }}
                    className="
                      relative w-full rounded-t-[28px]
                      bg-gradient-to-b from-white to-gray-50
                      dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950

                      border-t border-gray-200/70 dark:border-white/10
                      shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.25)]

                      px-5 pt-4 pb-6
                    "
                  >
                    {/* HANDLE */}
                    <div className="flex justify-center mb-4">
                      <div className="
                        w-10 h-1.5 rounded-full
                        bg-gray-300 dark:bg-gray-600
                      " />
                    </div>

                    {/* HEADER */}
                    <div className="
                      flex items-center justify-between mb-4
                    ">
                      <div className="flex items-center gap-3">
                        <div className="
                          w-9 h-9 rounded-lg flex items-center justify-center
                          bg-indigo-100 text-indigo-600
                          dark:bg-indigo-500/10 dark:text-indigo-300
                        ">
                          <ScanText size={18} />
                        </div>

                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-100">
                            Content Preview
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {readTime}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleClose}
                        className="
                          p-2 rounded-lg
                          text-gray-500 hover:text-gray-700
                          dark:text-gray-400 dark:hover:text-gray-200
                          hover:bg-gray-100 dark:hover:bg-white/5
                          transition
                        "
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* CONTENT */}
                    <div className="
                      max-h-[50vh] overflow-y-auto pr-1
                      text-sm leading-relaxed
                      text-gray-700 dark:text-gray-200
                      whitespace-pre-wrap break-words
                      scrollbar-thin
                      scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700
                    ">
                      {typeof content === "string" ? content.replace(/\\n/g, "\n") : content}
                    </div>

                    {/* ACTION AREA */}
                    <div className="mt-5 space-y-2">
                      <button
                        onClick={handleCopy}
                        className="
                          w-full py-2.5 rounded-xl
                          text-sm font-semibold

                          bg-indigo-600 text-white
                          hover:bg-indigo-700
                          active:scale-[0.98]

                          transition-all
                        "
                      >
                        {copied ? "Copied!" : "Copy Content"}
                      </button>

                      <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">
                        Tap outside to close
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                /* ================= DESKTOP ================= */
                <motion.div
                  onMouseEnter={handleOpen}
                  onMouseLeave={handleClose}
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { type: "spring", stiffness: 260 },
                  }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: "fixed",
                    top: coords.top,
                    left: coords.left,
                    width: 360,
                  }}
                  className="
                    z-[9999] rounded-2xl overflow-hidden
                    bg-white
                    shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]
                    dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950
                    dark:shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8)]
                    border border-gray-200/70 dark:border-white/10
                  "
                >
                  {/* HEADER */}
                  <div className="
                    flex justify-between items-center px-4 py-3

                    bg-gray-50/80 dark:bg-white/[0.02]
                    border-b border-gray-200/60 dark:border-white/5
                  ">
                    <div className="flex items-center gap-2">
                      <div className="
                        w-7 h-7 flex items-center justify-center rounded-md
                        bg-indigo-100 text-indigo-600
                        dark:bg-indigo-500/10 dark:text-indigo-300
                      ">
                        <ScanText size={14} />
                      </div>

                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        Content
                      </span>
                    </div>

                    <button
                      onClick={handleCopy}
                      className="
                        p-1.5 rounded-md
                        text-gray-500 hover:text-indigo-600
                        dark:text-gray-400 dark:hover:text-indigo-300
                        hover:bg-gray-100 dark:hover:bg-white/5
                        transition
                      "
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* CONTENT */}
                  <div className="
                    px-4 py-3 max-h-[280px] overflow-y-auto
                    text-sm leading-6
                    text-gray-700 dark:text-gray-200
                    whitespace-pre-wrap
                    break-words
                    no-scrollbar
                  ">
                    {typeof content === "string" ? content.replace(/\\n/g, "\n") : content}
                  </div>

                  {/* FOOTER */}
                  <div className="
                    px-4 py-2 text-xs flex justify-between items-center
                    bg-gray-50/60 dark:bg-white/[0.02]
                    border-t border-gray-200/60 dark:border-white/5
                    text-gray-500 dark:text-gray-400
                  ">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {readTime}
                    </span>

                    <span className="opacity-70">hover active</span>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}