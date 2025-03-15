import { useEffect, useState } from "react";
import socket from "../utils/socket";
import CryptoJS from "crypto-js";

const SECRET_KEY = "supersecretkey"; // Store securely

export default function Chat({ chatId, userId }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load existing messages and join chat
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Join the chat room
    socket.emit("joinChat", chatId);
    
    // Initialize chat by fetching or creating it
    fetch(`/api/chat/test/${chatId}?userId=${userId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to initialize chat');
        }
        return response.json();
      })
      .then(() => {
        // Load existing messages
        return fetch(`/api/chat/${chatId}/messages`);
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load messages');
        }
        return response.json();
      })
      .then(data => {
        setMessages(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading chat:", err);
        setError(err.message);
        setLoading(false);
      });

    // Listen for new messages
    socket.on("receiveMessage", (msg) => {
      try {
        const decryptedMessage = CryptoJS.AES.decrypt(msg.message, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        setMessages((prev) => [...prev, { 
          senderId: msg.senderId, 
          message: decryptedMessage,
          createdAt: msg.createdAt || new Date()
        }]);
      } catch (error) {
        console.error("Error decrypting message:", error);
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [chatId, userId]);

  const sendMessage = () => {
    if (!message.trim()) return;
    
    try {
      const encryptedMessage = CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
      socket.emit("sendMessage", { 
        chatId, 
        senderId: userId, 
        receiverId: "test-user", // In a real app, this would be the other participant
        message: encryptedMessage 
      });
      
      // Optimistically add message to UI
      setMessages(prev => [...prev, { 
        senderId: userId, 
        message: message,
        createdAt: new Date(),
        pending: true
      }]);
      
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading chat...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`p-2 rounded-lg max-w-[80%] ${
                msg.senderId === userId 
                  ? "ml-auto bg-blue-500 text-white" 
                  : "mr-auto bg-gray-200 text-gray-800"
              } ${msg.pending ? "opacity-70" : ""}`}
            >
              <div>{msg.message}</div>
              <div className="text-xs opacity-70 text-right">
                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ""}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t p-2">
        <div className="flex">
          <textarea
            className="flex-grow p-2 border rounded-md"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={2}
          />
          <button 
            className="ml-2 bg-blue-500 text-white p-2 rounded-md self-end"
            onClick={sendMessage}
            disabled={!message.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}