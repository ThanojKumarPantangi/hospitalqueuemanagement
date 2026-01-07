import { motion } from "framer-motion";

/**
 * headlightIntensity:
 * 1   → normal glow
 * 1.3 → stronger ambulance headlights
 */
const WINDOW_DURATIONS = [2.2, 2.6, 3.0, 2.4, 2.8, 3.2, 2.5];

const HospitalBuildingSVG = ({ headlightIntensity = 1 }) => (
  <svg width="220" height="160" viewBox="0 0 220 160" fill="none">

    {/* ================= DEFINITIONS ================= */}
    <defs>
      <radialGradient id="groundReflection" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255,245,200,0.35)" />
        <stop offset="100%" stopColor="rgba(255,245,200,0)" />
      </radialGradient>
    </defs>

    {/* ================= ROOF ================= */}
    <path d="M40 40 H180 L110 12 Z" fill="#0284C7" />

    {/* ================= MAIN BUILDING ================= */}
    <rect
      x="54"
      y="40"
      width="112"
      height="90"
      rx="8"
      fill="#1F2937"
      stroke="#374151"
      strokeWidth="2"
    />

    {/* ================= GROUND REFLECTION ================= */}
    <motion.ellipse
      cx="110"
      cy="134"
      rx="26"
      ry="6"
      fill="url(#groundReflection)"
      animate={{
        opacity: [0, 0.22 * headlightIntensity, 0],
        scaleX: [0.92, 1.08, 0.92],
      }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{ filter: "blur(9px)" }}
    />

    {/* ================= ENTRANCE ================= */}
    <motion.rect
      x="96"
      y="88"
      width="28"
      height="42"
      rx="4"
      fill="#0F172A"
      animate={{
        boxShadow: [
          "0 0 0px rgba(255,245,200,0)",
          `0 0 ${14 * headlightIntensity}px rgba(255,245,200,0.35)`,
          "0 0 0px rgba(255,245,200,0)",
        ],
      }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />

    {/* ================= WINDOWS ================= */}
    {[
      [70, 52], [90, 52], [110, 52], [130, 52],
      [70, 70], [110, 70], [130, 70],
    ].map(([x, y], i) => (
      <motion.rect
        key={i}
        x={x}
        y={y}
        width="12"
        height="10"
        rx="2"
        fill="#FDE68A"
        animate={{ opacity: [0.4, 0.9, 0.5] }}
        transition={{
          duration: WINDOW_DURATIONS[i % WINDOW_DURATIONS.length],
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.3,
        }}
      />
    ))}

    {/* ================= MEDICAL CROSS ================= */}
    <motion.g
      animate={{
        scale: [0.95, 1.05, 0.95],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 2.4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        filter: "drop-shadow(0 0 8px rgba(34,211,238,0.8))",
      }}
    >
      <rect x="104" y="48" width="6" height="20" rx="1" fill="#22D3EE" />
      <rect x="96" y="56" width="22" height="6" rx="1" fill="#22D3EE" />
    </motion.g>

  </svg>
);

export default HospitalBuildingSVG;
