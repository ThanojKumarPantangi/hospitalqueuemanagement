import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { ScanText, Clock, Maximize2, Copy, Check } from "lucide-react";

export default function HoverReader({ content }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const triggerRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const [coords, setCoords] = useState({ top: 0, left: 0, side: "right" });
  const [triggerPoint, setTriggerPoint] = useState(null);

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

  const openTooltip = () => {
    clearTimeout(closeTimeoutRef.current);
    setOpen(true);
  };

  const closeTooltip = () => {
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleTriggerEnter = () => {
    if (!triggerRef.current) return;

    const cardElement =
      triggerRef.current.closest(".notification-card-container") ||
      triggerRef.current;

    const rect = cardElement.getBoundingClientRect();

    const gap = 35;
    const tooltipWidth = 380;
    const verticalOffset = -280;

    const spaceRight = window.innerWidth - rect.right;
    const side = spaceRight > tooltipWidth + gap ? "right" : "left";

    setCoords({
      top: rect.bottom + verticalOffset,
      left:
        side === "right"
          ? rect.right + gap
          : rect.left - tooltipWidth - gap,
      side,
    });

    setTriggerPoint({
      x: rect.right,
      y: rect.top + rect.height / 2,
    });

    openTooltip();
  };

  if (!content) return null;

  const tooltipAnchor = {
    x:
      coords.side === "right"
        ? coords.left + 12
        : coords.left + 380 - 12,
    y: coords.top + 150,
  };

  return (
    <>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onMouseEnter={handleTriggerEnter}
        onMouseLeave={closeTooltip}
        className="inline-flex items-center gap-2 cursor-help group max-w-full relative"
      >
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 break-words transition-all duration-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 border-b border-transparent group-hover:border-dashed group-hover:border-indigo-300">
          {getTruncatedText(content)}
        </p>

        <div className="opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200 text-indigo-500">
          <Maximize2 size={13} />
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              {triggerPoint && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{
                    position: "fixed",
                    left: Math.min(triggerPoint.x, tooltipAnchor.x),
                    top: Math.min(triggerPoint.y, tooltipAnchor.y),
                    width: Math.hypot(
                      tooltipAnchor.x - triggerPoint.x + 6,
                      tooltipAnchor.y - triggerPoint.y
                    ),
                    height: 4,
                    transformOrigin: "left center",
                    transform: `rotate(${Math.atan2(
                      tooltipAnchor.y - triggerPoint.y,
                      tooltipAnchor.x - triggerPoint.x
                    )}rad)`,
                    zIndex: 9997,
                    pointerEvents: "none",
                  }}
                  className="
                    bg-gradient-to-r
                    from-indigo-800/0
                    via-indigo-500/90
                    to-indigo-800/0
                    blur-[0.5px]
                    shadow-[0_0_12px_rgba(99,102,241,0.6)]
                  "
                />
              )}

              {/* Tooltip */}
              <motion.div
                onMouseEnter={openTooltip}
                onMouseLeave={closeTooltip}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: { type: "spring", stiffness: 320, damping: 26 },
                }}
                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                style={{
                  position: "fixed",
                  top: coords.top,
                  left: coords.left,
                  width: 380,
                  zIndex: 9999,
                }}
                className="
                  relative flex flex-col overflow-hidden
                  rounded-2xl
                  bg-gradient-to-br from-white/95 via-slate-50/90 to-white/90
                  dark:from-slate-900/95 dark:via-slate-950/95 dark:to-black/95
                  backdrop-blur-xl
                  border border-gray-100/40 dark:border-white/6
                  shadow-[0_32px_90px_-18px_rgba(2,6,23,0.65)]
                "
              >
                {/* Header */}
                <div className="relative z-10 px-6 pt-6 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-700/10 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                      <ScanText size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        Full Content
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                        {readTime}
                      </span>
                    </div>
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 bg-gray-100/60 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                {/* Body */}
                <div className="relative z-10 px-6 pb-5 max-h-[340px] overflow-y-auto custom-scrollbar">
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="text-[14px] leading-7 text-slate-700 dark:text-slate-200 font-medium whitespace-pre-wrap break-words"
                  >
                    {content}
                  </motion.p>
                </div>

                {/* Footer */}
                <div className="relative z-10 px-6 py-3 bg-gradient-to-t from-gray-50/70 to-transparent dark:from-white/4 border-t border-gray-100/50 dark:border-white/6 flex items-center justify-between text-[12px] text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock size={13} />
                    {readTime}
                  </div>
                  <span className="text-xs">auto-dismiss</span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
