import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  createAppointment,
  getUserAppointments,
  cancelAppointment,
} from "../controllers/appointmentController";

const router = express.Router();

router.post("/", authMiddleware("USER"), createAppointment);
router.get("/", authMiddleware(), getUserAppointments);
router.delete("/:id", authMiddleware("USER"), cancelAppointment);

export default router;
