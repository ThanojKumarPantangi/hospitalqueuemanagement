import {useTokenSocket} from "./useTokenSocket";

export default function usePatientTokenSocket({
  socketRef,
  token,
  setToken,
  showToast,
}) {
  useTokenSocket({
    socketRef,
    token,

    /* ---------------- CALLED ---------------- */
    onCalled: ({ tokenId, doctorName }) => {
      if (!tokenId) return;

      setToken((prev) => {
        if (!prev || prev._id !== tokenId) return prev;

        showToast({
          type: "success",
          message: `Your token #${prev.tokenNumber} is being called by Dr. ${doctorName}.`,
        });

        sessionStorage.setItem("doctorName", doctorName);

        return {
          ...prev,
          doctorName,
          status: "CALLED",
        };
      });
    },

    /* ---------------- SKIPPED ---------------- */
    onSkipped: ({ tokenId }) => {
      if (!tokenId) return;

      setToken((prev) => {
        if (!prev || prev._id !== tokenId) return prev;

        showToast({
          type: "error",
          message: `Your token #${prev.tokenNumber} was skipped.`,
        });

        sessionStorage.removeItem("doctorName");

        return null;
      });
    },

    /* ---------------- COMPLETED ---------------- */
    onCompleted: ({ tokenId }) => {
      if (!tokenId) return;

      setToken((prev) => {
        if (!prev || prev._id !== tokenId) return prev;

        showToast({
          type: "success",
          message: `Your token #${prev.tokenNumber} is completed.`,
        });

        sessionStorage.removeItem("doctorName");

        return null;
      });
    },

    /* ---------------- NO SHOW ---------------- */
    onNoShow: ({ tokenId }) => {
      if (!tokenId) return;

      setToken((prev) => {
        if (!prev || prev._id !== tokenId) return prev;

        sessionStorage.removeItem("doctorName");

        return null;
      });
    },

    /* ---------------- QUEUE UPDATE ---------------- */
    onQueueUpdate: ({
      tokenId,
      minMinutes,
      maxMinutes,
      patientsAhead,
    }) => {
      if (!tokenId) return;

      setToken((prev) => {
        if (!prev || prev._id !== tokenId) return prev;

        return {
          ...prev,
          waitingCount:
            typeof patientsAhead === "number"
              ? patientsAhead
              : prev.waitingCount,

          minMinutes:
            typeof minMinutes === "number"
              ? minMinutes
              : prev.minMinutes,

          maxMinutes:
            typeof maxMinutes === "number"
              ? maxMinutes
              : prev.maxMinutes,
        };
      });
    },
  });
}