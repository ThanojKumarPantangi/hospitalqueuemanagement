import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation,useNavigate } from "react-router-dom";
import { sendotp,verifyotp } from "../../api/auth.api";
import Toast from "../../components/ui/Toast";

function OtpVerify() {
  const location = useLocation();
  const phone = location.state?.phone || sessionStorage.getItem("otpPhone");
  const email = location.state?.email || sessionStorage.getItem("otpEmail");

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(300);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const navigate = useNavigate();
  const canResend = timer === 0 && !sending;
  const inputRefs = useRef([]);


  const didSendOnce = useRef(false);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  /* ---------------- SEND OTP ---------------- */
const sendingRef = useRef(false);

const triggerOtp = useCallback(async () => {
  if (!phone || sendingRef.current) return;

  try {
    setError("");
    sendingRef.current = true;
    setSending(true);

    await sendotp({ phone ,email});
    setToast({ show: true, message: "OTP sent successfully!", type: "success" });
    setTimer(300);
  } catch (err) {
    setError(err.response?.data?.message || "Try Again After Some Time");
    setToast({ show: true, message: err.response?.data?.message||"Try Again After Some Time", type: "error" });
  } finally {
    sendingRef.current = false;
    setSending(false);
  }
}, [phone,email]);

//  Verify Otp
const verifyOtp = async () => {
  if(!otp){
    setError("OTP Not Provided")
    return;
  }
  try {
    await verifyotp({
      phone,
      otp: otp.join("")
    });
    setToast({ show: true, message: "OTP verified successfully!", type: "success" });
    sessionStorage.removeItem("otpPhone");
    navigate("/login");
  } catch (err) {
    setError(err.response?.data?.message || "Try Again After Some Time");
    setToast({ show: true, message: err.response?.data?.message||"Try Again After Some Time", type: "error" });
  }
}

  /* ---------------- INITIAL OTP (ONCE PER REFRESH) ---------------- */
  useEffect(() => {
    if (!phone) {
      setError("Phone Number Not Provided");
      return;
    }

    if (didSendOnce.current) return; 
    didSendOnce.current = true;

    triggerOtp();
  }, [phone, triggerOtp]);

  /* ---------------- OTP INPUT ---------------- */
  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalOtp = otp.join("");

    if (finalOtp.length < 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* UI*/}
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6 transition-colors dark:bg-gray-950">
        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300 dark:bg-gray-900">
          <div className="p-8 lg:p-10">
            <header className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Security Check
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 px-4">
                Enter the code sent to{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {phone || "your device"}
                </span>
              </p>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="mb-8 flex justify-between gap-2 lg:gap-3">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    ref={(el) => (inputRefs.current[index] = el)}
                    value={data}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 text-center text-xl font-bold text-gray-900 transition-all focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800 lg:h-14"
                  />
                ))}
              </div>

              {error && (
                <p className="mb-4 text-center text-xs font-semibold text-red-500">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                onClick={verifyOtp}
                className="w-full rounded-xl bg-teal-500 py-4 text-sm font-bold text-white shadow-lg shadow-teal-500/30 transition-all hover:bg-teal-600 active:scale-95 disabled:opacity-70"
              >
                {loading ? "VERIFYING..." : "VERIFY ACCOUNT"}
              </button>

              <footer className="mt-8 text-center border-t border-gray-100 pt-6 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Didnt receive the code? <br />
                  <button
                    type="button"
                    onClick={triggerOtp}
                    disabled={!canResend}
                    className={`mt-2 font-bold transition-all duration-200 ${
                      canResend
                        ? "text-teal-600 hover:text-teal-700 dark:text-teal-400"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {sending
                      ? "Sending..."
                      : canResend
                      ? "Resend Code"
                      : `Resend in ${timer}s`}
                  </button>
                </p>
              </footer>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default OtpVerify;
