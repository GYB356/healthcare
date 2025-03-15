import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/ChatList';
import Chat from '../components/Chat';
import { createChat } from '../utils/chat';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<{
    chatId: string;
    receiverId: string;
    receiverName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle chat selection
  const handleSelectChat = async (chatId: string, receiverId: string, receiverName: string) => {
    if (chatId === 'new' && user?.id) {
      try {
        // Create a new chat
        const newChat = await createChat(user.id, receiverId);
        setSelectedChat({
          chatId: newChat._id,
          receiverId,
          receiverName
        });
      } catch (error) {
        console.error('Error creating chat:', error);
      }
    } else {
      setSelectedChat({
        chatId,
        receiverId,
        receiverName
      });
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Please log in to access messages</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex h-full">
          {/* Chat List */}
          <div className="w-1/3 border-r">
            <ChatList 
              users={users}
              onSelectChat={handleSelectChat}
              selectedChatId={selectedChat?.chatId}
            />
          </div>
          
          {/* Chat Area */}
          <div className="w-2/3">
            {selectedChat ? (
              <Chat 
                chatId={selectedChat.chatId}
                receiverId={selectedChat.receiverId}
                receiverName={selectedChat.receiverName}
              />
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-xl mb-2">Select a conversation</p>
                  <p className="text-sm">Choose a chat from the list or start a new conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 