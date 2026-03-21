import { useLocation } from "react-router-dom";
import { useState } from "react";

export const useTrustDevicePrompt = () => {
  const location = useLocation();

  const [open, setOpen] = useState(() => {
    const value =
      location.state?.shouldAskTrustDevice ||
      localStorage.getItem("trustDevicePrompt") === "true";

    if (value) {
      localStorage.removeItem("trustDevicePrompt");
      window.history.replaceState({}, document.title);
    }

    return value;
  });

  return { open, setOpen };
};