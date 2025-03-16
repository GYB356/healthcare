import express from "express";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware";
import { getAllPatients, getPatientById, getDoctorPatients, updatePatient, createPatient } from "../controllers/patientController";

const router = express.Router();

// Admin can get all patients
router.get("/", verifyToken, authorizeRoles("ADMIN"), getAllPatients);

// Doctor can get their assigned patients
router.get("/doctor", verifyToken, authorizeRoles("DOCTOR"), getDoctorPatients);

// Doctor/Admin can get a specific patient
router.get("/:id", verifyToken, authorizeRoles("DOCTOR", "ADMIN"), getPatientById);

// Doctor/Admin can update patient details
router.put("/:id", verifyToken, authorizeRoles("DOCTOR", "ADMIN"), updatePatient);

// Only ADMIN can add new patients
router.post("/", verifyToken, authorizeRoles("ADMIN"), createPatient);

export default router;
