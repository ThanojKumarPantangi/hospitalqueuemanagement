import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { signupApi } from "../../api/auth.api";
import Toast from "../../components/ui/Toast";
import { motion } from "framer-motion";
import { User, Mail, Lock, Phone, ArrowRight, ShieldCheck } from "lucide-react";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !phone) {
      setError("All fields are required");
      setToast({ show: true, message: "All fields are required", type: "error" });
      return;
    }

    try {
      setLoading(true);
      await signupApi({ name, email, phone, password });

      sessionStorage.setItem("otpPhone", phone);
      sessionStorage.setItem("otpEmail", email);
      navigate("/verify-otp", { state: { phone, email } });
    } catch (err) {
      const message = err.response?.data?.message || "Signup failed";
      setError(message);
      setToast({ show: true, message, type: "error" });
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

      {/* ===== SAME BACKGROUND AS LOGIN ===== */}
      <div className="fixed inset-0 -z-10 bg-night overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-night-top to-transparent" />
        <div className="absolute inset-0 bg-radial-night" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      {/* ===== CARD ===== */}
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
          {/* ===== HEADER ===== */}
          <div className="px-8 pt-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/90 shadow-lg shadow-teal-500/30">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight">
              LOGO <span className="text-teal-400">Hospital</span>
            </h1>
            <p className="mt-1 text-[11px] tracking-[0.25em] text-gray-400 uppercase">
              Create Account
            </p>
          </div>

          {/* ===== FORM ===== */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {/* Name */}
            <Input
              icon={<User />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              loading={loading}
            />

            {/* Email */}
            <Input
              icon={<Mail />}
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="Email address"
              loading={loading}
            />

            {/* Phone */}
            <Input
              icon={<Phone />}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\s+/g, ""))}
              placeholder="Phone number"
              loading={loading}
            />

            {/* Password */}
            <Input
              icon={<Lock />}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value.trim())}
              placeholder="Password"
              loading={loading}
            />

            {error && <p className="text-xs font-medium text-red-400">{error}</p>}

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
              ) : (
                <span className="flex items-center justify-center gap-2">
                  SIGN UP <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </motion.button>

            {/* Footer */}
            {!loading && (
              <div className="pt-6 text-center">
                <p className="text-xs text-gray-400">
                  Already have an account?{" "}
                  <Link to="/login" className="font-bold text-teal-400 hover:text-teal-300">
                    Log in
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

/* ===== Reusable Input (same style as Login) ===== */
function Input({ icon, loading, type = "text", ...props }) {
  if (loading) return <div className="h-11 rounded-xl bg-white/10 animate-pulse" />;

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400">
        {icon}
      </span>
      <input
        type={type}
        {...props}
        className="
          w-full rounded-xl pl-11 pr-4 py-3 text-sm
          bg-white/5 text-white placeholder-gray-400
          border border-white/10
          focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10
          outline-none transition
        "
      />
    </div>
  );
}

export default Signup;
