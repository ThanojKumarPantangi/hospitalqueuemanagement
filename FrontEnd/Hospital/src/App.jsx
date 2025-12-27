import {Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import PublicLayout from "./layouts/PublicLayout";
import Signup from "./pages/auth/Signup";
import OtpVerify from "./pages/auth/OtpVerify";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import PatientDashboard from "./pages/patient/Dashboard";
import Token from "./pages/patient/Token.jsx";
import DoctorDashboard from "./pages/doctor/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import Loader from "./components/Loader.jsx"
import Logout from "./components/button/Logoutbutton.jsx"

function App() {

  return (

        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-otp" element={<OtpVerify />} />
          </Route>

          <Route path="/loader" element={<Loader />} />
          <Route path="/logout" element={<Logout />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute allowedRoles={["PATIENT"]} />}>
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              <Route path="/tokens" element={<Token />} />
              <Route path="/history" element={<PatientDashboard />} />

            </Route>
            <Route element={<RoleRoute allowedRoles={["DOCTOR"]} />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            </Route>
            <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>
          </Route>

        </Routes>
  )
}

export default App
