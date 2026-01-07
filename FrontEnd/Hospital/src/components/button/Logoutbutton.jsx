import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";


const Logout = ({
  brandName = "NEURAL",
  brandAccent = "CARE",
  duration = 3000,
  onCancel = () => console.log(),
}) => {
  const [progress, setProgress] = useState(0);
  const { user,logout } = useAuth();
  const cancelledRef = useRef(false);
  const completedRef = useRef(false);
  const { disconnectSocket } = useSocket();

  const navigate = useNavigate();

  useEffect(() => {
    const intervalTime = 50; // Update every 50ms
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        // ❌ stop if cancelled BEFORE completion
        if (cancelledRef.current) {
          clearInterval(timer);
          return oldProgress;
        }

        // ✅ logout completes ONLY ONCE
        if (oldProgress >= 100 && !completedRef.current) {
          completedRef.current = true;
          clearInterval(timer);

          // 🔐 remove token ONLY when logout is confirmed
          logout();
          

          // ➡️ redirect automatically after short delay
          setTimeout(() => {
             navigate("/login");
          }, 500);

          return 100;
        }

        // clamp progress safely
        return Math.min(oldProgress + step, 100);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, navigate,logout,disconnectSocket]);

  const handleCancel = () => {
  if (completedRef.current) return;

  cancelledRef.current = true;
  onCancel();

  if (user?.role === "ADMIN") navigate("/admin/dashboard");
  else if (user?.role === "DOCTOR") navigate("/doctor/dashboard");
  else navigate("/patient/dashboard");
};


  /* ---------------- UI BELOW IS UNCHANGED ---------------- */

  return (
    <div className="relative min-h-screen w-full bg-[#050a15] flex items-center justify-center font-sans overflow-hidden p-6">
      {/* Scoped Animations */}
      <style>{`
        @keyframes logout-progress {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .animate-logout-glow {
          box-shadow: 0 0 20px rgba(244, 63, 94, 0.4);
        }
      `}</style>

      {/* Ambient Background Light */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Logout Card */}
      <div className="relative w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center z-10">
        {/* Animated Logout Icon */}
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping"></div>
          <div
            className="absolute inset-0 border-2 border-rose-500/30 rounded-full border-t-rose-500 animate-spin"
            style={{ animationDuration: "2s" }}
          ></div>
          <div className="relative w-full h-full flex items-center justify-center bg-rose-500/10 rounded-full border border-rose-500/50 shadow-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-rose-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight">
            {brandName}
            <span className="text-rose-500">{brandAccent}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-3 font-medium px-4 leading-relaxed">
            Terminating secure session and protecting patient data...
          </p>
        </div>

        {/* Security Checklist */}
        <div className="w-full space-y-4 bg-black/30 p-6 rounded-3xl border border-white/5 mb-8">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em]">
            <span className="text-slate-500">Database Sync</span>
            <span className={progress > 30 ? "text-emerald-500" : "text-slate-600"}>
              {progress > 30 ? "Complete" : "Wait..."}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em]">
            <span className="text-slate-500">Encryption Lock</span>
            <span className={progress > 60 ? "text-emerald-500" : "text-slate-600"}>
              {progress > 60 ? "Active" : "Wait..."}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em]">
            <span className="text-slate-500">Auth Token</span>
            <span
              className={
                progress > 90
                  ? "text-emerald-500"
                  : "text-rose-500 animate-pulse"
              }
            >
              {progress > 90 ? "Revoked" : "Revoking..."}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Progress
            </span>
            <span className="text-xs text-rose-500 font-mono">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-rose-500 to-rose-400 rounded-full transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Cancel Logout */}
        <button
          onClick={handleCancel}
          className="mt-10 px-6 py-2 rounded-full text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] hover:text-white hover:bg-white/5 transition-all duration-300"
        >
          Stay Logged In
        </button>
      </div>
    </div>
  );
};

export default Logout;
