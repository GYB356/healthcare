import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  bookAppointment,
  getAllAppointments,
  getDoctorAppointments,
  getPatientAppointments,
  approveAppointment,
  rejectAppointment,
} from "../controllers/appointmentController";

const router = express.Router();

// Patients can book appointments
router.post("/", authMiddleware("USER"), bookAppointment);

// Admin can view all appointments
router.get("/", authMiddleware("ADMIN"), getAllAppointments);

// Doctors can view their appointments
router.get("/doctor", authMiddleware("DOCTOR"), getDoctorAppointments);

// Patients can view their appointments
router.get("/patient", authMiddleware("USER"), getPatientAppointments);

// Doctors can approve or reject appointments
router.put("/:id/approve", authMiddleware("DOCTOR"), approveAppointment);
router.put("/:id/reject", authMiddleware("DOCTOR"), rejectAppointment);

export default router;
