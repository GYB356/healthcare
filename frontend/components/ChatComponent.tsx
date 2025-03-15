import { useEffect, useState } from "react";
import socket from "../utils/socket";
import CryptoJS from "crypto-js";

const SECRET_KEY = "supersecretkey"; // Store securely

export default function Chat({ chatId, userId }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    socket.emit("joinChat", chatId);

    socket.on("receiveMessage", (msg) => {
      const decryptedMessage = CryptoJS.AES.decrypt(msg.message, SECRET_KEY).toString(CryptoJS.enc.Utf8);
      setMessages((prev) => [...prev, { senderId: msg.senderId, message: decryptedMessage }]);
    });

    return () => socket.off("receiveMessage");
  }, [chatId]);

  const sendMessage = () => {
    const encryptedMessage = CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
    socket.emit("sendMessage", { chatId, senderId: userId, receiverId: "otherUserId", message: encryptedMessage });
    setMessage("");
  };

  return (
    <div className="p-4 bg-gray-100 rounded-md shadow-md">
      <h3 className="text-lg font-semibold">Chat</h3>
      <div className="h-40 overflow-y-auto border p-2 bg-white">
        {messages.map((msg, index) => (
          <p key={index} className={`p-1 ${msg.senderId === userId ? "text-right" : "text-left"}`}>
            {msg.message}
          </p>
        ))}
      </div>
      <div className="flex mt-2">
        <input
          type="text"
          className="flex-grow p-2 border rounded-md"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="ml-2 bg-blue-500 text-white p-2 rounded-md" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
} 