import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from 'dotenv';
import appointmentRoutes from "./routes/appointments";
import videoRoutes from "./routes/video";
import mongoose from 'mongoose';

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

// WebSocket Connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Emit Notification
export const sendNotification = (message: string) => {
  io.emit("notification", message);
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

export default app; 