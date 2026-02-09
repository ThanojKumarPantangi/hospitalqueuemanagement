import { useState } from "react";
import { useNavigate, useLocation,Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCog,
  LogOut,
  Menu,
  X,
  Bell,
  MessagesSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "../button/ThemeToggle";
import HospitalIcon from "../icon/HospitalIcon";
import { useAuth } from "../../hooks/useAuth";

const navLinks = [
  { name: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
  { name: "My Queue", href: "/doctor/queue", icon: Users },
  { name: "Profile", href: "/doctor/profile", icon: UserCog },
];

const DoctorNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const onLogout = () => {
    navigate("/logout");
  };

  // --- Animation Variants ---
  const mobileMenuVariants = {
    closed: { height: 0, opacity: 0 },
    open: {
      height: "auto",
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        when: "beforeChildren",
      },
    },
  };

  const mobileItemVariants = {
    closed: { x: -20, opacity: 0 },
    open: { x: 0, opacity: 1 },
  };

  const dropdownVariants = {
    closed: { opacity: 0, y: 10, display: "none" },
    open: { 
      opacity: 1, 
      y: 0, 
      display: "block",
      transition: { type: "spring", stiffness: 300, damping: 25 }
    },
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          
          {/* ================= LEFT: Logo ================= */}
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => navigate("/doctor/dashboard")}
          >
            <motion.div 
              whileHover={{ rotate: 10 }}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/10 to-teal-500/10 border border-cyan-500/20"
            >
              <HospitalIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </motion.div>
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-none">
                Smart<span className="text-cyan-600 dark:text-cyan-400">Q</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                Doctor Portal
              </span>
            </div>
          </div>

          {/* ================= CENTER: Desktop Nav ================= */}
          <div className="hidden md:flex items-center bg-gray-100/50 dark:bg-gray-900/50 p-1 rounded-full border border-gray-200 dark:border-gray-800">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;

              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "text-teal-700 dark:text-teal-300"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="doctorNavPill"
                      className="absolute inset-0 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-200 dark:border-gray-700"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ================= RIGHT: Actions & Profile ================= */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />

            {/* Notifications */}
            <button className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-gray-950" />
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block" />

            {/* Profile Dropdown (Desktop) */}
            <div 
              className="relative hidden sm:block"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="flex items-center gap-3 text-left">
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                    {user?.name?.toUpperCase() || "Dr. Unknown"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {user?.role || "DOCTOR"}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-400 to-cyan-500 p-[2px]">
                   <div className="w-full h-full rounded-full bg-white dark:bg-gray-950 overflow-hidden">
                    <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "Doctor"}`} 
                        alt="Profile" 
                        className="w-full h-full"
                    />
                   </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              <motion.div
                variants={dropdownVariants}
                initial="closed"
                animate={dropdownOpen ? "open" : "closed"}
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
              >
                <div className="p-2 space-y-1">
                  <div className="px-3 py-2 lg:hidden">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user?.name || "Dr. Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                        {user?.role || "Doctor"}
                    </p>
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-1 lg:hidden" />
                  
                  <button 
                    onClick={() => navigate("/doctor/profile")} 
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <UserCog className="w-4 h-4 text-gray-400" /> Edit Profile
                  </button>

                  <button 
                    onClick={() => navigate("/doctor/inbox")} 
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <MessagesSquare className="w-4 h-4 text-gray-400" /> Inbox
                  </button>
                  
                  <Link
                    to="/doctor/change-password"
                    className="
                      inline-flex items-center justify-center gap-2
                      px-4 py-2
                      bg-gray-900/60 
                      text-sm font-semibold text-teal-300
                      hover:bg-gray-900 hover:border-teal-400/40 hover:text-teal-200
                      transition duration-200
                      shadow-sm
                      w-full sm:w-auto
                    "
                  >
                    🔒 Change Password
                  </Link>

                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
                  <button 
                    onClick={onLogout} 
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ================= MOBILE MENU ================= */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="md:hidden overflow-hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
          >
            <div className="px-4 py-6 space-y-1">
              {navLinks.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <motion.button
                    key={item.name}
                    variants={mobileItemVariants}
                    onClick={() => {
                      navigate(item.href);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-teal-600" : "text-gray-400"}`} />
                    {item.name}
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500" />}
                  </motion.button>
                );
              })}

              <div className="h-px bg-gray-100 dark:bg-gray-800 my-4" />

              <motion.button
                variants={mobileItemVariants}
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default DoctorNavbar;