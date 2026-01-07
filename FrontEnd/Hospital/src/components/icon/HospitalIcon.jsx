import { motion } from "framer-motion";

export default function HospitalIcon({ className = "w-12 h-12" }) {
  // Animation Variants
  const buildingVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1, 
      transition: { duration: 0.8, ease: "easeInOut" } 
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1, 1.15, 1],
      opacity: [0.7, 1, 0.7, 1, 0.7],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        times: [0, 0.1, 0.2, 0.4, 1],
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        initial="hidden"
        animate="visible"
      >
        {/* Background Subtle Glow Filter */}
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Main Building Structure - Asymmetric Modern Design */}
        <motion.path
          d="M4 28H28M6 28V10C6 8.89543 6.89543 8 8 8H18M26 28V14C26 12.8954 25.1046 12 24 12H18M18 8V28"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          variants={buildingVariants}
        />

        {/* Window Grid - Low Opacity */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 0.5 }}>
          <rect x="9" y="12" width="2" height="2" rx="0.5" fill="currentColor" />
          <rect x="13" y="12" width="2" height="2" rx="0.5" fill="currentColor" />
          <rect x="9" y="16" width="2" height="2" rx="0.5" fill="currentColor" />
          <rect x="13" y="16" width="2" height="2" rx="0.5" fill="currentColor" />
          <rect x="21" y="16" width="2" height="2" rx="0.5" fill="currentColor" />
          <rect x="21" y="20" width="2" height="2" rx="0.5" fill="currentColor" />
        </motion.g>

        {/* The Medical Cross with Pulse Heartbeat Effect */}
        <motion.g
          variants={pulseVariants}
          animate="animate"
          className="text-red-500" // Use a vibrant color for the cross
          style={{ originX: "21px", originY: "9px", filter: "url(#glow)" }}
        >
          {/* Circular Backdrop for Cross */}
          <circle cx="21" cy="9" r="5" fill="currentColor" fillOpacity="0.1" />
          {/* The Cross */}
          <path
            d="M21 6V12M18 9H24"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </motion.g>

        {/* Entrance Door */}
        <motion.path
          d="M11 28V24C11 23.4477 11.4477 23 12 23H15C15.5523 23 16 23.4477 16 24V28"
          stroke="currentColor"
          strokeWidth="1.5"
          variants={buildingVariants}
        />
      </motion.svg>
    </div>
  );
}