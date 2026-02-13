
import React, { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

import {
  ShieldAlert,
  User,
  Mail,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Search,
  RotateCcw,
  Loader2,
  X
} from "lucide-react";

import {
  resetMfaApi,
} from "../../api/auth.api.js";

import {
  getUserByIdentifierApi,
} from "../../api/admin.api.js";

const AdminResetMfa = () => {
  const [identifier, setIdentifier] = useState("");
  const [inputType, setInputType] = useState("neutral"); // 'neutral', 'email', 'phone'
  
  const [loading, setLoading] = useState(false); // Search loading
  const [resetLoading, setResetLoading] = useState(false); // Action loading
  
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Regex Patterns
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[0-9\s\-()]{7,}$/;

  // Handle Smart Input Detection
  const handleIdentifierChange = (e) => {
    const val = e.target.value;
    setIdentifier(val);
    
    // Auto-detect type for icon animation
    if (emailRegex.test(val)) {
      setInputType("email");
    } else if (phoneRegex.test(val)) {
      setInputType("phone");
    } else {
      setInputType("neutral");
    }
  };

  /* Fetch User */
  const handleSearchUser = async (e) => {
    e.preventDefault();

    if (!identifier.trim()) {
      setError("Email or phone is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setUser(null);

      const { data } = await getUserByIdentifierApi(identifier);
      setUser(data.user);
    } catch (err) {
      setError(
        err?.response?.data?.message || "User not found."
      );
      setInputType("neutral");
    } finally {
      setLoading(false);
    }
  };

  /* Reset MFA */
  const handleResetMfa = async () => {
    if (!user?._id) return;

    try {
      setResetLoading(true);
      setError("");
      
      await resetMfaApi(user._id);

      setSuccess(`MFA reset successful for ${user.name}.`);
      
      // Optional: Clear user after success to force fresh search
      setTimeout(() => {
        setUser(null);
        setIdentifier("");
        setInputType("neutral");
        setSuccess("");
      }, 3000);

    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to reset MFA."
      );
    } finally {
      setResetLoading(false);
    }
  };

  const clearSearch = () => {
    setUser(null);
    setIdentifier("");
    setInputType("neutral");
    setError("");
    setSuccess("");
  };

  const iconVariants = {
    initial: { scale: 0.5, opacity: 0, rotate: -20 },
    animate: { scale: 1, opacity: 1, rotate: 0 },
    exit: { scale: 0.5, opacity: 0, rotate: 20 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 overflow-hidden relative transition-colors duration-500">

      {/* Ambient Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-red-500/10 dark:bg-red-900/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-500/10 dark:bg-orange-900/10 rounded-full blur-[120px] animate-pulse delay-700" />

      {/* Floating Security Particles (NEW – purely decorative) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: [0.08, 0.35, 0.08],
              y: [0, -40, 0],
            }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeInOut",
            }}
            className="absolute w-2 h-2 rounded-full bg-red-400/20 blur-sm"
            style={{
              left: `${8 + i * 11}%`,
              top: `${18 + (i % 3) * 20}%`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        {/* Added hover glow to this wrapper - purely visual */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/50 dark:border-slate-800 rounded-3xl shadow-2xl p-8 overflow-hidden transition-all duration-500 hover:shadow-red-500/10 hover:shadow-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{
                rotate: loading || resetLoading ? 360 : 0,
                // breathing effect when idle (only subtle when not loading)
                scale: resetLoading || loading ? 1 : [1, 1.04, 1],
              }}
              transition={{
                rotate: {
                  duration: 2,
                  repeat: (loading || resetLoading) ? Infinity : 0,
                  ease: "linear",
                },
                scale: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              }}
              className="w-20 h-20 bg-gradient-to-tr from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 text-red-500 border border-red-100 dark:border-red-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner"
            >
              <ShieldAlert size={40} />
            </motion.div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Admin MFA Reset
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Locate a user account to invalidate active sessions.
            </p>

            {/* Security System Active Badge (NEW) */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                Security System Active
              </span>
            </motion.div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchUser} className="space-y-4 relative z-20">
            <div className="relative group">
              {/* Animated Smart Icon */}
              <div className="absolute left-4 top-3.5 text-slate-400 transition-colors group-focus-within:text-red-500">
                <AnimatePresence mode="wait">
                    {inputType === "email" && (
                      <motion.div key="mail" {...iconVariants} transition={{duration: 0.2}}> <Mail size={20} /> </motion.div>
                    )}
                    {inputType === "phone" && (
                      <motion.div key="phone" {...iconVariants} transition={{duration: 0.2}}> <Smartphone size={20} /> </motion.div>
                    )}
                    {inputType === "neutral" && (
                      <motion.div key="neutral" {...iconVariants} transition={{duration: 0.2}}> <Search size={20} /> </motion.div>
                    )}
                </AnimatePresence>
              </div>

              <input
                value={identifier}
                onChange={handleIdentifierChange}
                disabled={!!user} // Disable input if user is already found
                placeholder="Search by email or phone..."
                className={`w-full pl-12 pr-10 py-3.5 rounded-xl border-2 outline-none transition-all duration-300
                  ${user 
                    ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500" 
                    : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  } text-slate-800 dark:text-slate-100`}
              />

              {/* Clear Button (only if user is found) */}
              {user && (
                <button 
                  type="button" 
                  onClick={clearSearch}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              )}

              {/* Micro security scan animation under input while searching (NEW) */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    key="scanbar"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 6 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute left-0 right-0 bottom-[-10px] h-1 overflow-hidden"
                  >
                    {/* sliding gradient */}
                    <div className="relative w-full h-full bg-slate-100/0 dark:bg-slate-900/0">
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: ["-100%", "120%"] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                        className="absolute top-0 left-0 h-full w-2/5 bg-gradient-to-r from-transparent via-red-400/40 to-transparent"
                      />
                      {/* little scanning dots */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 1.2, delay: 0.1 }}
                        className="absolute right-3 top-[-8px] text-xs text-slate-400"
                      >
                        Scanning...
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* Only show Search Button if no user is found yet */}
            <AnimatePresence>
              {!user && (
                <motion.button
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading || !identifier}
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                       <Loader2 size={18} className="animate-spin"/> Searching...
                    </span>
                  ) : "Find User"}
                </motion.button>
              )}
            </AnimatePresence>
          </form>

          {/* Animated Divider (NEW) */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6 }}
            className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent mt-6"
          />

          {/* USER PREVIEW CARD (Blurred/Hidden logic) */}
          <AnimatePresence mode="wait">
            {user && (
              <motion.div
                key="user-card"
                initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="mt-6"
              >
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 relative overflow-hidden">
                  
                  {/* Decorative stripe */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-500" />

                  {/* Subtle scanning overlay on card while search had been happening (now complete) */}
                  {/* If you'd like it during the found state, we can show a quick sweep */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 pointer-events-none"
                  >
                    {/* tiny slow ambient scan lines (visual depth) */}
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: ["-100%", "120%"] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/2 to-transparent opacity-5 dark:opacity-3"
                    />
                  </motion.div>

                  <div className="flex items-start justify-between mb-4 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">
                          {user.name}
                        </h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mt-1">
                          {user.role || "User"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pl-2 mb-6">
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <Mail size={16} className="text-slate-400" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <Smartphone size={16} className="text-slate-400" />
                        {user.phone}
                      </div>
                    )}
                  </div>

                  {/* Reset Action */}
                  <div className="space-y-3">
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex gap-2 items-start">
                       <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                       <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                         Action is irreversible. User will be logged out of all devices immediately.
                       </p>
                    </div>

                    <motion.button
                      whileHover={!resetLoading ? { scale: 1.02 } : {}}
                      whileTap={!resetLoading ? { scale: 0.98 } : {}}
                      onClick={handleResetMfa}
                      disabled={resetLoading}
                      className="w-full py-3 rounded-xl font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 shadow-lg"
                    >
                      {resetLoading ? (
                        <span className="flex justify-center items-center gap-2">
                          <RotateCcw size={18} className="animate-spin" />
                          Resetting...
                        </span>
                      ) : (
                        "Confirm MFA Reset"
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="mt-4 space-y-2">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 p-3 rounded-lg flex items-center gap-2"
                >
                  <AlertTriangle size={16} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 text-green-600 p-3 rounded-lg flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default AdminResetMfa;
