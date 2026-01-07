import { motion } from "framer-motion";
import HospitalIcon from "../../components/icon/HospitalIcon"
import HospitalBuildingSVG from "../../components/icon/HospitalBuildingSVG";
/* ================= WHEEL ================= */

const Wheel = ({ cx }) => (
  <motion.g
    animate={{ rotate: 360 }}
    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
    style={{ transformOrigin: `${cx}px 70px` }}
  >
    <circle cx={cx} cy="70" r="9" fill="#111827" />
    <circle cx={cx} cy="70" r="3" fill="#9CA3AF" />
    {[0, 60, 120].map((deg) => (
      <line
        key={deg}
        x1={cx}
        y1="70"
        x2={cx}
        y2="62"
        stroke="#9CA3AF"
        strokeWidth="1"
        transform={`rotate(${deg} ${cx} 70)`}
      />
    ))}
  </motion.g>
);

/* ================= AMBULANCE ================= */

const AmbulanceSVG = () => (
  <svg width="110" height="100" viewBox="0 0 110 100" fill="none">
    {/* Headlight */}
    <motion.ellipse
      cx="104"
      cy="58"
      rx="7"
      ry="3.5"
      fill="#FFF6CC"
      animate={{ opacity: [0.7, 1.2, 0.7] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      style={{ filter: "blur(2px)" }}
    />

    {/* Outer diagonal beam (main light on road) */}
    <motion.path
      d="M104 62 L180 82 L150 108 L104 76 Z"
      fill="rgba(255,245,200,0.22)"
      animate={{ opacity: [0.18, 0.45, 0.18] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      style={{ filter: "blur(9px)" }}
    />

    {/* Inner diagonal hotspot */}
    <motion.path
      d="M104 64 L136 80 L130 90 L104 72 Z"
      fill="rgba(255,245,200,0.35)"
      animate={{ opacity: [0.25, 0.6, 0.25] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      style={{ filter: "blur(3px)" }}
    />

    {/* Body bounce */}
    <motion.g
      animate={{ y: [0, -1.2, 0] }}
      transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <path
        d="M12 48 H78 L94 60 V74 H8 V48 Z"
        fill="#F9FAFB"
        stroke="#E5E7EB"
        strokeWidth="2"
        rx="4"
      />

      <path d="M12 48 L22 30 H64 L78 48 Z" fill="#F9FAFB" />

      <rect x="8" y="58" width="86" height="5" fill="#EF4444" />

      <path d="M24 34 H40 V44 H18 L24 34 Z" fill="#BFDBFE" />
      <path d="M44 34 H60 L64 44 H44 V34 Z" fill="#BFDBFE" />

      <rect x="54" y="44" width="4" height="14" fill="#EF4444" />
      <rect x="48" y="50" width="16" height="4" fill="#EF4444" />

      <motion.rect
        x="44"
        y="26"
        width="16"
        height="5"
        rx="1"
        fill="#3B82F6"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      />
    </motion.g>

    <Wheel cx={30} />
    <Wheel cx={68} />
  </svg>
);

/* ================= ROAD ================= */

const RoadSVG = () => (
  <svg width="460" height="120" viewBox="0 0 460 120" fill="none">
    <line
      x1="10"
      y1="80"
      x2="450"
      y2="80"
      stroke="#374151"
      strokeWidth="18"
      strokeLinecap="round"
    />
    <line
      x1="10"
      y1="80"
      x2="450"
      y2="80"
      stroke="#FACC15"
      strokeWidth="3"
      strokeDasharray="16 14"
      strokeLinecap="round"
    />
  </svg>
);

/* ================= MAIN LOADER ================= */

export default function AmbulanceHospitalLoader() {
  return (
    <div className="flex items-center justify-center bg-[#0B0F14] rounded-3xl p-16 border border-slate-800 shadow-2xl">
      <div className="relative w-[460px] h-[240px]">
        {/* Hospital Name */}
        <div className="absolute top-[-56px] left-1/2 -translate-x-1/2 text-center z-30">
          <div className="flex items-center justify-center gap-2">
            {/* Icon container */}
            <div className="
              flex items-center justify-center rounded-lg
              bg-cyan-400/10
              border border-cyan-400/20
            ">
              <HospitalIcon className="w-10 h-9 text-blue-600" />
            </div>


            {/* Hospital name */}
            <motion.h1
              className="
                text-lg font-semibold tracking-wide
                bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400
                bg-clip-text text-transparent
              "
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
            Kumar Hospitals
            </motion.h1>
          </div>
          {/* Subtitle */}
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
            Patient Queue System
          </p>
        </div>
        {/* Road */}
        <div className="absolute bottom-0 left-0 w-full z-0">
          <RoadSVG />
        </div>

        {/* Loading text UNDER the road */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[-28px] z-30">
          <motion.p
            className="text-slate-400 text-md uppercase tracking-widest"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Loading…
          </motion.p>
        </div>

        {/* Hospital */}
        <div className="absolute right-0 bottom-[27px] z-10">
          <HospitalBuildingSVG headlightIntensity={1.4} />
        </div>

        {/* Ambulance */}
        <motion.div
          className="absolute bottom-8 left-0 z-20"
          animate={{ x: [0, 190, 190] }}
          transition={{
            duration: 3.4,
            ease: "easeInOut",
            times: [0, 0.75, 1],
            repeat: Infinity,
          }}
        >
          <AmbulanceSVG />
        </motion.div>
      </div>
    </div>  
  );
}
