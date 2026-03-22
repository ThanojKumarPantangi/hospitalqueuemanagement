import TrustDeviceModal from "../components/TrustModal/TrustDeviceModal.jsx";
import { useTrustDevicePrompt } from "../hooks/useTrustDevicePrompt";
import api from "../api/axios.js";
import { showToast } from "../utils/toastBus.js";
import {useAuth} from "../hooks/useAuth.js";

const TrustDeviceProvider = () => {
  const { open, setOpen } = useTrustDevicePrompt();
  const {user}=useAuth();
  
  const handleTrust = async () => {
    try {
      const res=await api.post("/api/auth/device/trust");
      showToast({
        type: "success",
        message: res?.data?.message || "Successfully marked as trusted.",
      })
      setOpen(false);
    } catch (err) {
        showToast({
          type: "error",
          message:
            err?.response?.data?.message ||
            "Failed to mark as trusted.",
        });
      console.error(err);
    }
  };

  return (
    <TrustDeviceModal
      isOpen={open}
      onClose={() => setOpen(false)}
      onConfirm={handleTrust}
      role={user?.role}
    />
  );
};

export default TrustDeviceProvider;