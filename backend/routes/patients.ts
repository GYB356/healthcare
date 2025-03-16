import express from "express";
import { protect, authorize } from "../middleware/auth";
import Patient from "../models/Patient";

const router = express.Router();

router.get("/", protect, authorize("admin", "doctor"), async (req, res) => {
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

router.get("/all", protect, authorize("doctor", "admin"), async (req, res) => {
  const patients = await User.find({ role: "patient" });
  res.json(patients);
});

export default router;