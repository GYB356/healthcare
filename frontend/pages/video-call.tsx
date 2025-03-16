import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import io from "socket.io-client";
import Peer from "simple-peer";
import { useAuth } from "../context/AuthContext";

const socket = io("http://localhost:5000");

export default function VideoCall() {
  const router = useRouter();
  const { partnerId } = router.query;
  const { user } = useAuth();
  const myVideo = useRef(null);
  const partnerVideo = useRef(null);
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callerSignal, setCallerSignal] = useState(null);
  const peerRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    socket.emit("joinRoom", { userId: user.id });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setStream(stream);
      if (myVideo.current) myVideo.current.srcObject = stream;
    });

    socket.on("incomingCall", ({ signal }) => setCallerSignal(signal));

    return () => socket.off("incomingCall");
  }, [user]);

  const callUser = () => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (signal) => socket.emit("callUser", { to: partnerId, signal }));
    peer.on("stream", (partnerStream) => (partnerVideo.current.srcObject = partnerStream));

    socket.on("callAccepted", ({ signal }) => {
      peer.signal(signal);
      setCallAccepted(true);
    });

    peerRef.current = peer;
  };

  const answerCall = () => {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (signal) => socket.emit("answerCall", { to: partnerId, signal }));
    peer.on("stream", (partnerStream) => (partnerVideo.current.srcObject = partnerStream));

    peer.signal(callerSignal);
    setCallAccepted(true);
    peerRef.current = peer;
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Video Call</h1>

      <div className="grid grid-cols-2 gap-4">
        <video ref={myVideo} autoPlay muted className="border w-full" />
        {callAccepted && <video ref={partnerVideo} autoPlay className="border w-full" />}
      </div>

      {!callAccepted ? (
        callerSignal ? (
          <button className="bg-green-500 text-white px-4 py-2 mt-4" onClick={answerCall}>
            Answer Call
          </button>
        ) : (
          <button className="bg-blue-500 text-white px-4 py-2 mt-4" onClick={callUser}>
            Start Call
          </button>
        )
      ) : (
        <p className="text-green-500 mt-4">Call in progress...</p>
      )}
    </div>
  );
}
