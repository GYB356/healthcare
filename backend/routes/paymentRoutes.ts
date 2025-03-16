import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  createCheckoutSession,
  verifyPayment,
  getUserPayments,
} from "../controllers/paymentController";

const router = express.Router();

router.post("/checkout", authMiddleware("USER"), createCheckoutSession);
router.get("/success", authMiddleware("USER"), verifyPayment);
router.get("/history", authMiddleware("USER"), getUserPayments);

export default router;
