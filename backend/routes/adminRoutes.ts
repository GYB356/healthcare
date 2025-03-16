import express from "express";
import { getAllUsers, deleteUser } from "../controllers/adminController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Only ADMIN can manage users
router.get("/users", authMiddleware("ADMIN"), getAllUsers);
router.delete("/users/:id", authMiddleware("ADMIN"), deleteUser);

export default router;
