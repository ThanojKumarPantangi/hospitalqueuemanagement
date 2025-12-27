import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { loginApi } from "../../api/auth.api";
import { jwtDecode } from "jwt-decode";
import Toast from "../../components/ui/Toast";
import "./Login.css";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [action, setAction] = useState("LOGIN");

  const navigate = useNavigate();
  const { login } = useAuth();

  const navigateBasedOnRole = (role) => {
    if (role === "ADMIN") navigate("/admin/dashboard");
    else if (role === "DOCTOR") navigate("/doctor/dashboard");
    else navigate("/patient/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (action === "VERIFY_OTP") {
      navigate("/verify-otp", { state: { email } });
      return;
    }

    if (!email || !password) {
      setError("Email and password are required");
      setToast({ show: true, message: "Email and password are required", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const res = await loginApi({ email, password });
      const { accessToken } = res.data;

      login(accessToken);
      const decoded = jwtDecode(accessToken);
      navigateBasedOnRole(decoded.role);
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setToast({ show: true, message, type: "error" });

      if (message === "Phone number not verified") {
        setAction("VERIFY_OTP");
      }
    } finally {
      setLoading(false);
    }
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

      {/* ================= DARK BACKGROUND (MATCHES SCREENSHOT) ================= */}
      <div className="fixed inset-0 -z-10 bg-night overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-night-top to-transparent" />
        <div className="absolute inset-0 bg-radial-night" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      {/* ================= LOGIN LAYOUT ================= */}
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="
            w-full max-w-md
            rounded-3xl
            bg-[#0e1628]/80
            backdrop-blur-xl
            border border-white/10
            shadow-[0_30px_80px_rgba(0,0,0,0.65)]
          "
        >
          {/* ================= HEADER ================= */}
          <div className="px-8 pt-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/90 shadow-lg shadow-teal-500/30">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight">
              LOGO <span className="text-teal-400">Hospital</span>
            </h1>
            <p className="mt-1 text-[11px] tracking-[0.25em] text-gray-400 uppercase">
              Secure Login
            </p>
          </div>

          {/* ================= FORM ================= */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {/* Email */}
            {loading ? (
              <div className="h-11 rounded-xl bg-white/10 animate-pulse" />
            ) : (
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  placeholder="Email address"
                  className="
                    w-full rounded-xl pl-11 pr-4 py-3 text-sm
                    bg-white/5 text-white placeholder-gray-400
                    border border-white/10
                    focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10
                    outline-none transition
                  "
                />
              </div>
            )}

            {/* Password */}
            {loading ? (
              <div className="h-11 rounded-xl bg-white/10 animate-pulse" />
            ) : (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.trim())}
                  placeholder="Password"
                  className="
                    w-full rounded-xl pl-11 pr-4 py-3 text-sm
                    bg-white/5 text-white placeholder-gray-400
                    border border-white/10
                    focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10
                    outline-none transition
                  "
                />
              </div>
            )}

            {error && (
              <p className="text-xs font-medium text-red-400">{error}</p>
            )}

            {/* Submit */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              disabled={loading}
              className="
                w-full rounded-xl bg-teal-500 py-3
                text-sm font-bold text-white
                shadow-lg shadow-teal-500/30
                disabled:opacity-70
              "
            >
              {loading ? (
                <div className="mx-auto h-4 w-32 rounded bg-white/40 animate-pulse" />
              ) : action === "LOGIN" ? (
                <span className="flex items-center justify-center gap-2">
                  LOG IN <ArrowRight className="h-4 w-4" />
                </span>
              ) : (
                "VERIFY OTP"
              )}
            </motion.button>

            {/* Footer */}
            {!loading && (
              <div className="pt-6 text-center space-y-4">
                <button
                  type="button"
                  className="text-xs font-semibold text-teal-400 hover:underline"
                >
                  Forgot Password?
                </button>

                <p className="text-xs text-gray-400">
                  New here?{" "}
                  <Link
                    to="/signup"
                    className="font-bold text-teal-400 hover:text-teal-300"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </>
  );
}

export default Login;
