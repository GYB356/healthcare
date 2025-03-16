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
import Notification from "./models/Notification";

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

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const users = {}; // Store connected users

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", ({ userId, name }) => {
    users[userId] = { socketId: socket.id, name };
    io.emit("updateOnlineUsers", Object.values(users));
    console.log(`${name} joined with socket ID: ${socket.id}`);
  });

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

  socket.on("sendMessage", async ({ senderId, receiverId, text }) => {
    const message = new Message({ senderId, receiverId, text });
    await message.save();

    const notification = new Notification({
      userId: receiverId,
      message: `New message from ${senderId}`,
    });
    await notification.save();

    io.to(users[receiverId]?.socketId).emit("receiveMessage", { senderId, text });
    io.to(users[receiverId]?.socketId).emit("newNotification", notification);
  });

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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    Object.keys(users).forEach((key) => {
      if (users[key].socketId === socket.id) delete users[key];
    });
    io.emit("updateOnlineUsers", Object.values(users));
  });

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