import { Routes, Route } from "react-router-dom";

import PublicLayout from "./layouts/PublicLayout";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import DoctorSignup from "./pages/auth/DoctorSignup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import OtpVerify from "./pages/auth/OtpVerify";
import Home from "./pages/main/HospitalRolesLanding.jsx";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import RoleDeviceGuard from "./components/DeviceRestriction/RoleDeviceGuard";

import PatientDashboard from "./pages/patient/Dashboard";
import Token from "./pages/patient/Token.jsx";
import MyVisits from "./pages/patient/MyVisits.jsx";
import SessionSecurity from "./pages/patient/SessionSecurity.jsx";
import PatientProfile from "./pages/patient/PatientProfile.jsx";

import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorProfile from "./pages/doctor/DoctorProfile.jsx";
import DoctorQueue from "./pages/doctor/Queue.jsx";

import AdminLayout from "./layouts/AdminNavbarLayout.jsx";
import AdminDashboard from "./pages/admin/Dashboard";
import DoctorManagement from "./pages/admin/Doctors";
import DepartmentManagement from "./pages/admin/Departments";
import QueueMonitor from "./pages/admin/QueueMonitor";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import AdminMessagingPanel from "./pages/admin/AdminMessagingPanel.jsx";

import Loader from "./components/animation/Loader";
import Logout from "./components/button/Logoutbutton.jsx";
import ChangePasswordUI from "./components/changePassword/ChangePasswordForm.jsx";

function App() {
  return (
    <Routes>

      {/* ================= PUBLIC ROUTES ================= */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<OtpVerify />} />
        <Route path="/doctor-signup" element={<DoctorSignup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route path="/" element={<Home />} />
      
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
            <Route path="/patient/profile" element={<PatientProfile />} />
            <Route path="/patient/change-password" element={<ChangePasswordUI />} />
          </Route>

          {/* DOCTOR */}
          <Route element={<RoleRoute allowedRoles={["DOCTOR"]} />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/profile" element={<DoctorProfile />} />
            <Route path="/doctor/queue" element={<DoctorQueue />} />
            <Route path="/doctor/change-password" element={<ChangePasswordUI />} />
          </Route>

          {/* ADMIN */}
          <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="doctors" element={<DoctorManagement />} />
              <Route path="departments" element={<DepartmentManagement />} />
              <Route path="queue-monitor" element={<QueueMonitor />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="settings" element={<ChangePasswordUI />} />
              <Route path="messaging" element={<AdminMessagingPanel />} />
            </Route>
          </Route>
        </Route>
      </Route>

    </Routes>
  );
}

export default App;
