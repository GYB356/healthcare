import express from "express";
import { Chat } from "../models/Chat";
import { Message } from "../models/Message";
import CryptoJS from "crypto-js";

const router = express.Router();
const SECRET_KEY = process.env.CHAT_SECRET || "supersecretkey";

// Create a new chat
router.post("/", async (req, res) => {
  const { user1, user2 } = req.body;
  let chat = await Chat.findOne({ participants: { $all: [user1, user2] } });

  if (!chat) {
    chat = new Chat({ participants: [user1, user2] });
    await chat.save();
  }

  res.json(chat);
});

// Get or create a test chat
router.get("/test/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    
    // Check if chat exists
    let chat = await Chat.findById(chatId);
    
    // If not, create it with the user as a participant
    if (!chat) {
      chat = new Chat({ 
        _id: chatId,
        participants: [userId, 'test-user'],
        lastMessage: 'Welcome to the test chat!',
        lastMessageTime: new Date()
      });
      await chat.save();
      
      // Add a welcome message
      const welcomeMessage = new Message({
        chatId,
        senderId: 'system',
        receiverId: userId,
        message: CryptoJS.AES.encrypt('Welcome to the test chat! This is an encrypted message.', SECRET_KEY).toString(),
        createdAt: new Date(),
        read: false
      });
      await welcomeMessage.save();
    }
    
    res.json(chat);
  } catch (error) {
    console.error("Error in test chat route:", error);
    res.status(500).json({ error: "Failed to get or create test chat" });
  }
});

// Get messages for a chat
router.get("/:chatId/messages", async (req, res) => {
  const { chatId } = req.params;
  const messages = await Message.find({ chatId });

  const decryptedMessages = messages.map((msg) => ({
    ...msg.toObject(),
    message: CryptoJS.AES.decrypt(msg.message, SECRET_KEY).toString(CryptoJS.enc.Utf8),
  }));

  res.json(decryptedMessages);
});

export default router; 