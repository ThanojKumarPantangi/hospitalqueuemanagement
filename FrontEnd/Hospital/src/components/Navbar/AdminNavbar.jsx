import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Stethoscope,
  Building2,
  MonitorCheck,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "../button/ThemeToggle";
import HospitalIcon from "../icon/HospitalIcon";
import { useAuth } from "../../hooks/useAuth";

const adminNavLinks = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Departments", path: "/admin/departments", icon: Building2 },
  { name: "Queue Monitor", path: "/admin/queue-monitor", icon: MonitorCheck },
];

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const onLogout = () => {
    navigate("/logout");
  };

  const mobileMenuVariants = {
    closed: { height: 0, opacity: 0 },
    open: { height: "auto", opacity: 1, transition: { duration: 0.25 } },
  };

  const mobileItemVariants = {
    closed: { x: -12, opacity: 0 },
    open: { x: 0, opacity: 1 },
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* LEFT: Logo & Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate("/admin/dashboard")}
            role="button"
            tabIndex={0}
          >
            <motion.div
              whileHover={{ rotate: 10 }}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 border border-cyan-500/20"
            >
              <HospitalIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </motion.div>
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-none">
                Smart<span className="text-cyan-600 dark:text-cyan-400">Q</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                Admin Portal
              </span>
            </div>
          </div>

          {/* CENTER: Desktop Navigation */}
          <div className="hidden lg:flex items-center bg-gray-100/50 dark:bg-gray-900/50 p-1 rounded-full border border-gray-200 dark:border-gray-800">
            {adminNavLinks.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "text-teal-700 dark:text-teal-300"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
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

          {/* RIGHT: Actions & User */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />

            <button className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-gray-950" />
            </button>

            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-800">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                  {user?.name || "Dr. Administrator"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {user?.role || "ADMIN"}
                </p>
              </div>

              <div className="relative group cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-white dark:bg-gray-950 flex items-center justify-center overflow-hidden">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || "Admin")}`}
                      alt="User"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg"
              aria-label={mobileOpen ? "Close mobile menu" : "Open mobile menu"}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="lg:hidden overflow-hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
          >
            <div className="px-4 py-6 space-y-1">
              {adminNavLinks.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.name}
                    variants={mobileItemVariants}
                    onClick={() => {
                      navigate(item.path);
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

export default AdminNavbar;
