import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../components/Navbar/AdminNavbar";
import Sidebar from "../components/Sidebar/AdminSidebar";

const SIDEBAR_EXPANDED = 256; // px (16rem)
const SIDEBAR_COLLAPSED = 80; // px (5rem)

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("admin-sidebar") === "collapsed";
  });

  /* Persist preference */
  useEffect(() => {
    localStorage.setItem(
      "admin-sidebar",
      isCollapsed ? "collapsed" : "expanded"
    );
  }, [isCollapsed]);

  /* Responsive auto-collapse (desktop only) */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsCollapsed(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* CSS variable drives layout */
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--admin-sidebar-width",
      `${isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED}px`
    );
  }, [isCollapsed]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminNavbar />

      {/* Pass controlled collapse state into Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* MAIN CONTENT */}
      <main
        className="
          transition-[padding-left] duration-300 ease-in-out
        "
        style={{
          paddingLeft: "var(--admin-sidebar-width)",
        }}
      >
        <div className="max-w-8xl mx-auto px-2">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
