import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupApi } from "../../api/auth.api";
import Toast from "../../components/ui/Toast";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!name || !email || !password) {
            setError("All fields are required");
            setToast({ show: true, message:"All fields are required", type: "error" });
            return;
        }

        try {
            setLoading(true);

            await signupApi({
                name,
                email,
                phone,
                password,
            });
            
            sessionStorage.setItem("otpPhone", phone);
            sessionStorage.setItem("otpEmail", email);
            navigate("/verify-otp", { state: { phone, email } });

        } catch (err) {
            const message =
            err.response?.data?.message || "Signup failed. Try again.";
            setError(message);
            setToast({ show: true, message:err.response?.data?.message|| "Signup failed. Try again.", type: "error" });
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

      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6 transition-colors dark:bg-gray-950">
      {/* Exact same setup as Login: max-w-4xl and rounded-3xl */}
        <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900 md:grid-cols-2">
          
          {/* LEFT SIDE: Branding/Illustration */}
          <div className="hidden flex-col justify-center bg-teal-50 p-10 dark:bg-gray-800/50 md:flex">
            <div className="text-left">
              <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white lg:text-4xl">
                WELCOME <span className="text-teal-500">!</span>
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Create your account to get started<br />with our hospital services.
              </p>
            </div>
            
            <div className="mt-8 flex justify-center">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3774/3774299.png"
                alt="Doctor Illustration"
                className="w-48 object-contain transition-transform hover:scale-105"
              />
            </div>
          </div>

          {/* RIGHT SIDE: Tightened Form */}
          <div className="flex flex-col justify-center p-8 lg:p-12">
            <form onSubmit={handleSubmit} className="mx-auto w-full max-w-sm">
              <header className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center md:text-left">
                  <span className="text-teal-500">LOGO</span> Hospital
                </h2>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mt-1 text-center md:text-left">
                  Join our community
                </p>
              </header>

              <div className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.trim())}
                    className="w-full px-4 py-3 rounded-xl border transition-all duration-200 text-sm bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:outline-none dark:bg-gray-800/50 dark:border-gray-700 dark:text-white dark:focus:bg-gray-800 dark:focus:border-teal-400 dark:focus:ring-teal-400/10"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    className="w-full px-4 py-3 rounded-xl border transition-all duration-200 text-sm bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:outline-none dark:bg-gray-800/50 dark:border-gray-700 dark:text-white dark:focus:bg-gray-800 dark:focus:border-teal-400 dark:focus:ring-teal-400/10"
                    placeholder="name@hospital.com"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.trim())}
                    className="w-full px-4 py-3 rounded-xl border transition-all duration-200 text-sm bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:outline-none dark:bg-gray-800/50 dark:border-gray-700 dark:text-white dark:focus:bg-gray-800 dark:focus:border-teal-400 dark:focus:ring-teal-400/10"
                    placeholder="••••••••"
                  />
                </div>
                {/* Phone Field */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    PHONE NO
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\s+/g, ""))}
                    className="w-full px-4 py-3 rounded-xl border transition-all duration-200 text-sm bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 focus:outline-none dark:bg-gray-800/50 dark:border-gray-700 dark:text-white dark:focus:bg-gray-800 dark:focus:border-teal-400 dark:focus:ring-teal-400/10"
                    placeholder="9XXXXXXXX9"
                  />
                </div>
              </div>

              {error && (
                <p className="mt-3 text-xs font-medium text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-teal-500 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/30 transition hover:bg-teal-600 active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? "CREATING ACCOUNT..." : "SIGN UP"}
              </button>

              <footer className="mt-8 text-center">
                <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <p className="text-xs text-gray-500">
                    Already have an account?{" "}
                    <Link to="/login" className="font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400">
                      Login
                    </Link>
                  </p>
                </div>
              </footer>
            </form>
          </div>
        </div>
      </div>
    </>
  
  );
}

export default Signup;