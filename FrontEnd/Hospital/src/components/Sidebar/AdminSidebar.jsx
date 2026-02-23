import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Stethoscope,
  Building2,
  MonitorCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3 ,
  Menu,
  Mail,
  Inbox,
  RefreshCcw,
  X
} from "lucide-react";
import HospitalIcon from "../icon/HospitalIcon"; // Assuming you have this

// NOTE: This component now receives isCollapsed and setIsCollapsed from the layout.
const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Doctors", path: "/admin/doctors", icon: Stethoscope },
    { name: "Departments", path: "/admin/departments", icon: Building2 },
    { name: "Queue Monitor", path: "/admin/queue-monitor", icon: MonitorCheck },
    { name: "Messsage", path: "/admin/messaging", icon:Mail },
    {name:"Inbox",path:"/admin/inbox", icon:Inbox},
    { name: "Analytics", path: "/admin/analytics", icon:BarChart3 },
    { name: "Reset", path: "/admin/reset-mfa", icon:RefreshCcw },
    { type: "divider" },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];
  // --- Animation Variants ---
  const sidebarVariants = {
    expanded: { width: "16rem" }, // 256px
    collapsed: { width: "5rem" }, // 80px
  };

  return (
    <>
      {/* ================= MOBILE TOGGLE (Visible only on mobile) ================= */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm text-gray-600 dark:text-gray-300"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* ================= MOBILE OVERLAY & SIDEBAR (starts below navbar) ================= */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              // overlay only over content below navbar
              className="fixed left-0 right-0 top-16 bottom-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              // start below navbar (top-16) and end at bottom (bottom-0)
              className="fixed left-0 top-16 bottom-0 z-50 w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 lg:hidden flex flex-col overflow-y-auto"
            >
              {/* Mobile Header */}
              <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <HospitalIcon className="w-8 h-8 text-cyan-600" />
                  <span className="font-bold text-lg text-gray-900 dark:text-white">Admin</span>
                </div>
                <button onClick={() => setIsMobileOpen(false)} aria-label="Close sidebar">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Mobile Nav */}
              <div className="flex-1 p-4 space-y-2">
                {menuItems.map((item, idx) =>
                  item.type === "divider" ? (
                    <div key={idx} className="h-px bg-gray-100 dark:bg-gray-800 my-4" />
                  ) : (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setIsMobileOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                        location.pathname === item.path
                          ? "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </button>
                  )
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ================= DESKTOP SIDEBAR (starts below navbar) ================= */}
      <motion.aside
        variants={sidebarVariants}
        animate={isCollapsed ? "collapsed" : "expanded"}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        // make it start below navbar (top-16) and extend to bottom; keep z below navbar
        className="hidden lg:flex fixed left-0 top-16 bottom-0 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex-col z-40 shadow-xl shadow-gray-200/50 dark:shadow-none"
      >
        {/* --- Header / Logo --- */}
        <div className="h-20 flex items-center justify-center relative border-b border-gray-100 dark:border-gray-800/50">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap px-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center">
              <HospitalIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex flex-col"
                >
                  <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">
                    Smart<span className="text-cyan-500">Q</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                    Admin Portal
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collapse Toggle Button (Absolute on header) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full p-1 text-gray-500 hover:text-cyan-600 transition-colors shadow-sm"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>

        {/* --- Navigation Links --- */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2 custom-scrollbar">
          {menuItems.map((item, idx) => {
            if (item.type === "divider") {
              return <div key={idx} className="h-px bg-gray-100 dark:bg-gray-800 my-2 mx-2" />;
            }

            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.name : ""}
                className={`relative w-full flex items-center group rounded-xl transition-all duration-200 ${
                  isCollapsed ? "justify-center px-0 py-3" : "justify-start px-4 py-3"
                } ${
                  isActive
                    ? "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {/* Active Indicator Bar (Left) */}
                {isActive && (
                  <motion.div
                    layoutId="active-sidebar-indicator"
                    className={`absolute left-0 rounded-r-full bg-teal-500 ${
                      isCollapsed ? "h-8 w-1 top-1.5" : "h-6 w-1 top-3.5"
                    }`}
                  />
                )}

                <Icon
                  className={`flex-shrink-0 transition-colors ${
                    isCollapsed ? "w-6 h-6" : "w-5 h-5 mr-3"
                  } ${isActive ? "text-teal-600 dark:text-teal-400" : ""}`}
                />

                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}

                {/* Tooltip for Collapsed State */}
                {isCollapsed && (
                  <div className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* --- Footer / Profile --- */}
        <div className="border-t border-gray-100 dark:border-gray-800/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-950 flex items-center justify-center overflow-hidden">
                  {/* Placeholder avatar / replace as needed */}
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Admin`}
                    alt="User"
                    className="w-full h-full"
                  />
                </div>
              </div>
              {!isCollapsed && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">ADMIN</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
