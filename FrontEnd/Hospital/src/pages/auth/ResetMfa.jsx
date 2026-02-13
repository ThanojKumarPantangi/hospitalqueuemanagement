import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Mail,
  CheckCircle2,
  ShieldAlert,
  KeyRound,
  Lock,
  FileKey2,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

import { recoveryMfaApi } from "../../api/auth.api.js";

const ResetMfa = () => {
  // ==========================================
  // LOGIC & STATE (Unchanged)
  // ==========================================
  const navigate = useNavigate();

  const [loading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setResetMessage] = useState("");
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("mfaEmail");

    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleResetMfa = async (e) => {
    e.preventDefault();

    if (loading || successMessage) return;

    if (!recoveryCode.trim()) {
      setError("Recovery code is required");
      return;
    }

    try {
      setResetLoading(true);
      setError("");
      setResetMessage("");

      await recoveryMfaApi({
        email,
        recoveryCode,
      });

      sessionStorage.removeItem("mfaTempToken");

      setResetMessage("Recovery verified. Redirecting to MFA setup...");

      setTimeout(() => {
        navigate("/setup-mfa");
      }, 1500);

    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Invalid recovery code or request failed."
      );
    } finally {
      setResetLoading(false);
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
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.4 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden font-sans selection:bg-orange-500/30 transition-colors duration-500">

      {/* -------------------------------------------
        BACKGROUND ATMOSPHERE
        -------------------------------------------
      */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Grain & Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-grid-slate-200/[0.2] dark:bg-grid-slate-700/[0.1] bg-[size:30px_30px]" />

        {/* Floating Orbs (Orange/Red for "Emergency/Warning" theme) */}
        <motion.div 
           animate={{ x: [0, 40, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
           transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
           className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-orange-400/20 dark:bg-orange-900/20 rounded-full blur-[100px]" 
        />
        <motion.div 
           animate={{ x: [0, -30, 0], y: [0, 30, 0], scale: [1, 1.2, 1] }}
           transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
           className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-400/20 dark:bg-red-900/20 rounded-full blur-[100px]" 
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
        exit="exit"
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden relative">
          
          {/* Top Hazard Stripe */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 animate-gradient-x" />

          <div className="p-8">

            {/* HEADER SECTION 
            */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                 {/* Icon Container */}
                 <motion.div
                  animate={{ 
                    rotateY: loading ? 180 : 0,
                    scale: successMessage ? 1.1 : 1
                  }}
                  transition={{ duration: 0.6 }}
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-inner border
                    ${successMessage
                      ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/40 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
                      : "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/40 dark:to-red-900/40 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-500"
                    }`}
                >
                  {successMessage ? (
                     <ShieldCheck size={36} strokeWidth={1.5} />
                  ) : loading ? (
                     <RefreshCw size={36} className="animate-spin" />
                  ) : (
                     <ShieldAlert size={36} strokeWidth={1.5} />
                  )}
                </motion.div>

                {/* Status Indicator Dot */}
                <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-slate-900 rounded-full">
                   <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                </div>
              </div>

              <motion.h2 
                variants={itemVariants}
                className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight"
              >
                Emergency Recovery
              </motion.h2>

              <motion.p 
                variants={itemVariants}
                className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed"
              >
                Lost your device? Use a recovery code to verify your identity and reset MFA.
              </motion.p>
            </div>

            {/* SECURITY NOTICE
            */}
            <motion.div 
                variants={itemVariants}
                className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4 mb-8 flex items-start gap-3 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10">
                 <AlertTriangle size={60} />
              </div>
              
              <div className="bg-orange-100 dark:bg-orange-900/50 p-1.5 rounded-lg shrink-0 z-10">
                 <AlertTriangle size={18} className="text-orange-600 dark:text-orange-400" />
              </div>
              
              <div className="z-10">
                 <h4 className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wide mb-1">
                    One-Time Protocol
                 </h4>
                 <p className="text-xs text-orange-700/80 dark:text-orange-300/80 leading-relaxed">
                   Codes are single-use only. Upon verification, your old MFA settings will be wiped and you must re-enroll immediately.
                 </p>
              </div>
            </motion.div>

            {/* FORM SECTION
            */}
            <form onSubmit={handleResetMfa} className="space-y-6">

              {/* READ ONLY EMAIL FIELD */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                    Target Account
                </label>
                <div className="relative group opacity-80 hover:opacity-100 transition-opacity">
                   <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700" />
                   <div className="relative flex items-center px-4 py-3.5 gap-3">
                      <div className="p-1.5 bg-white dark:bg-slate-700 rounded-lg text-slate-400 shadow-sm">
                         <Lock size={16} />
                      </div>
                      <div className="flex-1 overflow-hidden">
                         <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                            {email}
                         </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 font-bold">
                        LOCKED
                      </span>
                   </div>
                </div>
              </motion.div>

              {/* RECOVERY CODE INPUT */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                    Authorization Code
                </label>
                <div className={`relative transition-all duration-300 ${isInputFocused ? 'scale-[1.02]' : 'scale-100'}`}>
                  <KeyRound 
                    size={20} 
                    className={`absolute left-4 top-3.5 transition-colors duration-300 ${
                        isInputFocused ? 'text-orange-500' : 'text-slate-400'
                    }`} 
                  />
                  <input
                    type="text"
                    value={recoveryCode}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    disabled={loading || !!successMessage}
                    placeholder="Enter 8-digit backup code"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-slate-950 border-2 outline-none font-mono tracking-widest text-lg transition-all duration-300
                      ${isInputFocused 
                        ? "border-orange-500 ring-4 ring-orange-500/10" 
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      } text-slate-800 dark:text-slate-100 placeholder:text-slate-300 placeholder:font-sans placeholder:tracking-normal placeholder:text-sm`}
                  />
                </div>
              </motion.div>

              {/* STATUS MESSAGES */}
              <div className="min-h-[24px]">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      key="err"
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl flex items-center gap-3"
                    >
                      <AlertTriangle size={16} className="shrink-0" />
                      <span className="font-medium">{error}</span>
                    </motion.div>
                  )}
                  {successMessage && (
                    <motion.div
                      key="succ"
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-xl flex items-center gap-3"
                    >
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span className="font-medium">{successMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* BUTTONS */}
              <div className="pt-2 space-y-3">
                <motion.button
                  variants={itemVariants}
                  whileHover={!loading && !successMessage ? { scale: 1.02 } : {}}
                  whileTap={!loading && !successMessage ? { scale: 0.98 } : {}}
                  disabled={loading || !!successMessage}
                  type="submit"
                  className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative flex items-center justify-center gap-2">
                        {loading ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" />
                                <span>Verifying Token...</span>
                            </>
                        ) : successMessage ? (
                            <>
                                <CheckCircle2 size={18} />
                                <span>Access Granted</span>
                            </>
                        ) : (
                            <>
                                <FileKey2 size={18} />
                                <span>Recover Access</span>
                            </>
                        )}
                    </span>
                </motion.button>

                <motion.button
                  variants={itemVariants}
                  type="button"
                  onClick={() => navigate("/login")}
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Return to Login</span>
                </motion.button>
              </div>

            </form>

          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetMfa;