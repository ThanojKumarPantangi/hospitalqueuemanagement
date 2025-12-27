import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/signup" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
