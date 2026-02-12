import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Copy, CheckCircle, AlertCircle, Loader2, Smartphone, ArrowRight } from 'lucide-react';
import {setupmfa,confirmmfa} from "../../api/auth.api";
import {getOrCreateDeviceId} from "../../utils/deviceuuid"

const SetupMfa = () => {
  const navigate = useNavigate();
  
  const inputRefs = useRef([]);

  // State Management
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false); 
  const [qrData, setQrData] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); 
  const [copied, setCopied] = useState(false);


    useEffect(() => {
        const tempToken = sessionStorage.getItem("mfaTempToken");

        if (!tempToken) {
            navigate("/login", { replace: true });
            return;
        }

        const initMfaSetup = async () => {
            try {
            const deviceId = getOrCreateDeviceId();

            const { data } = await setupmfa(
                { tempToken },
                {
                headers: {
                    "x-device-id": deviceId,
                },
                }
            );

            setQrData(data.qrCode);
            setManualCode(data.manualCode);
            setLoading(false);

            } catch (err) {
            const message =
                err?.response?.data?.message ||
                "Session invalid or expired.";

            if (message === "MFA setup already initiated.") {
                setError("MFA setup already started. Please enter your 6-digit code.");
                setLoading(false);
                return;
            }
            if (
                message === "Invalid MFA session" ||
                message === "MFA session expired"
            ) {
                navigate("/login", { replace: true });
                return;
            }

            setError(message);
            setLoading(false);
            }
        };

        initMfaSetup();
    }, [navigate]);


  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

 
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');


    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.every((char) => !isNaN(char))) {
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex].focus();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(manualCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

    //  Verification Logic
    const handleVerify = async (e) => {
        if (e) e.preventDefault();

        if (verifying) return;

        const code = otp.join("");
        const tempToken = sessionStorage.getItem("mfaTempToken");
        const deviceId = getOrCreateDeviceId();

        console.log(tempToken, code, deviceId);

        if (!tempToken) {
            navigate("/login", { replace: true });
            return;
        }

        if (code.length !== 6) {
            setError("Please enter the full 6-digit code.");
            return;
        }

        setVerifying(true);
        setError("");

        try {
            await confirmmfa(
            { tempToken, code },
            {
                headers: {
                "x-device-id": deviceId,
                },
            }
            );

            // Clear temp token after success
            sessionStorage.removeItem("mfaTempToken");

            setSuccess(true);

            setTimeout(() => {
            navigate("/login");
            }, 1200);

        } catch (err) {
            const message =
            err?.response?.data?.message ||
            "Verification failed. Invalid code.";

            setError(message);

            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();

        } finally {
            setVerifying(false);
        }
    };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const shakeVariants = {
    shake: { x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-[80px]" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-lg"
      >
        <motion.div
          animate={error ? "shake" : ""}
          variants={shakeVariants}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-slate-700 shadow-2xl rounded-3xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm"
            >
              <ShieldCheck className="text-white" size={28} />
            </motion.div>
            <h1 className="text-xl font-bold text-white">Set Up Two-Factor Authentication</h1>
            <p className="text-blue-100 text-sm mt-1">Secure your medical account</p>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={40} />
                <p className="text-sm text-slate-500 dark:text-slate-400">Generating secure key...</p>
              </div>
            ) : success ? (
              // Success State
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="text-green-600 dark:text-green-400" size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Setup Complete!</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Redirecting to dashboard...</p>
              </motion.div>
            ) : (
              // Main Setup Form
              <div className="space-y-6">
                
                {/* QR Section */}
                <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  {qrData && (
                    <div className="bg-white p-2 rounded-xl shadow-sm mb-4">
                      <img src={qrData} alt="MFA QR Code" className="w-40 h-40 object-contain" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                    <Smartphone size={16} />
                    <span>Scan with Authenticator App</span>
                  </div>

                  {/* Manual Code */}
                  <div className="w-full flex items-center gap-2">
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-center font-mono text-sm tracking-widest text-slate-700 dark:text-slate-300 select-all">
                      {manualCode}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
                      title="Copy Code"
                    >
                      {copied ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800" />

                {/* OTP Input Section */}
                <form onSubmit={handleVerify} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 text-center">
                      Enter the 6-digit verification code
                    </label>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {otp.map((digit, index) => (
                        <motion.input
                          key={index}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          disabled={verifying}
                          className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg border bg-white dark:bg-slate-900 outline-none transition-all duration-200
                            ${error 
                              ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/10' 
                              : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                            }
                          `}
                          whileFocus={{ scale: 1.05, y: -2 }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Error Message */}
                  <div className="h-6 flex items-center justify-center">
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center text-red-500 text-xs font-semibold bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full"
                        >
                          <AlertCircle size={12} className="mr-1.5" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={!verifying ? { scale: 1.02 } : {}}
                    whileTap={!verifying ? { scale: 0.98 } : {}}
                    disabled={verifying}
                    type="submit"
                    className="w-full py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                  >
                    {verifying ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        Verify & Enable MFA <ArrowRight className="ml-2" size={18} />
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            )}
          </div>

          {/* Footer Timer */}
          {!success && !loading && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 text-center border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Session expires in <span className={timeLeft < 60 ? 'text-red-500 font-bold' : 'text-slate-700 dark:text-slate-300'}>{formatTime(timeLeft)}</span>
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SetupMfa;