import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { getAllUsers, getAllPayouts, updatePayoutStatus } from "../controllers/adminController";

const router = express.Router();

router.get("/users", authMiddleware("ADMIN"), getAllUsers);
router.get("/payouts", authMiddleware("ADMIN"), getAllPayouts);
router.put("/payouts/:id", authMiddleware("ADMIN"), updatePayoutStatus);

export default router;
