import { useEffect, useState } from "react";

export const useDeviceType = () => {
  const [device, setDevice] = useState("unknown");

  useEffect(() => {
    const detect = () => {
      const width = window.innerWidth;

      if (width <599) setDevice("mobile");
      else if (width < 799) setDevice("tablet");
      else setDevice("desktop");
    };

    detect();
    window.addEventListener("resize", detect);
    return () => window.removeEventListener("resize", detect);
  }, []);

  return device;
};
