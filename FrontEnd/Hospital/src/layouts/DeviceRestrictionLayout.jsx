import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/button/ThemeToggle";
import HospitalIcon from "../components/icon/HospitalIcon";
import { motion } from "framer-motion";

export default function DeviceRestrictionLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col bg-slate-50 text-slate-800
                dark:bg-slate-950 dark:text-slate-100
                transition-colors duration-500"
    >
      {/* Navbar */}
      <header
        className="sticky top-0 z-50 w-full border-b border-slate-200/60
                   bg-white/80 backdrop-blur-xl
                   dark:border-slate-800/60 dark:bg-slate-900/80"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          
          {/* Logo */}
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

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* Logout trigger (NOT full component) */}
            <button
              onClick={() => navigate("/logout")}
              className="
                rounded-lg px-4 py-2 text-sm font-medium
                text-rose-600 hover:text-white
                hover:bg-rose-600
                border border-rose-200 dark:border-rose-800
                transition-colors
              "
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
