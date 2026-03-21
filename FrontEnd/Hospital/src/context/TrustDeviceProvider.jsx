import TrustDeviceModal from "../components/TrustModal/TrustDeviceModal.jsx";
import { useTrustDevicePrompt } from "../hooks/useTrustDevicePrompt";
import api from "../api/axios.js";
import { showToast } from "../utils/toastBus.js";

const TrustDeviceProvider = () => {
  const { open, setOpen } = useTrustDevicePrompt();
   
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
    />
  );
};

export default TrustDeviceProvider;