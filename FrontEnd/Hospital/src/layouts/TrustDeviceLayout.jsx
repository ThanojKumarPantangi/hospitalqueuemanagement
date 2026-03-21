import { Outlet } from "react-router-dom";
import TrustDeviceProvider from "../context/TrustDeviceProvider";

const ProtectedLayout = () => {
  return (
    <>
      <TrustDeviceProvider />
      <Outlet />
    </>
  );
};

export default ProtectedLayout;