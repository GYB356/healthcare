import express from "express";
import { getDoctorDashboard, getPatientDashboard, getAdminDashboard } from "../controllers/dashboardController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Patients can access their dashboard
router.get("/patient", authMiddleware("USER"), getPatientDashboard);

// Doctors can access their dashboard
router.get("/doctor", authMiddleware("DOCTOR"), getDoctorDashboard);

// Only admins can access admin dashboard
router.get("/admin", authMiddleware("ADMIN"), getAdminDashboard);

export default router;
