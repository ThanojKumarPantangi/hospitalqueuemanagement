import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  tokenCalled,
  tokenSkipped,
  tokenCompleted,
  tokenNoShow,
  queueUpdated,
  newMessage,
  missedMessages,
  newChatMessage,
  ticketClosed,
} from "@/store/queueSlice";

export function useQueueSocket({ socketRef, departmentId, role = "patient" }) {
  const dispatch = useDispatch();
  const joinedDeptRef = useRef(null);

  /* ---------- JOIN ---------- */
  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;

    if (role === "admin") {
      socket.emit("join-admin-monitor");
      return;
    }

    const deptId = departmentId;
    if (!deptId) return;

    if (joinedDeptRef.current === deptId) return;

    if (joinedDeptRef.current) {
      socket.emit("leave-department", joinedDeptRef.current);
    }

    socket.emit("join-department", deptId);
    joinedDeptRef.current = deptId;
  }, [socketRef, role, departmentId]);

  /* ---------- EVENTS ---------- */
  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;

    const handleQueueEvent = (payload) => {
      if (!payload?.action) return;

      switch (payload.action) {
        case "TOKEN_CALLED":
          dispatch(tokenCalled(payload));
          break;

        case "TOKEN_SKIPPED":
          dispatch(tokenSkipped(payload));
          break;

        case "TOKEN_COMPLETED":
          dispatch(tokenCompleted(payload));
          break;

        case "TOKEN_NO_SHOW":
          dispatch(tokenNoShow(payload));
          break;

        case "QUEUE_POSITION_UPDATE":
          dispatch(queueUpdated(payload));
          break;

        default:
          break;
      }
    };

    socket.on("QUEUE_EVENT", handleQueueEvent);

    // 🔥 FIXED HERE
    socket.on("messages:new", (m) => {
      dispatch(newMessage(m));        // announcements / general
      dispatch(newChatMessage(m));    // chat + threads
    });

    socket.on("messages:missed", (m) => dispatch(missedMessages(m)));

    socket.on("ticket:closed", (payload) => {
      dispatch(ticketClosed(payload));
    });

    return () => {
      socket.off("QUEUE_EVENT", handleQueueEvent);
      socket.off("messages:new");
      socket.off("messages:missed");
      socket.off("ticket:closed");
    };
  }, [socketRef, dispatch]);
}