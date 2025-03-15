import { Request, Response } from "express";
import { hashPassword, comparePassword } from "./passwordUtils";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "./authUtils";
import { loginRateLimiter } from "./rateLimiter";
import { z } from "zod";
import User from "../models/User"; // Assuming a User model exists

// Define request validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Register New User
export async function register(req: Request, res: Response) {
  try {
    const { email, password } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Hash password and save user
    const hashedPassword = await hashPassword(password);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Invalid input data" });
  }
}

// Login User
export async function login(req: Request, res: Response) {
  try {
    loginRateLimiter(req, res, async () => {
      const { email, password } = loginSchema.parse(req.body);

      const user = await User.findOne({ email });
      if (!user || !(await comparePassword(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      return res.json({ accessToken, refreshToken });
    });
  } catch (error) {
    return res.status(400).json({ message: "Invalid input data" });
  }
}

// Refresh Token
export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(403).json({ message: "No refresh token provided" });

    const decoded = verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken(decoded.userId);

    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
} 