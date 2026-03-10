import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Home from "../pages/main/HospitalRolesLanding";

const PublicHomeRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  if (user) {
    switch (user.role) {
      case "PATIENT":
        return <Navigate to="/patient/dashboard" replace />;
      case "DOCTOR":
        return <Navigate to="/doctor/dashboard" replace />;
      case "ADMIN":
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <Home />;
};

export default PublicHomeRoute;