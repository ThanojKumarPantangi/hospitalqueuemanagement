import { motion } from "framer-motion";
import {
  Smartphone,
  Tablet,
  Laptop,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import DeviceRestrictionLayout from "../../layouts/DeviceRestrictionLayout";

/* ================= Animations ================= */

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.15,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 130, damping: 18 },
  },
};

/* ================= Device Card ================= */

function DeviceCard({ icon: Icon, label, supported }) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col items-center text-center"
    >
      {/* Icon Box */}
      <div className="relative mb-5">
        <div
          className={`
            w-20 h-20 sm:w-24 sm:h-24
            flex items-center justify-center
            rounded-2xl
            ${
              supported
                ? `
                  bg-indigo-100 text-indigo-600
                  dark:bg-indigo-500/20 dark:text-indigo-300
                `
                : `
                  bg-slate-200 text-slate-400
                  dark:bg-slate-700/40 dark:text-slate-400
                `
            }
          `}
        >
          <Icon size={40} strokeWidth={1.4} />
        </div>

        {/* Status Badge */}
        <div className="absolute -bottom-2 -right-2 rounded-full p-0.5 shadow
                        bg-white dark:bg-slate-800">
          {supported ? (
            <CheckCircle2
              size={22}
              className="text-emerald-500 dark:text-emerald-400"
            />
          ) : (
            <XCircle
              size={22}
              className="text-rose-500 dark:text-rose-400"
            />
          )}
        </div>
      </div>

      {/* Label */}
      <p className="text-sm sm:text-base font-semibold
                    text-slate-800 dark:text-slate-200">
        {label}
      </p>

      {/* Status */}
      <p
        className={`mt-1 text-xs sm:text-sm font-medium ${
          supported
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-500 dark:text-rose-400"
        }`}
      >
        {supported ? "Supported" : "Not Supported"}
      </p>
    </motion.div>
  );
}

/* ================= Main Component ================= */

export default function DeviceRestriction({
  title = "This site is only accessible from desktop and laptop",
}) {
  return (
    <DeviceRestrictionLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="
          w-full max-w-4xl
          rounded-[2.75rem]
          bg-white dark:bg-slate-900/80
          border border-slate-200 dark:border-slate-800
          shadow-2xl dark:shadow-black/40
          px-8 py-10 sm:px-16 sm:py-14
          text-center
        "
      >
        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="
            text-xl sm:text-3xl
            font-bold
            text-slate-900 dark:text-slate-100
            mb-12
            leading-snug
          "
        >
          {title}
        </motion.h1>

        {/* Devices – ALWAYS ROW */}
        <div className="flex items-start justify-between gap-10 sm:gap-16">
          <DeviceCard icon={Smartphone} label="Mobile" supported={false} />
          <DeviceCard icon={Tablet} label="Tablet" supported={true} />
          <DeviceCard icon={Laptop} label="Desktop" supported={true} />
        </div>
      </motion.div>
    </DeviceRestrictionLayout>
  );
}
