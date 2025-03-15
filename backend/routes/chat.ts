import express from 'express';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import CryptoJS from 'crypto-js';

const router = express.Router();

// Secret key for message decryption (should match the one in server.ts)
const SECRET_KEY = process.env.CHAT_SECRET || "supersecretkey";

// Get all chats for a user
router.get('/chats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find all chats where the user is a participant
    const chats = await Chat.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .lean();
    
    return res.status(200).json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get or create a chat between two users
router.post('/chat', async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;
    
    if (!userId1 || !userId2) {
      return res.status(400).json({ error: 'Both user IDs are required' });
    }
    
    // Sort participants to ensure consistent chat IDs
    const participants = [userId1, userId2].sort();
    
    // Find existing chat or create a new one
    let chat = await Chat.findOne({ participants: { $all: participants } });
    
    if (!chat) {
      chat = await Chat.create({
        participants,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return res.status(200).json(chat);
  } catch (error) {
    console.error('Error creating/fetching chat:', error);
    return res.status(500).json({ error: 'Failed to create/fetch chat' });
  }
});

// Get messages for a specific chat
router.get('/messages/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;
    
    // Build query
    const query: any = { chatId };
    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }
    
    // Find messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
    
    // Decrypt messages
    const decryptedMessages = messages.map(msg => {
      try {
        const decrypted = CryptoJS.AES.decrypt(msg.message, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        return {
          ...msg,
          message: decrypted
        };
      } catch (error) {
        console.error('Error decrypting message:', error);
        return {
          ...msg,
          message: '[Encrypted Message]'
        };
      }
    });
    
    return res.status(200).json(decryptedMessages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark messages as read
router.put('/messages/read', async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    
    if (!chatId || !userId) {
      return res.status(400).json({ error: 'Chat ID and user ID are required' });
    }
    
    // Mark all messages as read where the user is the receiver
    await Message.updateMany(
      { chatId, receiverId: userId, read: false },
      { $set: { read: true } }
    );
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router; 