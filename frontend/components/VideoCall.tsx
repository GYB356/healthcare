import React, { useState, useRef, useEffect } from "react";
import Video, { LocalTrack, RemoteTrack, Room, LocalParticipant, RemoteParticipant, LocalVideoTrack, LocalAudioTrack, RemoteVideoTrack, RemoteAudioTrack } from "twilio-video";
import { useAuth } from "../context/AuthContext";

interface VideoCallProps {
  roomName: string;
}

export default function VideoCall({ roomName }: VideoCallProps) {
  const { token } = useAuth();
  const [videoRoom, setVideoRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!roomName || !token) {
      setError("Room name or authentication token is missing");
      setLoading(false);
      return;
    }

    // Clean up function to handle component unmount
    const cleanup = () => {
      if (videoRoom) {
        videoRoom.disconnect();
        setVideoRoom(null);
      }
    };

    async function connectToRoom() {
      try {
        setLoading(true);
        
        // Get video token from backend
        const response = await fetch("/api/video/token", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ roomName }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to get video token");
        }
        
        const { token: videoToken } = await response.json();
        
        // Connect to Twilio video room
        const room = await Video.connect(videoToken, { 
          video: true, 
          audio: true,
          name: roomName
        });
        
        setVideoRoom(room);
        setLoading(false);
        
        // Handle local participant's tracks
        room.localParticipant.tracks.forEach(publication => {
          if (publication.track) {
            // Cast to LocalVideoTrack or LocalAudioTrack which have attach method
            const trackElement = (publication.track as LocalVideoTrack | LocalAudioTrack).attach();
            localVideoRef.current?.appendChild(trackElement);
          }
        });
        
        // Set up event listeners for when remote participants join
        room.participants.forEach(participant => {
          handleParticipantConnected(participant);
        });
        
        room.on("participantConnected", handleParticipantConnected);
        room.on("participantDisconnected", handleParticipantDisconnected);
        
      } catch (err) {
        console.error("Error connecting to video room:", err);
        setError(err instanceof Error ? err.message : "Failed to connect to video room");
        setLoading(false);
      }
    }
    
    connectToRoom();
    return cleanup;
  }, [roomName, token]);
  
  // Handle when a new participant connects to the room
  const handleParticipantConnected = (participant: RemoteParticipant) => {
    // Attach existing participant tracks
    participant.tracks.forEach(publication => {
      if (publication.isSubscribed) {
        const track = publication.track;
        if (track) {
          // Cast to RemoteVideoTrack or RemoteAudioTrack which have attach method
          remoteVideoRef.current?.appendChild((track as RemoteVideoTrack | RemoteAudioTrack).attach());
        }
      }
    });
    
    // Handle participant's new tracks
    participant.on('trackSubscribed', track => {
      // Cast to RemoteVideoTrack or RemoteAudioTrack which have attach method
      remoteVideoRef.current?.appendChild((track as RemoteVideoTrack | RemoteAudioTrack).attach());
    });
    
    // Handle participant's track unsubscriptions
    participant.on('trackUnsubscribed', track => {
      // Find all track elements and remove them
      // Cast to RemoteVideoTrack or RemoteAudioTrack which have detach method
      (track as RemoteVideoTrack | RemoteAudioTrack).detach().forEach(element => element.remove());
    });
  };
  
  // Handle when a participant disconnects from the room
  const handleParticipantDisconnected = (participant: RemoteParticipant) => {
    participant.removeAllListeners();
    const participantDiv = document.getElementById(participant.sid);
    if (participantDiv) participantDiv.remove();
  };
  
  // End the call and disconnect from the room
  const endCall = () => {
    if (videoRoom) {
      videoRoom.disconnect();
      setVideoRoom(null);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md bg-white">
      <h2 className="text-lg font-bold mb-4">Live Consultation</h2>
      
      {loading && <p className="text-gray-500">Connecting to video room...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded p-2">
          <h3 className="text-sm font-medium mb-2">You</h3>
          <div 
            ref={localVideoRef} 
            className="bg-gray-100 rounded min-h-[200px] flex items-center justify-center"
          >
            {!videoRoom && <p className="text-gray-500">Camera not connected</p>}
          </div>
        </div>
        
        <div className="border rounded p-2">
          <h3 className="text-sm font-medium mb-2">Remote Participant</h3>
          <div 
            ref={remoteVideoRef} 
            className="bg-gray-100 rounded min-h-[200px] flex items-center justify-center"
          >
            {videoRoom && videoRoom.participants.size === 0 && (
              <p className="text-gray-500">Waiting for others to join...</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-center">
        <button 
          onClick={endCall}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
        >
          End Call
        </button>
      </div>
    </div>
  );
}