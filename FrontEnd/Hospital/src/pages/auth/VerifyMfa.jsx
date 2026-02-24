import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  RotateCcw, 
  ScanLine,
  Fingerprint,
  Shield,
  HelpCircle
} from 'lucide-react';
import { verifymfaApi } from "../../api/auth.api.js";
import api from '../../api/axios.js';
import { useAuth } from "../../hooks/useAuth";
import { getOrCreateDeviceId } from "../../utils/deviceuuid";

const VerifyMfa = () => {
  // ==========================================
  // LOGIC & STATE (UNCHANGED)
  // ==========================================
  const navigate = useNavigate();
  const { setUser } = useAuth(); 
  
  // Refs for inputs to manage focus
  const inputRefs = useRef([]);

  // State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // default fallback of 300 seconds (5 minutes)
  const DEFAULT_SECONDS = 300;
  const [timer, setTimer] = useState(DEFAULT_SECONDS); 

  // store interval id so we can clear it
  const intervalRef = useRef(null);
  
  useEffect(() => {
    const tempToken = sessionStorage.getItem("mfaTempToken");
    if (!tempToken) {
      // If no MFA session token, send to login immediately
      navigate("/login", { replace: true });
      return;
    }

    // try reading stored expiry
    const rawExpiry = sessionStorage.getItem("mfaExpiry");
    const now = Date.now();

    if (rawExpiry) {
      const expiry = Number(rawExpiry);
      if (Number.isFinite(expiry)) {
        if (expiry <= now) {
          // already expired
          sessionStorage.removeItem("mfaTempToken");
          sessionStorage.removeItem("mfaExpiry");
          setError("Session expired. Please login again.");
          // short delay to show message (keeps UI consistent with other flows)
          setTimeout(() => navigate("/login", { replace: true }), 900);
          return;
        } else {
          // set remaining timer based on expiry
          const remaining = Math.ceil((expiry - now) / 1000);
          setTimer(remaining);
        }
      } else {
        // corrupted expiry — reset it
        const newExpiry = now + DEFAULT_SECONDS * 1000;
        sessionStorage.setItem("mfaExpiry", String(newExpiry));
        setTimer(DEFAULT_SECONDS);
      }
    } else {
      // first time here — set expiry
      const newExpiry = now + DEFAULT_SECONDS * 1000;
      sessionStorage.setItem("mfaExpiry", String(newExpiry));
      setTimer(DEFAULT_SECONDS);
    } 
  }, [navigate]);

  // Countdown Timer Logic (reads expiry each tick)
  useEffect(() => {
    // ensure we don't create multiple intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(() => {
      const rawExpiry = sessionStorage.getItem("mfaExpiry");
      const expiry = rawExpiry ? Number(rawExpiry) : null;
      const now = Date.now();

      if (!expiry || !Number.isFinite(expiry)) {
        // If expiry is missing or corrupted, set fresh expiry only if MFA token exists
        const tempToken = sessionStorage.getItem("mfaTempToken");
        if (!tempToken) {
          // no session => navigate to login
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          navigate("/login", { replace: true });
          return;
        }
        const newExpiry = now + DEFAULT_SECONDS * 1000;
        sessionStorage.setItem("mfaExpiry", String(newExpiry));
        setTimer(DEFAULT_SECONDS);
        return;
      }

      const remaining = Math.max(0, Math.ceil((expiry - now) / 1000));
      setTimer(remaining);

      if (remaining <= 0) {
        // timer expired — clean up session and redirect to login
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        sessionStorage.removeItem("mfaTempToken");
        sessionStorage.removeItem("mfaExpiry");
        setError("Session expired. Please login again.");
        setTimeout(() => navigate("/login", { replace: true }), 900);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [navigate]);

  // clear interval on success to stop the timer
  useEffect(() => {
    if (success && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [success]);

  // Format time mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle Input Change
  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(''); // Clear error on typing

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace and Navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.every(char => !isNaN(char))) {
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      // Focus the last filled input or the first empty one
      const nextFocus = Math.min(pastedData.length, 5);
      inputRefs.current[nextFocus]?.focus();
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    const code = otp.join("");
    const tempToken = sessionStorage.getItem("mfaTempToken");
    const deviceId = getOrCreateDeviceId();

    if (!tempToken) {
        setError("Session expired. Please login again.");
        // remove any stale expiry too
        sessionStorage.removeItem("mfaExpiry");
        setTimeout(() => navigate("/login"), 1000);
        return;
    }

    if (code.length !== 6) {
        setError("Please enter a complete 6-digit code.");
        return;
    }

    setLoading(true);
    setError("");

    try {
        await verifymfaApi(
        { tempToken, code },
        {
            headers: {
            "x-device-id": deviceId,
            },
        }
        );

        // clear temp token and expiry after successful verification
        sessionStorage.removeItem("mfaTempToken");
        sessionStorage.removeItem("mfaExpiry");

        const { data: userData } = await api.get("/api/auth/me");

        setSuccess(true);
        setUser(userData);

        setTimeout(() => {
        switch (userData.role) {
            case "ADMIN":
            navigate("/admin/dashboard");
            break;
            case "DOCTOR":
            navigate("/doctor/dashboard");
            break;
            case "PATIENT":
            navigate("/patient/dashboard");
            break;
            default:
            navigate("/");
        }
        }, 1200);

    } catch (err) {
        const message =
        err?.response?.data?.message ||
        "Verification failed. Please try again.";

        if (
        message.includes("MFA session expired") ||
        message.includes("Invalid MFA session")
        ) {
        setError("Session expired. Please login again.");
        sessionStorage.removeItem("mfaTempToken");
        sessionStorage.removeItem("mfaExpiry");
        setTimeout(() => navigate("/login"), 1500);
        return;
        }

        if (
        message.includes("MFA temporarily locked") ||
        message.includes("Too many failed attempts")
        ) {
        setError(message);
        return;
        }

        if (message.includes("Invalid MFA code")) {
        setError("Incorrect code. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
        }

        setError(message);

    } finally {
        setLoading(false);
    }
  };

  // ==========================================
  // ANIMATION VARIANTS
  // ==========================================
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-500 relative overflow-hidden font-sans selection:bg-violet-500/30">
      
      {/* -------------------------------------------
        BACKGROUND ATMOSPHERE
        -------------------------------------------
      */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Grain Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-grid-slate-200/[0.2] dark:bg-grid-slate-700/[0.1] bg-[size:30px_30px]" />

        {/* Floating Orbs (Violet/Blue for "Secure Entry" theme) */}
        <motion.div 
           animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-violet-500/10 dark:bg-violet-900/20 rounded-full blur-[100px]" 
        />
        <motion.div 
           animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
           transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
           className="absolute bottom-[-20%] right-[10%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-900/20 rounded-full blur-[100px]" 
        />
      </div>

      {/* -------------------------------------------
        MAIN CARD
        -------------------------------------------
      */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden relative group">
          
          {/* Scanning Line Animation */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-500 animate-[scan_3s_ease-in-out_infinite]" />

          <div className="p-8 pb-6 relative">
            
            {/* Header Section */}
            <div className="text-center mb-8 relative">
              <div className="relative inline-block mb-4">
                 <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-inner border transition-colors duration-500
                        ${success 
                            ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-500" 
                            : error
                            ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-500"
                            : "bg-gradient-to-br from-violet-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border-white dark:border-slate-700 text-violet-600 dark:text-violet-400"
                        }`}
                 >
                    <AnimatePresence mode="wait">
                        {success ? (
                             <motion.div key="success" initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}>
                                <ShieldCheck size={40} strokeWidth={1.5} />
                             </motion.div>
                        ) : error ? (
                             <motion.div key="error" initial={{rotate:0}} animate={{rotate: [0, -10, 10, 0]}} exit={{scale:0}}>
                                <AlertCircle size={40} strokeWidth={1.5} />
                             </motion.div>
                        ) : (
                             <motion.div key="lock" initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}>
                                <Fingerprint size={40} strokeWidth={1.5} />
                             </motion.div>
                        )}
                    </AnimatePresence>
                 </motion.div>

                 {/* Status Indicator Pulse */}
                 {!success && !error && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-violet-100 dark:bg-violet-900/50 rounded-full border border-violet-200 dark:border-violet-800">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wide">Awaiting</span>
                        </div>
                    </div>
                 )}
              </div>

              <motion.h2 variants={itemVariants} className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-4 tracking-tight">
                Identity Verification
              </motion.h2>
              <motion.p variants={itemVariants} className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-[280px] mx-auto leading-relaxed">
                Enter the 6-digit security code generated by your authenticator app.
              </motion.p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex justify-center gap-2 sm:gap-3 px-2">
                {otp.map((digit, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    animate={error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <input
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={loading || success}
                      className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-300 shadow-sm
                        ${success 
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 scale-105" 
                            : error 
                            ? "border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-900/10 text-red-500" 
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:focus:border-violet-500"
                        }
                      `}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Dynamic Action Button */}
              <motion.button
                variants={itemVariants}
                whileHover={!loading && !success ? { scale: 1.02 } : {}}
                whileTap={!loading && !success ? { scale: 0.98 } : {}}
                disabled={loading || success}
                type="submit"
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center transition-all duration-500 relative overflow-hidden
                  ${success 
                    ? 'bg-green-500 shadow-green-500/30' 
                    : 'bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 shadow-slate-900/20 dark:shadow-white/10'
                  }
                  disabled:opacity-80 disabled:cursor-not-allowed
                `}
              >
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2"
                        >
                            <Loader2 className="animate-spin" size={20} />
                            <span>Verifying...</span>
                        </motion.div>
                    ) : success ? (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2"
                        >
                            <ShieldCheck size={20} />
                            <span>Access Granted</span>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-2"
                        >
                            <ScanLine size={18} />
                            <span>Verify Identity</span>
                            <ArrowRight size={18} className="opacity-70" />
                        </motion.div>
                    )}
                </AnimatePresence>
              </motion.button>
            </form>

            {/* Error Message Area (Absolute positioning to prevent layout shift) */}
            <div className="absolute bottom-20 left-0 w-full flex justify-center pointer-events-none">
                 <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
                        >
                            <AlertCircle size={14} />
                            {error}
                        </motion.div>
                    )}
                 </AnimatePresence>
            </div>
          </div>

          {/* Footer Section */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
                
                {/* Timer */}
                <div className="flex items-center gap-2">
                   <div className="relative w-8 h-8 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="14" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="3" fill="none" />
                            <motion.circle 
                                cx="16" cy="16" r="14" 
                                className={`stroke-current ${timer < 60 ? 'text-red-500' : 'text-violet-500'}`} 
                                strokeWidth="3" fill="none" strokeDasharray="88" 
                                strokeDashoffset={88 - (88 * timer) / DEFAULT_SECONDS} 
                                strokeLinecap="round"
                                transition={{ duration: 1, ease: "linear" }}
                            />
                        </svg>
                        <span className="absolute text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                            {timer > 0 ? Math.ceil(timer/60) : 0}m
                        </span>
                   </div>
                   <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session</span>
                       <span className={`text-xs font-mono font-bold ${timer < 60 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                           {formatTime(timer)}
                       </span>
                   </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                    <button
                        type="button"
                        onClick={() => navigate('/reset-mfa')}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                        title="Lost Access?"
                    >
                        <HelpCircle size={18} />
                    </button>
                </div>
            </div>
          </div>

        </div>
        
        {/* Footer Brand/Security Badge */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex justify-center"
        >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-full backdrop-blur-sm border border-black/5 dark:border-white/5">
                <Shield size={12} className="text-slate-400" />
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    End-to-End Encrypted
                </span>
            </div>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default VerifyMfa;
