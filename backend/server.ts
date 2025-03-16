import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from 'dotenv';
import CryptoJS from 'crypto-js';
import mongoose from 'mongoose';
import { errorMiddleware } from './utils/errorHandler';

// Regular imports
import appointmentRoutes from "./routes/appointments";
import videoRoutes from "./routes/video";
import prescriptionRoutes from "./routes/prescriptions";
import testRoutes from "./routes/test";
import chatRoutes from "./routes/chat";
import usersRoutes from "./routes/users";
import reportRoutes from "./routes/reports";
import { Message } from "./models/Message";
import { Chat } from "./models/Chat";
import Notification from "./models/Notification";

// Type safe imports, when TS files are available
// For routes that are still in JS, use "require" as a fallback
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Load environment variables
dotenv.config();

// Secret key for message encryption
const SECRET_KEY = process.env.CHAT_SECRET || "supersecretkey"; // Store securely

const app = express();
const server = createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// User connection tracking
const users: Record<string, { socketId: string; name: string }> = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User connection events
  socket.on("joinRoom", ({ userId, name }) => {
    users[userId] = { socketId: socket.id, name };
    io.emit("updateOnlineUsers", Object.values(users));
    console.log(`${name} joined with socket ID: ${socket.id}`);
  });

  // Video call events
  socket.on("callUser", ({ to, signalData, from }) => {
    if (users[to]) {
      io.to(users[to].socketId).emit("incomingCall", { signal: signalData, from });
    }
  });

  socket.on("answerCall", ({ to, signal }) => {
    if (users[to]) {
      io.to(users[to].socketId).emit("callAccepted", { signal });
    }
  });

  // Chat events
  socket.on("sendMessage", async ({ chatId, senderId, receiverId, message }) => {
    try {
      // Encrypt the message
      const encryptedMessage = CryptoJS.AES.encrypt(message, SECRET_KEY).toString();

      // Save message to database
      const newMessage = new Message({ 
        chatId, 
        senderId, 
        receiverId, 
        message: encryptedMessage 
      });
      await newMessage.save();

      // Update or create chat
      await Chat.findByIdAndUpdate(
        chatId,
        { 
          $set: { 
            lastMessage: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            lastMessageTime: new Date()
          },
          $setOnInsert: { participants: [senderId, receiverId] }
        },
        { upsert: true, new: true }
      );

      // Emit message to chat room
      io.to(chatId).emit("receiveMessage", { 
        id: newMessage._id,
        senderId, 
        message: encryptedMessage,
        createdAt: newMessage.createdAt
      });

      // Send notification to receiver if they're not in the chat
      io.to(receiverId).emit("notification", {
        type: "message",
        message: `You have a new message`,
        data: {
          chatId,
          senderId
        }
      });

      console.log(`Message sent in chat ${chatId}`);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

  // Other message and notification events
  socket.on("fetchMessages", async ({ userId, partnerId }) => {
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
    }).sort({ timestamp: 1 });

    socket.emit("messageHistory", messages);
  });

  socket.on("fetchNotifications", async ({ userId }) => {
    const notifications = await Notification.find({ userId, isRead: false });
    socket.emit("notifications", notifications);
  });

  socket.on("markNotificationsRead", async ({ userId }) => {
    await Notification.updateMany({ userId }, { $set: { isRead: true } });
  });

  // Room joining events
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  // Test events
  socket.on("test-notification", (data) => {
    const { userId, notification } = data;
    if (userId && notification) {
      io.to(userId).emit("notification", notification);
      console.log(`Test notification sent to user ${userId}:`, notification);
    }
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    Object.keys(users).forEach((key) => {
      if (users[key].socketId === socket.id) delete users[key];
    });
    io.emit("updateOnlineUsers", Object.values(users));
  });
});

// Express middleware
app.use(cors());
app.use(express.json());

// Register API routes
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/test", testRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", usersRoutes);

// Error handling middleware (must be after routes)
app.use(errorMiddleware);

// Helper functions for sending notifications
export const sendNotification = (message: string) => {
  io.emit("notification", message);
};

export const sendUserNotification = (userId: string, message: string) => {
  io.to(userId).emit("notification", message);
};

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roofing-tracker';

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define port
const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io, server, app };