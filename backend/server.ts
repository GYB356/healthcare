import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from 'dotenv';
import CryptoJS from 'crypto-js';
import appointmentRoutes from "./routes/appointments";
import videoRoutes from "./routes/video";
import prescriptionRoutes from "./routes/prescriptions";
import mongoose from 'mongoose';
import testRoutes from "./routes/test";
import chatRoutes from "./routes/chat";
import usersRoutes from "./routes/users";
import { Message } from "./models/Message";
import { Chat } from "./models/Chat";

// Use type assertions to bypass TypeScript errors
// @ts-ignore
import authRoutes from './routes/authRoutes';
// @ts-ignore
import projectRoutes from './routes/projectRoutes';
// @ts-ignore
import aiRoutes from './routes/aiRoutes';
// @ts-ignore
import reportRoutes from './routes/reports';

// Load environment variables
dotenv.config();

// Secret key for message encryption
const SECRET_KEY = process.env.CHAT_SECRET || "supersecretkey"; // Store securely

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

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

// WebSocket Connection
io.on("connection", (socket) => {
  console.log(`🔵 User connected: ${socket.id}`);

  // Join user-specific room for notifications
  socket.on("joinRoom", (userId) => {
    socket.join(userId); // Join a room based on the user's ID
    console.log(`User joined room: ${userId}`);
  });

  // Join chat room
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  // Handle sending messages
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

  // Handle test notifications from client
  socket.on("test-notification", (data) => {
    const { userId, notification } = data;
    if (userId && notification) {
      io.to(userId).emit("notification", notification);
      console.log(`Test notification sent to user ${userId}:`, notification);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
  });
});

// Emit Notification to all users
export const sendNotification = (message: string) => {
  io.emit("notification", message);
};

// Emit Notification to a specific user
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