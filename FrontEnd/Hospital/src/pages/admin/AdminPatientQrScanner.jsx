import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
} from "lucide-react";
import QrScanner from "qr-scanner";

import { verifyPatientQrApi } from "../../api/admin.api";
import Toast from "../../components/ui/Toast";

export default function AdminPatientQrScanner({ onFound, onClose }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const beepRef = useRef(null);

  // ✅ FIX: prevent multiple beeps + multiple verify calls
  const scanLockRef = useRef(false);
  const lastQrRef = useRef(null);

  const [loadingCamera, setLoadingCamera] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const [toast, setToast] = useState(null);
  const [result, setResult] = useState(null);

  // 🔥 camera states
  const [cameraFacing, setCameraFacing] = useState("environment"); // "environment" | "user"
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // -------------------------
  // 🔊 Beep sound init
  // -------------------------
  useEffect(() => {
    beepRef.current = new Audio("/beep.mp3");
    beepRef.current.volume = 0.8;
  }, []);

  const playBeep = async () => {
    try {
      if (!beepRef.current) return;
      beepRef.current.currentTime = 0;
      await beepRef.current.play();
    } catch (e) {
      // browser may block autoplay until user interacts
    }
  };

  // -------------------------
  // Helpers: stop scanner
  // -------------------------
  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    } catch (e) {
      // ignore
    }
  };

  // -------------------------
  // Torch support check
  // -------------------------
  const checkTorchSupport = async () => {
    try {
      const videoEl = videoRef.current;
      if (!videoEl) return;

      const stream = videoEl.srcObject;
      if (!stream) return;

      const track = stream.getVideoTracks?.()?.[0];
      if (!track) return;

      const caps = track.getCapabilities?.();
      const supported = Boolean(caps?.torch);

      setTorchSupported(supported);
      if (!supported) setTorchOn(false);
    } catch (e) {
      setTorchSupported(false);
      setTorchOn(false);
    }
  };

  // -------------------------
  // Toggle Torch
  // -------------------------
  const toggleTorch = async () => {
    try {
      const videoEl = videoRef.current;
      if (!videoEl) return;

      const stream = videoEl.srcObject;
      if (!stream) return;

      const track = stream.getVideoTracks?.()?.[0];
      if (!track) return;

      const caps = track.getCapabilities?.();
      if (!caps?.torch) {
        setToast({
          type: "error",
          message: "Torch not supported on this device/browser",
        });
        setTorchSupported(false);
        setTorchOn(false);
        return;
      }

      const nextTorch = !torchOn;

      await track.applyConstraints({
        advanced: [{ torch: nextTorch }],
      });

      setTorchOn(nextTorch);
    } catch (e) {
      setToast({
        type: "error",
        message: "Unable to toggle torch. Try another camera.",
      });
    }
  };

  // -------------------------
  // Verify QR
  // -------------------------
  const handleVerifyQr = async (qrText) => {
    if (!qrText) return;
    if (verifying) return;
    if (result) return;

    try {
      setVerifying(true);

      const res = await verifyPatientQrApi(qrText);
      const data = res?.data;

      setResult(data);

      setToast({
        type: "success",
        message: `Patient Found: ${data?.name || "Unknown"}`,
      });

      // ✅ stop camera once verified
      await stopScanner();

      // ✅ send data back to modal
      if (typeof onFound === "function") {
        onFound(data);
      }

      // ✅ auto close scanner after success
      setTimeout(() => {
        if (typeof onClose === "function") {
          onClose();
        }
      }, 400);
    } catch (err) {
      // ❌ if verify failed, unlock scanning again
      scanLockRef.current = false;
      lastQrRef.current = null;

      setToast({
        type: "error",
        message: err?.response?.data?.message || "QR verification failed",
      });
    } finally {
      setVerifying(false);
    }
  };

  // -------------------------
  // Start scanner
  // -------------------------
  const startScanner = async () => {
    try {
      setLoadingCamera(true);
      setResult(null);

      // ✅ reset scan lock whenever scanner starts
      scanLockRef.current = false;
      lastQrRef.current = null;

      if (!videoRef.current) return;

      await stopScanner();

      const scanner = new QrScanner(
        videoRef.current,
        async (scanResult) => {
          const qrText = scanResult?.data;
          if (!qrText) return;

          // ✅ prevent multiple triggers instantly
          if (scanLockRef.current) return;

          // optional: avoid same QR repeating
          if (lastQrRef.current === qrText) return;

          scanLockRef.current = true;
          lastQrRef.current = qrText;

          // 🔊 beep once when QR detected
          await playBeep();

          // verify once
          await handleVerifyQr(qrText);
        },
        {
          highlightScanRegion: false,
          highlightCodeOutline: false,
          maxScansPerSecond: 5,
          preferredCamera: cameraFacing,
        }
      );

      scannerRef.current = scanner;
      await scanner.start();

      setTimeout(async () => {
        await checkTorchSupport();
      }, 250);

      setLoadingCamera(false);
    } catch (err) {
      setToast({
        type: "error",
        message:
          "Camera permission denied or camera not available. Please allow camera access.",
      });
      setLoadingCamera(false);
    }
  };

  // -------------------------
  // Mount + camera switch re-init
  // -------------------------
  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFacing]);

  // -------------------------
  // UI Actions
  // -------------------------
  const handleSwitchCamera = async () => {
    setTorchOn(false);
    setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleScanAgain = async () => {
    setToast(null);
    setTorchOn(false);

    // ✅ unlock scan again
    scanLockRef.current = false;
    lastQrRef.current = null;

    await startScanner();
  };

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <Camera className="text-teal-600 dark:text-teal-400" size={18} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  Scan Patient QR
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Scan QR from patient profile to auto-fill patient details.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>

          {/* Scanner Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg"
          >
            {/* Top Controls */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Camera Preview
              </p>

              <div className="flex items-center gap-2">
                {/* Switch Camera */}
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <SwitchCamera size={16} />
                  <span className="text-xs font-bold">
                    {cameraFacing === "environment" ? "Back Cam" : "Front Cam"}
                  </span>
                </button>

                {/* Torch */}
                <button
                  type="button"
                  disabled={!torchSupported}
                  onClick={toggleTorch}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition-all
                    ${
                      torchSupported
                        ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        : "bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  {torchOn ? (
                    <FlashlightOff size={16} />
                  ) : (
                    <Flashlight size={16} />
                  )}
                  <span className="text-xs font-bold">
                    {torchSupported
                      ? torchOn
                        ? "Torch Off"
                        : "Torch On"
                      : "No Torch"}
                  </span>
                </button>

                {/* Verifying badge */}
                {verifying && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Verifying...
                  </span>
                )}
              </div>
            </div>

            {/* Video */}
            <div className="relative bg-black">
              {loadingCamera && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60">
                  <div className="h-10 w-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                </div>
              )}

              <video
                ref={videoRef}
                className="w-full aspect-video object-cover"
                muted
                playsInline
              />

              {/* QR Box Animation Overlay */}
              {!loadingCamera && !result && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-[70%] max-w-[360px] aspect-square border-2 border-white/40 rounded-2xl">
                    <div className="absolute -top-2 -left-2 w-6 h-6 border-l-4 border-t-4 border-indigo-400 rounded-tl-xl" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 border-r-4 border-t-4 border-indigo-400 rounded-tr-xl" />
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-4 border-b-4 border-indigo-400 rounded-bl-xl" />
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-4 border-b-4 border-indigo-400 rounded-br-xl" />

                    <motion.div
                      initial={{ y: 0, opacity: 0.8 }}
                      animate={{ y: ["0%", "90%", "0%"] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute left-2 right-2 top-2 h-1 rounded-full bg-indigo-400/80 blur-[1px]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
              Keep the QR inside the box. Scan beep will play once detected.
            </div>
          </motion.div>

          {/* Result Card */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/10 p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className="text-emerald-600 dark:text-emerald-400 mt-1"
                      size={20}
                    />
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                        Patient Verified
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        <span className="font-bold">Name:</span>{" "}
                        {result?.name || "—"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-bold">Phone:</span>{" "}
                        {result?.phone || "—"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-bold">Patient ID:</span>{" "}
                        {result?.patientId || "—"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleScanAgain}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <XCircle size={16} />
                    Scan Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}