import { Routes, Route } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import OtpVerify from "./pages/auth/OtpVerify";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import RoleDeviceGuard from "./components/DeviceRestriction/RoleDeviceGuard";

import PatientDashboard from "./pages/patient/Dashboard";
import Token from "./pages/patient/Token.jsx";
import MyVisits from "./pages/patient/MyVisits.jsx";
import SessionSecurity from "./pages/patient/SessionSecurity.jsx";

import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorProfile from "./pages/doctor/DoctorProfile.jsx";
import DoctorQueue from "./pages/doctor/Queue.jsx";


import AdminDashboard from "./pages/admin/Dashboard";

import Loader from "./components/animation/Loader";
import Logout from "./components/button/Logoutbutton.jsx";

function App() {
  return (
    <Routes>

      {/* ================= PUBLIC ROUTES ================= */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<OtpVerify />} />
      </Route>

      <Route path="/loader" element={<Loader />} />
      <Route path="/logout" element={<Logout />} />

      {/* ================= PROTECTED + DEVICE RESTRICTED ================= */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleDeviceGuard />}>
          
          {/* PATIENT */}
          <Route element={<RoleRoute allowedRoles={["PATIENT"]} />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/tokens" element={<Token />} />
            <Route path="/patient/history" element={<MyVisits />} />
            <Route path="/patient/session" element={<SessionSecurity />} />
          </Route>

          {/* DOCTOR */}
          <Route element={<RoleRoute allowedRoles={["DOCTOR"]} />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/profile" element={<DoctorProfile />} />
            <Route path="/doctor/queue" element={<DoctorQueue />} />
          </Route>

          {/* ADMIN */}
          <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

        </Route>
      </Route>

    </Routes>
  );
}

export default App;
