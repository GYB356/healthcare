import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import Patient from "../models/Patient";
import Appointment from "../models/Appointment";
import Claim from "../models/Claim";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const pendingClaims = await Claim.countDocuments({ status: "pending" });

    res.json({ totalPatients, totalAppointments, pendingClaims });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 