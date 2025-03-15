import express from "express";
import Appointment from "../models/Appointment";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware";

const router = express.Router();

// Create an appointment
router.post("/", authenticate, async (req, res) => {
  try {
    const { patientId, date, time, doctor, status } = req.body;
    const appointment = new Appointment({ patientId, date, time, doctor, status });
    await appointment.save();
    res.json({ message: "Appointment created", appointment });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all appointments
router.get("/all", authenticate, authorizeRoles(["admin"]), async (req, res) => {
  try {
    const appointments = await Appointment.find().populate("patient doctor");
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update appointment status
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ message: "Appointment updated", appointment });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an appointment
router.delete("/:id", authenticate, authorizeRoles(["admin"]), async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: "Appointment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 1️⃣ Book an appointment (Patient Only)
router.post("/book", authenticate, authorizeRoles(["patient"]), async (req, res) => {
  try {
    const { doctorId, date, notes } = req.body;
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date,
      notes,
      status: "pending",
    });

    res.status(201).json({ message: "Appointment request sent", appointment });
  } catch (error) {
    res.status(500).json({ message: "Error booking appointment" });
  }
});

// 📌 2️⃣ Get appointments (Doctor & Patient)
router.get("/", authenticate, async (req, res) => {
  try {
    let appointments;
    if (req.user.role === "doctor") {
      appointments = await Appointment.find({ doctor: req.user._id }).populate("patient");
    } else if (req.user.role === "patient") {
      appointments = await Appointment.find({ patient: req.user._id }).populate("doctor");
    } else if (req.user.role === "admin") {
      appointments = await Appointment.find().populate("patient doctor");
    }

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching appointments" });
  }
});

// 📌 3️⃣ Approve or Reject an Appointment (Doctor Only)
router.put("/:id/status", authenticate, authorizeRoles(["doctor"]), async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    appointment.status = status;
    await appointment.save();
    res.json({ message: `Appointment ${status}` });
  } catch (error) {
    res.status(500).json({ message: "Error updating appointment status" });
  }
});

export default router; 