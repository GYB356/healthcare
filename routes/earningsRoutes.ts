import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  getDoctorEarnings,
  requestPayout,
} from "../controllers/earningsController";

const router = express.Router();

router.get("/", authMiddleware("DOCTOR"), getDoctorEarnings);
router.post("/payout", authMiddleware("DOCTOR"), requestPayout);

export default router;
