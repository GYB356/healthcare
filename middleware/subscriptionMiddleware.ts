import { Request, Response, NextFunction } from "express";
import User from "../models/User";

export const checkSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.isSubscribed) {
      return res.status(403).json({ message: "Subscription required" });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Error checking subscription" });
  }
};
