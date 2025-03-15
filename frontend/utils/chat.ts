import socket from './socket';
import CryptoJS from 'crypto-js';

// Secret key for message encryption/decryption (should match the one in server)
const SECRET_KEY = process.env.NEXT_PUBLIC_CHAT_SECRET || "supersecretkey";

// Join a chat room
export const joinChat = (chatId: string): void => {
  if (socket && chatId) {
    socket.emit('joinChat', chatId);
    console.log(`Joined chat: ${chatId}`);
  }
};

// Send a message
export const sendMessage = (
  chatId: string,
  senderId: string,
  receiverId: string,
  message: string
): void => {
  if (!socket || !chatId || !senderId || !receiverId || !message) {
    console.error('Missing required parameters for sending message');
    return;
  }

  socket.emit('sendMessage', {
    chatId,
    senderId,
    receiverId,
    message
  });
};

// Encrypt a message (client-side encryption for extra security)
export const encryptMessage = (message: string): string => {
  return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
};

// Decrypt a message
export const decryptMessage = (encryptedMessage: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting message:', error);
    return '[Encrypted Message]';
  }
};

// Create a new chat between two users
export const createChat = async (user1: string, user2: string): Promise<any> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user1, user2 }),
    });

    if (!response.ok) {
      throw new Error('Failed to create chat');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

// Get messages for a chat
export const getChatMessages = async (chatId: string): Promise<any[]> => {
  try {
    const response = await fetch(`/api/chat/${chatId}/messages`);

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

// Get or create a chat between two users
export const getOrCreateChat = async (userId1: string, userId2: string): Promise<any> => {
  try {
    const response = await fetch('/api/chat/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId1, userId2 }),
    });

    if (!response.ok) {
      throw new Error('Failed to get or create chat');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting or creating chat:', error);
    throw error;
  }
};

// Get all chats for a user
export const getUserChats = async (userId: string): Promise<any[]> => {
  try {
    const response = await fetch(`/api/chat/chats/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch chats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching chats:', error);
    return [];
  }
};

// Mark messages as read
export const markMessagesAsRead = async (chatId: string, userId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/chat/messages/read', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatId, userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to mark messages as read');
    }

    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }
}; 