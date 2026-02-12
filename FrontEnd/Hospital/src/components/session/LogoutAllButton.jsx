import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import {logoutAllSessionsApi} from "../../api/session.api";
import { useNavigate } from "react-router-dom";

export default function LogoutAllButton() {
  const [isPending, setIsPending] = useState(false);
  const navigate=useNavigate();

  const handleLogoutAll = async () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to log out from all other devices? You will need to log back in everywhere."
    );

    if (!confirmLogout) return;

    setIsPending(true);
    try {
      await logoutAllSessionsApi();
      setIsPending(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="text-red-500 shrink-0" size={20} />
        <div>
          <h4 className="text-sm font-semibold text-red-500">Danger Zone</h4>
          <p className="text-xs text-gray-400 mt-1">
            This will immediately revoke access to your account from all currently logged-in browsers and devices.
          </p>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={isPending}
        onClick={handleLogoutAll}
        className={`relative flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-red-900/20 
          ${isPending 
            ? "bg-red-800 cursor-not-allowed" 
            : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
          }`}
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Logging out...
          </>
        ) : (
          <>
            Logout from all devices
          </>
        )}
      </motion.button>
    </div>
  );
}