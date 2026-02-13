import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  QrCode,
  Scan,
  Key,
  Unlock,
  Check,
  Download,
  FileText,
  AlertTriangle,
  X
} from 'lucide-react';
import { setupmfa, confirmmfa, recoveryprevewApi } from "../../api/auth.api";
import { getOrCreateDeviceId } from "../../utils/deviceuuid";

const SetupMfa = () => {
  // ==========================================
  // STATE & LOGIC
  // ==========================================
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  // Existing MFA State
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false); 
  const [qrData, setQrData] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); 
  const [copied, setCopied] = useState(false);

  // Recovery Preview State
  const [recoveryPreviewToken, setRecoveryPreviewToken] = useState(null);
  const [previewCodes, setPreviewCodes] = useState([]); 
  const [showRecoveryStep, setShowRecoveryStep] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewTimer, setPreviewTimer] = useState(10); 
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // --- INITIALIZATION ---
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
            { headers: { "x-device-id": deviceId } }
        );
        setQrData(data.qrCode);
        setManualCode(data.manualCode);
        setLoading(false);
        } catch (err) {
        const message = err?.response?.data?.message || "Session invalid or expired.";
        if (message === "MFA setup already initiated.") {
            setError("MFA setup already started. Please enter your 6-digit code.");
            setLoading(false);
            return;
        }
        if (message === "Invalid MFA session" || message === "MFA session expired") {
            navigate("/login", { replace: true });
            return;
        }
        setError(message);
        setLoading(false);
        }
    };
    initMfaSetup();
  }, [navigate]);

  // --- TIMERS ---
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (!showRecoveryStep) return;
    if (previewTimer <= 0) return;
    const t = setInterval(() => setPreviewTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [showRecoveryStep, previewTimer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- INPUT HANDLERS ---
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1].focus();
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
      pastedData.forEach((char, i) => { if (i < 6) newOtp[i] = char; });
      setOtp(newOtp);
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex].focus();
    }
  };

  // --- RECOVERY ACTIONS ---
  const copyToClipboard = () => {
    navigator.clipboard.writeText(manualCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRecoveryCodes = async () => {
    if (!previewCodes || previewCodes.length === 0) return;
    const text = previewCodes.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch (e) { /* ignore */ }
  };

  const downloadRecoveryCodes = () => {
    if (!previewCodes || previewCodes.length === 0) return;
    const blob = new Blob([previewCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const fetchRecoveryPreview = async (token) => {
    if (!token) {
      setPreviewError("Missing preview token");
      return;
    }
    setFetchingPreview(true);
    setPreviewError('');
    try {
      const { data } = await recoveryprevewApi({ token });
      const codes = data?.recoveryCodes || [];
      setPreviewCodes(codes);
      setShowRecoveryStep(true);
      setPreviewTimer(10);
    } catch (err) {
      setPreviewError(err?.response?.data?.message || 'Failed to fetch recovery codes');
      sessionStorage.removeItem('recoveryPreviewToken');
      setTimeout(() => navigate('/login'), 2200);
    } finally {
      setFetchingPreview(false);
    }
  };

  // --- VERIFICATION HANDLER ---
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (verifying) return;

    const code = otp.join("");
    const tempToken = sessionStorage.getItem("mfaTempToken");
    const deviceId = getOrCreateDeviceId();

    if (!tempToken) { navigate("/login", { replace: true }); return; }
    if (code.length !== 6) { setError("Please enter the full 6-digit code."); return; }

    setVerifying(true);
    setError("");

    try {
        const { data } = await confirmmfa(
          { tempToken, code },
          { headers: { "x-device-id": deviceId } }
        );

        sessionStorage.removeItem("mfaTempToken");

        const previewToken = data?.recoveryPreviewToken;
        if (previewToken) {
          sessionStorage.setItem('recoveryPreviewToken', previewToken);
          setRecoveryPreviewToken(previewToken);
        }

        setSuccess(true);

        if (previewToken) {
          setTimeout(() => { fetchRecoveryPreview(previewToken); }, 500); 
        } else {
          setTimeout(() => navigate('/login'), 1200);
        }
    } catch (err) {
        const message = err?.response?.data?.message || "Verification failed. Invalid code.";
        setError(message);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
    } finally {
        setVerifying(false);
    }
  };

  const handleConfirmSaved = () => {
    if (previewTimer > 0) return;
    if (!confirmChecked) return;

    sessionStorage.removeItem('recoveryPreviewToken');
    setRecoveryPreviewToken(null);
    setPreviewCodes([]);
    setShowRecoveryStep(false);
    setConfirmChecked(false);
    navigate('/login');
  };

  const handleForceClosePreview = () => {
    if (previewError) {
      sessionStorage.removeItem('recoveryPreviewToken');
      setShowRecoveryStep(false);
      navigate('/login');
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-500 relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-grid-slate-200/[0.2] dark:bg-grid-slate-700/[0.1] bg-[size:30px_30px]" />
        <motion.div 
           animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[120px]" 
        />
        <motion.div 
           animate={{ x: [0, -30, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
           transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
           className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[120px]" 
        />
      </div>

      {/* Main Setup Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-slate-800 shadow-2xl rounded-3xl overflow-hidden relative">
          
          {/* Progress Bar */}
          {!loading && !success && (
              <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 z-20 transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / 300) * 100}%` }} />
          )}

          {/* Header */}
          <div className="relative pt-8 pb-6 px-8 text-center border-b border-slate-100 dark:border-slate-800">
             <div className="relative inline-block mb-4">
                <motion.div
                    animate={loading ? { rotate: 360 } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner"
                >
                    {success ? <CheckCircle size={32} /> : <ShieldCheck size={32} />}
                </motion.div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${success ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`} />
                </div>
             </div>
             
             <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {success ? "Setup Complete" : "Secure Your Account"}
             </h1>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {success ? "MFA is now active. Preparing recovery codes..." : "Link your authenticator app to enable 2FA."}
             </p>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
                
                {/* 1. Loading */}
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 space-y-4"
                  >
                    <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={48} strokeWidth={1.5} />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
                        Generating secure cryptographic keys...
                    </p>
                  </motion.div>
                )}

                {/* 2. Success (Transition State) */}
                {success && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-8 text-center"
                  >
                    <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6 border border-green-100 dark:border-green-900/50">
                      <Unlock className="text-green-600 dark:text-green-400" size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        You&apos;re All Set!
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">
                        Redirecting to backup your recovery codes. Do not close this window.
                    </p>
                    <div className="w-full max-w-[200px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5 }}
                            className="h-full bg-green-500"
                        />
                    </div>
                  </motion.div>
                )}

                {/* 3. Main Form */}
                {!loading && !success && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {/* QR Code */}
                    <div className="relative group">
                       <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-indigo-300 dark:from-blue-800 dark:to-indigo-800 rounded-2xl opacity-50 blur group-hover:opacity-75 transition duration-500"></div>
                       <div className="relative bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6">
                          
                          <div className="relative shrink-0">
                             {/* Corners */}
                             <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl-lg" />
                             <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr-lg" />
                             <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl-lg" />
                             <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br-lg" />
                             
                             {qrData ? (
                                <div className="p-3 bg-white rounded-lg"> 
                                   <img src={qrData} alt="MFA QR Code" className="w-32 h-32 object-contain" />
                                </div>
                             ) : (
                                <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-lg">
                                    <QrCode className="text-slate-300" />
                                </div>
                             )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-3 text-center md:text-left">
                             <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center md:justify-start gap-2">
                                    <Scan size={16} className="text-blue-500" />
                                    Scan with App
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Use Google Authenticator or Authy to scan the QR code.
                                </p>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Or enter key manually
                                </label>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                                        {manualCode || "LOADING..."}
                                    </code>
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 rounded-lg transition-colors"
                                    >
                                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                    </button>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Then Verify</span>
                        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                    </div>

                    {/* OTP Form */}
                    <form onSubmit={handleVerify} className="space-y-6">
                      <div className="flex justify-center gap-2 sm:gap-3">
                        {otp.map((digit, index) => (
                          <motion.div
                              key={index}
                              animate={error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                              transition={{ duration: 0.4 }}
                          >
                              <input
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                disabled={verifying}
                                placeholder="•"
                                className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-200 shadow-sm
                                  ${error 
                                    ? 'border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-900/10 text-red-500 placeholder:text-red-300' 
                                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                                  }`}
                              />
                          </motion.div>
                        ))}
                      </div>

                      {/* Error Msg */}
                      <div className="h-6 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/30"
                            >
                              <AlertCircle size={12} />
                              {error}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Button */}
                      <motion.button
                        whileHover={!verifying ? { scale: 1.01 } : {}}
                        whileTap={!verifying ? { scale: 0.99 } : {}}
                        disabled={verifying}
                        type="submit"
                        className="w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-500/25 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center transition-all relative overflow-hidden"
                      >
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />
                        <span className="relative z-20 flex items-center gap-2">
                            {verifying ? (
                            <> <Loader2 className="animate-spin" size={20} /> <span>Verifying...</span> </>
                            ) : (
                            <> <Key size={20} /> <span>Activate MFA</span> <ArrowRight size={18} className="opacity-70" /> </>
                            )}
                        </span>
                      </motion.button>
                    </form>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* Footer Timer */}
          {!success && !loading && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 text-center border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                 <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timeLeft < 60 ? 'bg-red-400' : 'bg-green-400'}`}></span>
                 <span className={`relative inline-flex rounded-full h-2 w-2 ${timeLeft < 60 ? 'bg-red-500' : 'bg-green-500'}`}></span>
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-wide">
                Session expires in <span className={`font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>{formatTime(timeLeft)}</span>
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* =======================================================
           RECOVERY PREVIEW MODAL OVERLAY
         ======================================================= */}
      <AnimatePresence>
        {showRecoveryStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={handleForceClosePreview} />

            {/* Modal Card */}
            <motion.div
              initial={{ y: 20, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 pb-0 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center border border-amber-100 dark:border-amber-900/40 shrink-0">
                  <AlertTriangle className="text-amber-500" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Emergency Recovery Codes</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Store these codes safely. They are the <strong>only way</strong> to restore access if you lose your authenticator device.
                  </p>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 overflow-y-auto">
                {fetchingPreview ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3 text-slate-500">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <span className="text-sm">Retrieving secure codes...</span>
                  </div>
                ) : previewError ? (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 flex gap-3">
                     <AlertCircle className="shrink-0" />
                     {previewError}
                     <button onClick={handleForceClosePreview} className="ml-auto underline font-bold">Close</button>
                  </div>
                ) : (
                  <>
                    {/* Codes Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {previewCodes.map((c, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-black/40 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-sm text-slate-600 dark:text-slate-300 text-center select-all tracking-wider">
                          {c}
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={copyRecoveryCodes}
                        className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold group"
                      >
                        {copiedCodes ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="group-hover:text-blue-500" />}
                        {copiedCodes ? 'Copied to Clipboard' : 'Copy All'}
                      </button>

                      <button
                        onClick={downloadRecoveryCodes}
                        className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold group"
                      >
                        <Download size={16} className="group-hover:text-blue-500" />
                        Download .txt
                      </button>
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative flex items-center mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={confirmChecked}
                                    onChange={(e) => setConfirmChecked(e.target.checked)}
                                    disabled={previewTimer > 0}
                                    className="peer w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                                />
                            </div>
                            <div className="flex-1">
                                <span className={`text-sm font-semibold block transition-colors ${confirmChecked ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                    I have securely saved these codes
                                </span>
                                <span className="text-xs text-slate-500 block mt-0.5">
                                    I understand these codes will not be shown again.
                                </span>
                            </div>
                        </label>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 pt-0 mt-auto">
                <button
                  onClick={handleConfirmSaved}
                  disabled={previewTimer > 0 || !confirmChecked || fetchingPreview}
                  className={`w-full py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2
                    ${(previewTimer > 0 || !confirmChecked || fetchingPreview)
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25'
                    }
                  `}
                >
                    {previewTimer > 0 ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            <span>Please wait {previewTimer}s</span>
                        </>
                    ) : (
                        <>
                            <span>Complete Setup</span>
                            <ArrowRight size={18} />
                        </>
                    )}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SetupMfa;