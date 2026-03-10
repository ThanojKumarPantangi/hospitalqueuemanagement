import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone, Signal, X } from "lucide-react";
import { useSocket } from "../../hooks/useSocket";
import { getLocalStream } from "./mediaDevices";
import { createPeerConnection } from "./peerConnection";

export default function VideoCallCore({ roomId, role, isOpen, onClose,token }) {

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceQueueRef = useRef([]);

  const statsIntervalRef = useRef(null);
  const timerRef = useRef(null);

  const { socketRef, connectSocket } = useSocket();

  const [joined, setJoined] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [signalStrength, setSignalStrength] = useState("Disconnected");
  const [callDuration, setCallDuration] = useState(0);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startCallTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallDuration(0);
  };

  const startSignalMonitor = () => {
    statsIntervalRef.current = setInterval(async () => {
      const pc = pcRef.current;
      if (!pc) return;

      const stats = await pc.getStats();

      let quality = "Excellent";

      stats.forEach((report) => {
        if (report.type === "candidate-pair" && report.state === "succeeded") {
          const rtt = report.currentRoundTripTime || 0;

          if (rtt > 0.4) quality = "Poor";
          else if (rtt > 0.25) quality = "Weak";
          else if (rtt > 0.1) quality = "Good";
          else quality = "Excellent";
        }
      });

      setSignalStrength(quality);
    }, 2000);
  };

  useEffect(() => {
    connectSocket();

    const socket = socketRef.current;
    if (!socket) return;

    const handleRoomCreated = () => {
      console.log("Room created, waiting for peer...");
    };

    const handleRoomJoined = async () => {
      const pc = pcRef.current;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc:offer", { roomId, offer });
    };

    const handleOffer = async ({ offer }) => {
      const pc = pcRef.current;

      await pc.setRemoteDescription(offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc:answer", { roomId, answer });

      iceQueueRef.current.forEach((c) => pc.addIceCandidate(c));
      iceQueueRef.current = [];
    };

    const handleAnswer = async ({ answer }) => {
      const pc = pcRef.current;

      if (pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(answer);

        iceQueueRef.current.forEach((c) => pc.addIceCandidate(c));
        iceQueueRef.current = [];
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      const pc = pcRef.current;
      if (!pc) return;

      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.error("ICE error:", err);
        }
      } else {
        iceQueueRef.current.push(candidate);
      }
    };

    const handleUserLeft = () => {
      console.log("Peer left");

      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      setSignalStrength("Disconnected");
    };

    const handleJoinDenied = ({ reason }) => {
      console.log("Join denied:", reason);
      alert(reason);
    };

    socket.on("webrtc:room-created", handleRoomCreated);
    socket.on("webrtc:room-joined", handleRoomJoined);
    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice-candidate", handleIceCandidate);
    socket.on("webrtc:user-left", handleUserLeft);
    socket.on("webrtc:join-denied", handleJoinDenied);

    return () => {
      socket.off("webrtc:room-created", handleRoomCreated);
      socket.off("webrtc:room-joined", handleRoomJoined);
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice-candidate", handleIceCandidate);
      socket.off("webrtc:user-left", handleUserLeft);
      socket.off("webrtc:join-denied", handleJoinDenied);
    };
  }, [roomId, role, connectSocket, socketRef]);

  const joinCall = async () => {
    const socket = socketRef.current;

    const stream = await getLocalStream();
    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const pc = await createPeerConnection(
      stream,
      socket,
      roomId,
      (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      }
    );

    pcRef.current = pc;

    socket.emit("webrtc:join-room", { roomId, userType: role });

    startSignalMonitor();
    startCallTimer();

    setJoined(true);
  };

  const endCall = () => {
    const socket = socketRef.current;

    const pc = pcRef.current;
    const stream = localStreamRef.current;

    if (pc) pc.close();

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    socket.emit("webrtc:leave-room");

    clearInterval(statsIntervalRef.current);
    stopCallTimer();

    pcRef.current = null;
    localStreamRef.current = null;

    setJoined(false);
    setSignalStrength("Disconnected");
  };

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setMicEnabled((prev) => !prev);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    stream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setCameraEnabled((prev) => !prev);
  };

  const closePopup = () => {
    if (joined) {
      endCall();
    }

    onClose();
  };

  useEffect(()=>{

    const handleendCall = () => {
      const socket = socketRef.current;

      const pc = pcRef.current;
      const stream = localStreamRef.current;

      if (pc) pc.close();

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      socket.emit("webrtc:leave-room");

      clearInterval(statsIntervalRef.current);
      stopCallTimer();

      pcRef.current = null;
      localStreamRef.current = null;

      setJoined(false);
      setSignalStrength("Disconnected");
    };

    if(token?.status==="SKIPPED" || token?.status==="COMPLETED"){
      handleendCall()
    }

    return ()=>{
      handleendCall()
    }

  },[token?.status,socketRef])
 

  if (!isOpen) return null;

  return (

    <AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50"
      >

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="bg-white w-[950px] max-w-[95vw] rounded-2xl shadow-2xl p-6 relative"
        >

          <button
            onClick={closePopup}
            className="absolute top-4 right-4 p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <X size={18} />
          </button>

          <div className="flex justify-between items-center mb-4">

            <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
              <Signal size={18} />
              Signal: {signalStrength}
            </div>

            <div className="text-sm font-semibold text-gray-800">
              {formatTime(callDuration)}
            </div>

          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="relative bg-black rounded-xl overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-[340px] object-cover"
              />
              <span className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-2 py-1 rounded">
                You
              </span>
            </div>

            <div className="relative bg-black rounded-xl overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-[340px] object-cover"
              />
              <span className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-2 py-1 rounded">
                Remote
              </span>
            </div>

          </div>

          <div className="flex justify-center gap-4 mt-6">

            {!joined && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={joinCall}
                className="flex items-center gap-2 bg-green-500 text-white px-5 py-2 rounded-full shadow"
              >
                <Phone size={18} /> Join Call
              </motion.button>
            )}

            {joined && (
              <>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={toggleMic}
                  className="p-3 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={toggleCamera}
                  className="p-3 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  {cameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={endCall}
                  className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  <PhoneOff size={20} />
                </motion.button>

              </>
            )}

          </div>

        </motion.div>

      </motion.div>

    </AnimatePresence>

  );
}
