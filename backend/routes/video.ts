import express from "express";
import { generateVideoToken } from "../utils/twilioUtils";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

// 📌 Generate video token for a session
router.post("/join", authenticate, (req, res) => {
  const { room } = req.body;
  if (!room) return res.status(400).json({ message: "Room name required" });

  const token = generateVideoToken(req.user.email, room);
  res.json({ token, room });
});

export default router; 