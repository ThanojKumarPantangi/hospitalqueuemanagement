import { turnCredentialsApi } from "../../api/consulation.api";

export const createPeerConnection = async (
  localStream,
  socket,
  callIdRef,
  roomId,
  onRemoteStream,
  onConnectionStateChange
) => {

  try {

    /* ---------- GET TURN CREDENTIALS ---------- */

    const res = await turnCredentialsApi();
    const { iceServers } = res;

    const pc = new RTCPeerConnection({
      iceServers,
      iceTransportPolicy: "all"
    });

    /* ---------- ADD LOCAL TRACKS ---------- */

    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    /* ---------- REMOTE STREAM ---------- */

    const remoteStream = new MediaStream();

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });

      onRemoteStream(remoteStream);
    };

    /* ---------- ICE CONNECTION STATE ---------- */

    pc.oniceconnectionstatechange = () => {
      console.log("ICE state:", pc.iceConnectionState);
    };

    /* ---------- PEER CONNECTION STATE ---------- */

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("Peer connection state:", state);

      if (onConnectionStateChange) {
        onConnectionStateChange(state);
      }
    };

    /* ---------- ICE GATHERING ---------- */

    pc.onicegatheringstatechange = () => {
      console.log("ICE gathering state:", pc.iceGatheringState);
    };

    /* ---------- ICE CANDIDATE ---------- */

    pc.onicecandidate = ({ candidate }) => {

      if (!candidate) return;

      socket.emit("webrtc:ice-candidate", {
        roomId,
        candidate,
        callId:callIdRef
      });

    };

    /* ---------- DEBUG ---------- */

    pc.onnegotiationneeded = () => {
      console.log("Negotiation needed");
    };

    pc.onsignalingstatechange = () => {
      console.log("Signaling state:", pc.signalingState);
    };

    return pc;

  } catch (error) {
    console.log("Peer connection error:", error);
  }
};