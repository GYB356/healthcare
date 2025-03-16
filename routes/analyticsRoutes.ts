import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { getAnalyticsData } from "../controllers/analyticsController";

const router = express.Router();

router.get("/", authMiddleware("ADMIN"), getAnalyticsData);

export default router;
