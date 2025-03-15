import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

interface Chat {
  _id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
}

interface ChatListProps {
  users: User[];
  onSelectChat: (chatId: string, receiverId: string, receiverName: string) => void;
  selectedChatId?: string;
}

const ChatList: React.FC<ChatListProps> = ({ users, onSelectChat, selectedChatId }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user's chats
  useEffect(() => {
    const loadChats = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // For now, we'll use mock data since we don't have an endpoint to get all chats
        // In a real application, you would fetch this from an API
        setChats([]);
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadChats();
  }, [user?.id]);

  // Get the other participant's name
  const getReceiverName = (chat: Chat): string => {
    if (!user?.id) return 'Unknown';
    
    const receiverId = chat.participants.find(id => id !== user.id);
    if (!receiverId) return 'Unknown';
    
    const receiver = users.find(u => u.id === receiverId);
    return receiver?.name || 'Unknown User';
  };

  // Format the last message time
  const formatLastMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this week, show day name
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Start a new chat with a user
  const startNewChat = (receiverId: string, receiverName: string) => {
    // Find if there's an existing chat with this user
    const existingChat = chats.find(chat => 
      chat.participants.includes(receiverId) && 
      chat.participants.includes(user?.id || '')
    );
    
    if (existingChat) {
      onSelectChat(existingChat._id, receiverId, receiverName);
    } else {
      // Create a new chat (this will be handled in the parent component)
      onSelectChat('new', receiverId, receiverName);
    }
  };

  return (
    <div className="border-r h-full overflow-hidden flex flex-col">
      <div className="p-4 bg-blue-600 text-white">
        <h2 className="text-lg font-semibold">Messages</h2>
      </div>
      
      {/* New Message Button */}
      <div className="p-3 border-b">
        <div className="relative">
          <select 
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              const [receiverId, receiverName] = e.target.value.split('|');
              if (receiverId && receiverName) {
                startNewChat(receiverId, receiverName);
              }
            }}
            value=""
          >
            <option value="" disabled>Start a new conversation</option>
            {users
              .filter(u => u.id !== user?.id)
              .map(u => (
                <option key={u.id} value={`${u.id}|${u.name}`}>
                  {u.name}
                </option>
              ))
            }
          </select>
        </div>
      </div>
      
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <p>Loading chats...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No conversations yet</p>
            <p className="text-sm">Select a user to start chatting</p>
          </div>
        ) : (
          <div>
            {chats.map(chat => {
              const receiverId = chat.participants.find(id => id !== user?.id) || '';
              const receiverName = getReceiverName(chat);
              const isSelected = chat._id === selectedChatId;
              
              return (
                <div 
                  key={chat._id}
                  onClick={() => onSelectChat(chat._id, receiverId, receiverName)}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                      {receiverName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h3 className="font-medium truncate">{receiverName}</h3>
                        {chat.lastMessageTime && (
                          <span className="text-xs text-gray-500">
                            {formatLastMessageTime(chat.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList; 