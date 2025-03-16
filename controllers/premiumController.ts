import { Request, Response } from "express";

export const getPremiumData = async (req: Request, res: Response) => {
  res.json({ message: "Welcome to premium content!" });
};
