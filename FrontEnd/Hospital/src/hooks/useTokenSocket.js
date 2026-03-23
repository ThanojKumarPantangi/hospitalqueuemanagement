import { useEffect, useRef } from "react";

export function useTokenSocket({
  socketRef,
  token,
  departmentId,
  onCalled,
  onSkipped,
  onCompleted,
  onNoShow,
  onQueueUpdate,
  onNewMessage,
  onMissedMessages,
}) {
  const joinedDeptRef = useRef(null);

  /* ---------- JOIN DEPARTMENT (ONLY ON CHANGE) ---------- */
  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;
    const deptId = departmentId || token?.departmentId;

    if (!deptId) return;

    // prevent duplicate join
    if (joinedDeptRef.current === deptId) return;

    // leave previous department if switching
    if (joinedDeptRef.current) {
      socket.emit("leave-department", joinedDeptRef.current);
    }

    socket.emit("join-department", deptId);
    joinedDeptRef.current = deptId;

  }, [departmentId, token?.departmentId,socketRef]);



  /* ---------- SOCKET RECONNECT HANDLING ---------- */
  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;

    const handleReconnect = () => {
      const deptId = joinedDeptRef.current;
      if (deptId) {
        socket.emit("join-department", deptId);
      }
    };

    socket.on("connect", handleReconnect);

    return () => {
      socket.off("connect", handleReconnect);
    };
  }, [socketRef]);



  /* ---------- TOKEN EVENTS ---------- */
  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;

  const handleQueueUpdate = (payload) => {
      switch (payload.action) {
        case "TOKEN_CALLED":
          onCalled?.(payload);
          break;

        case "TOKEN_COMPLETED":
          onCompleted?.(payload);
          break;

        case "TOKEN_SKIPPED":
          onSkipped?.(payload);
          break;

        case "QUEUE_POSITION_UPDATE":
          onQueueUpdate?.(payload);
          break;

        default:
          break;
      }
    };

    
    socket.on("QUEUE_EVENT", handleQueueUpdate);

    return () => {
      
      socket.off("QUEUE_EVENT", handleQueueUpdate);
    };
  }, [onCalled, onSkipped, onCompleted, onNoShow, onQueueUpdate,socketRef]);



  /* ---------- MESSAGE EVENTS ---------- */
  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;

    const handleNewMessage = (message) => {
      onNewMessage?.(message);
    };

    const handleMissedMessages = (messages = []) => {
      onMissedMessages?.(messages);
    };

    socket.on("messages:new", handleNewMessage);
    socket.on("messages:missed", handleMissedMessages);

    return () => {
      socket.off("messages:new", handleNewMessage);
      socket.off("messages:missed", handleMissedMessages);
    };
  }, [onNewMessage, onMissedMessages,socketRef]);
}