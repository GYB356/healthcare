import express from "express";
import { protect } from "../middleware/auth";
import Message from "../models/Message";

const router = express.Router();

// Send a message
router.post("/send", protect, async (req, res) => {
  const { receiver, content } = req.body;

  if (!receiver || !content) return res.status(400).json({ message: "Missing fields" });

  const message = await Message.create({
    sender: req.user.id,
    receiver,
    content,
  });

  res.status(201).json(message);
});

// Fetch conversation
router.get("/:receiverId", protect, async (req, res) => {
  const { receiverId } = req.params;

  const messages = await Message.find({
    $or: [
      { sender: req.user.id, receiver: receiverId },
      { sender: receiverId, receiver: req.user.id },
    ],
  }).sort({ timestamp: 1 });

  res.json(messages);
});

export default router;
