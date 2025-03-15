import express from "express";
import Prescription from "../models/Prescription";
import { authenticate } from "../middleware/authMiddleware";
import { io, sendNotification, sendUserNotification } from "../server";

const router = express.Router();

// 📌 Create a prescription
router.post("/", authenticate, async (req, res) => {
  try {
    const { appointmentId, patientId, medications } = req.body;
    if (!appointmentId || !patientId || !medications) return res.status(400).json({ message: "Missing required fields" });

    const prescription = new Prescription({ appointmentId, patient: patientId, doctor: req.user.id, medications });
    await prescription.save();

    // Emit a real-time notification to the patient
    io.to(patientId).emit("newNotification", {
      type: "prescription",
      message: `New prescription created by Dr. ${req.user.name}.`,
      prescriptionId: prescription._id,
      timestamp: new Date()
    });

    res.json({ message: "Prescription created", prescription });
  } catch (err) {
    console.error("Error creating prescription:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Sign a prescription (Doctor Only)
router.put("/:id/sign", authenticate, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });

    if (prescription.doctor.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

    prescription.signedByDoctor = true;
    prescription.signature = `Signed by Dr. ${req.user.name} on ${new Date().toISOString()}`;
    await prescription.save();

    // Emit a real-time notification to the patient
    const patientId = prescription.patient.toString();
    io.to(patientId).emit("newNotification", {
      type: "prescription_signed",
      message: `Your prescription has been signed by Dr. ${req.user.name} and is ready to download.`,
      prescriptionId: prescription._id,
      timestamp: new Date()
    });

    res.json({ message: "Prescription signed", prescription });
  } catch (err) {
    console.error("Error signing prescription:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Get prescriptions for a patient
router.get("/patient/:patientId", authenticate, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.params.patientId }).populate("doctor", "name");
    res.json(prescriptions);
  } catch (err) {
    console.error("Error fetching patient prescriptions:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Get a single prescription by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id).populate("doctor", "name email");
    
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    
    // Check if user is authorized to view this prescription
    if (
      req.user.role !== "admin" && 
      prescription.doctor.toString() !== req.user.id && 
      prescription.patient.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Unauthorized to view this prescription" });
    }
    
    res.json(prescription);
  } catch (err) {
    console.error("Error fetching prescription:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 