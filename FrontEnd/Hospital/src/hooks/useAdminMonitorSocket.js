import { useEffect } from "react";

export function useAdminMonitorSocket({
  socketRef,
  onTokenCalled,
  onTokenCompleted,
  onTokenSkipped,
  onQueueUpdate,
}) {
  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;

    // (optional if auto-joined on backend)
    socket.emit("join-admin-monitor");

    const handleAdminUpdate = (payload) => {
      switch (payload.action) {
        case "TOKEN_CALLED":
          onTokenCalled?.(payload);
          break;

        case "TOKEN_COMPLETED":
          onTokenCompleted?.(payload);
          break;

        case "TOKEN_SKIPPED":
          onTokenSkipped?.(payload);
          break;

        case "QUEUE_POSITION_UPDATE":
          onQueueUpdate?.(payload);
          break;

        default:
          break;
      }
    };

    socket.on("ADMIN_TOKEN_UPDATE", handleAdminUpdate);

    return () => {
      socket.off("ADMIN_TOKEN_UPDATE", handleAdminUpdate);
    };
  }, [
    socketRef,
    onTokenCalled,
    onTokenCompleted,
    onTokenSkipped,
    onQueueUpdate,
  ]);
}
