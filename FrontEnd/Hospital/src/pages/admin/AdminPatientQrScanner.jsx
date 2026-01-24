import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import QrScanner from "qr-scanner";

import { verifyPatientQrApi } from "../../api/admin.api";
import Toast from "../../components/ui/Toast";
import Loader from "../../components/animation/Loader";

export default function AdminPatientQrScanner({ onFound, onClose }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const [loadingCamera, setLoadingCamera] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const [toast, setToast] = useState(null);
  const [result, setResult] = useState(null);

  const stopScanner = () => {
    try {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    } catch (e) {
      // ignore
    }
  };

  const handleVerifyQr = async (qrText) => {
    if (!qrText) return;
    if (verifying) return;

    try {
      setVerifying(true);

      const res = await verifyPatientQrApi(qrText);

      const data = res?.data;
      setResult(data);

      setToast({
        type: "success",
        message: `Patient Found: ${data?.name || "Unknown"}`,
      });

      // Stop camera once verified
      stopScanner();

      // If you want auto-fill booking form
      if (typeof onFound === "function") {
        onFound(data);
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err?.response?.data?.message || "QR verification failed",
      });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        setLoadingCamera(true);

        if (!videoRef.current) return;

        // QR scanner init
        const scanner = new QrScanner(
          videoRef.current,
          (scanResult) => {
            const qrText = scanResult?.data;
            if (!qrText) return;

            // Verify only once
            handleVerifyQr(qrText);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5,
          }
        );

        scannerRef.current = scanner;

        await scanner.start();

        if (!mounted) return;
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

    start();

    return () => {
      mounted = false;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Camera Preview
              </p>

              {verifying && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Verifying...
                </span>
              )}
            </div>

            <div className="relative bg-black">
              {loadingCamera && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60">
                  <Loader />
                </div>
              )}

              <video
                ref={videoRef}
                className="w-full aspect-video object-cover"
                muted
                playsInline
              />
            </div>

            <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
              Keep the QR inside the camera box. Verification will happen
              automatically.
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
                <div className="flex items-start justify-between gap-4">
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
                    onClick={() => {
                      setResult(null);
                      setToast(null);
                      setLoadingCamera(true);
                      // restart scanner
                      window.location.reload();
                    }}
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