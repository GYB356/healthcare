import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { socket } from '../utils/socket';
import { 
  joinChat, 
  sendMessage, 
  getChatMessages, 
  markMessagesAsRead,
  decryptMessage
} from '../utils/chat';

interface ChatProps {
  chatId: string;
  receiverId: string;
  receiverName: string;
}

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const Chat: React.FC<ChatProps> = ({ chatId, receiverId, receiverName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId) return;
      
      setLoading(true);
      try {
        const fetchedMessages = await getChatMessages(chatId);
        setMessages(fetchedMessages);
        
        // Mark messages as read
        if (user?.id) {
          await markMessagesAsRead(chatId, user.id);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMessages();
  }, [chatId, user?.id]);

  // Join chat room
  useEffect(() => {
    if (chatId) {
      joinChat(chatId);
    }
    
    // Listen for new messages
    socket.on('receiveMessage', (data) => {
      const { id, senderId, message, createdAt } = data;
      
      // Add new message to state
      setMessages(prev => [
        ...prev,
        {
          _id: id,
          senderId,
          receiverId: user?.id || '',
          message,
          createdAt,
          read: false
        }
      ]);
      
      // Mark message as read if it's for the current user
      if (user?.id && senderId !== user.id) {
        markMessagesAsRead(chatId, user.id);
      }
    });
    
    return () => {
      socket.off('receiveMessage');
    };
  }, [chatId, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user?.id || !chatId || !receiverId) return;
    
    sendMessage(chatId, user.id, receiverId, newMessage);
    setNewMessage('');
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="bg-blue-600 text-white p-4 flex items-center">
        <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center mr-3">
          {receiverName.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-lg font-semibold">{receiverName}</h2>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.senderId === user?.id;
            const decryptedMessage = decryptMessage(msg.message);
            
            return (
              <div 
                key={msg._id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                    isCurrentUser 
                      ? 'bg-blue-500 text-white rounded-br-none' 
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p>{decryptedMessage}</p>
                  <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatTime(msg.createdAt)}
                    {isCurrentUser && (
                      <span className="ml-2">
                        {msg.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg disabled:bg-blue-300"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat; 