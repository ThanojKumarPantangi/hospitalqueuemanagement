import { Outlet } from "react-router-dom";
import { useDeviceType } from "../../hooks/useDeviceType";
import DeviceRestriction from "./DeviceRestriction";
import { useAuth } from "../../hooks/useAuth";

export default function RoleDeviceGuard() {
  const { user, loading } = useAuth();
  const device = useDeviceType();

  // Wait until auth + device are ready
  if (loading || device === "unknown") return null;

  // PATIENT → allowed everywhere
  if (user?.role === "PATIENT") {
    return <Outlet />;
  }

  // DOCTOR / ADMIN → block on mobile
  if (
    (user?.role === "DOCTOR" || user?.role === "ADMIN") &&
    device === "mobile"
  ) {
    return (
      <DeviceRestriction
        title="This site is only accessible from desktop and laptop"
      />
    );
  }

  return <Outlet />;
}
