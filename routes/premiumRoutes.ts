import express from "express";
import { checkSubscription } from "../middleware/subscriptionMiddleware";
import { getPremiumData } from "../controllers/premiumController";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

router.get("/data", authMiddleware, checkSubscription, getPremiumData);

export default router;
