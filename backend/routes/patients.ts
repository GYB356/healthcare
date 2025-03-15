import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import Patient from "../models/Patient";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const patients = await Patient.find({
      name: { $regex: searchQuery, $options: "i" },
    }).limit(10);

    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 