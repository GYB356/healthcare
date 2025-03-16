import { useEffect, useState } from "react";
import io from "socket.io-client";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

const socket = io("http://localhost:5000");

export default function Chat() {
  const router = useRouter();
  const { partnerId } = router.query;
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!user || !partnerId) return;

    socket.emit("fetchMessages", { userId: user.id, partnerId });

    socket.on("messageHistory", (msgs) => setMessages(msgs));
    socket.on("receiveMessage", (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      socket.off("messageHistory");
      socket.off("receiveMessage");
    };
  }, [user, partnerId]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    socket.emit("sendMessage", { senderId: user.id, receiverId: partnerId, text: newMessage });
    setNewMessage("");
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Chat</h1>
      <div className="border p-4 h-64 overflow-auto">
        {messages.map((msg, i) => (
          <p key={i} className={msg.senderId === user.id ? "text-right" : "text-left"}>
            <span className="bg-gray-200 p-2 rounded">{msg.text}</span>
          </p>
        ))}
      </div>

      <input
        type="text"
        className="border p-2 w-full mt-2"
        placeholder="Type a message..."
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button className="bg-blue-500 text-white px-4 py-2 mt-2" onClick={sendMessage}>
        Send
      </button>
    </div>
  );
}
