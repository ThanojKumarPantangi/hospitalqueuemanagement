import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, ArrowRight, Loader, AlertCircle, RotateCcw } from 'lucide-react';
import {verifymfaApi} from "../../api/auth.api.js"
import api from '../../api/axios.js';
import { useAuth } from "../../hooks/useAuth";
import {getOrCreateDeviceId} from "../../utils/deviceuuid"

const VerifyMfa = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth(); 
  
  // Refs for inputs to manage focus
  const inputRefs = useRef([]);

  // State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(300); 


    useEffect(() => {
        const tempToken = sessionStorage.getItem("mfaTempToken");

        if (!tempToken) {
            navigate("/login", { replace: true });
        }
    }, [navigate]);


  // Countdown Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle Backspace and Navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous if current is empty
      inputRefs.current[index - 1].focus();
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
      inputRefs.current[nextFocus].focus();
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

            // clear temp token after successful verification
            sessionStorage.removeItem("mfaTempToken");

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
                default:
                navigate("/");
            }
            }, 1000);

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

  // Variants for Animations
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const shakeVariant = {
    shake: { x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          animate={error ? "shake" : ""}
          variants={shakeVariant}
          className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-2xl rounded-3xl p-8 overflow-hidden"
        >
          {/* Header Section */}
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400 shadow-inner"
            >
              {success ? <ShieldCheck size={32} /> : <Lock size={32} />}
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Two-Factor Authentication
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the 6-digit code from your authenticator app to verify your identity.
            </p>
          </div>

          {/* Input Section */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={loading || success}
                  className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border bg-white/50 dark:bg-gray-800/50 outline-none transition-all duration-200
                    ${error 
                      ? 'border-red-500 text-red-500 focus:ring-red-500/30' 
                      : 'border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-500/10'
                    }
                  `}
                  whileFocus={{ scale: 1.05, y: -2 }}
                />
              ))}
            </div>

            {/* Error Message */}
            <div className="h-6 flex items-center justify-center">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full"
                  >
                    <AlertCircle size={14} className="mr-1.5" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={!loading && !success ? { scale: 1.02 } : {}}
              whileTap={!loading && !success ? { scale: 0.98 } : {}}
              disabled={loading || success}
              type="submit"
              className={`w-full py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-500/20 flex items-center justify-center transition-all duration-300
                ${success 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
                }
                disabled:opacity-70 disabled:cursor-not-allowed
              `}
            >
              {loading ? (
                <Loader className="animate-spin" size={20} />
              ) : success ? (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center"
                >
                  <ShieldCheck className="mr-2" size={20} /> Verified
                </motion.div>
              ) : (
                <span className="flex items-center">
                  Verify Identity <ArrowRight className="ml-2" size={18} />
                </span>
              )}
            </motion.button>
          </form>

          {/* Footer / Resend */}
          <div className="mt-8 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 px-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${timer < 60 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span>Expires in {formatTime(timer)}</span>
            </div>
            
            <button 
              type="button"
              className="flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium group"
              onClick={() => {
                 setTimer(300); 
                 setError(''); 
                 /* Add Resend Logic Here */ 
              }}
            >
              <RotateCcw size={14} className="mr-1 group-hover:-rotate-180 transition-transform duration-500" />
              Resend Code
            </button>
          </div>

        </motion.div>

        {/* Decorative Bottom Text */}
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.5 }}
          className="text-center mt-6 text-xs text-gray-400 dark:text-gray-500 font-medium"
        >
          <Lock size={10} className="inline mb-0.5 mr-1" />
          Secured by End-to-End Encryption
        </motion.p>
      </motion.div>
    </div>
  );
};

export default VerifyMfa;