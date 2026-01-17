import { useEffect, useRef } from "react";

export function useTokenSocket({
  socketRef,
  token,
  departmentId ,
  onCalled,
  onSkipped,
  onCompleted,
  onNoShow,
  onQueueUpdate,

  onNewMessage,
  onMissedMessages,

}) {
  const joinedDeptRef = useRef(null);

  /* ---------- JOIN / LEAVE DEPARTMENT (RECONNECT SAFE) ---------- */
  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;

    const joinDepartment = () => {
      const deptId = departmentId||token?.departmentId;
      if (!deptId) return;

      if (joinedDeptRef.current !== deptId) {
        socket.emit("join-department", deptId);
        joinedDeptRef.current = deptId;
      }
    };

    const leaveDepartment = () => {
      if (joinedDeptRef.current) {
        socket.emit("leave-department", joinedDeptRef.current);
        joinedDeptRef.current = null;
      }
    };

    joinDepartment();
    socket.on("connect", joinDepartment);
    socket.on("disconnect", leaveDepartment);

    return () => {
      socket.off("connect", joinDepartment);
      socket.off("disconnect", leaveDepartment);
      leaveDepartment();
    };
  }, [departmentId,socketRef,token,token?.departmentId]);

  /* ---------- TOKEN EVENTS ---------- */
  useEffect(() => {
  if (!socketRef?.current) return;
  const socket = socketRef.current;

  const handleCalled = payload => onCalled?.(payload);
  const handleSkipped = payload => onSkipped?.(payload);
  const handleCompleted = payload => onCompleted?.(payload);
  const handleNoShow = payload => onNoShow?.(payload);
  const handleQueue = payload => onQueueUpdate?.(payload);

  socket.on("TOKEN_CALLED", handleCalled);
  socket.on("TOKEN_SKIPPED", handleSkipped);
  socket.on("TOKEN_COMPLETED", handleCompleted);
  socket.on("TOKEN_NO_SHOW", handleNoShow);
  socket.on("QUEUE_POSITION_UPDATE", handleQueue);

  return () => {
    socket.off("TOKEN_CALLED", handleCalled);
    socket.off("TOKEN_SKIPPED", handleSkipped);
    socket.off("TOKEN_COMPLETED", handleCompleted);
    socket.off("TOKEN_NO_SHOW", handleNoShow);
    socket.off("QUEUE_POSITION_UPDATE", handleQueue);
  };
}, [socketRef, onCalled, onSkipped, onCompleted, onNoShow, onQueueUpdate]);

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
}, [socketRef, onNewMessage, onMissedMessages]);
}