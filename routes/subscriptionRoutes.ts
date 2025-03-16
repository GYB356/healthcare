import express from "express";
import { createSubscription, getSubscriptionStatus, cancelSubscription } from "../controllers/subscriptionController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/subscribe", authMiddleware, createSubscription);
router.get("/status", authMiddleware, getSubscriptionStatus);
router.post("/cancel", authMiddleware, cancelSubscription);

export default router;
