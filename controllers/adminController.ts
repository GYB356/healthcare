import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Get All Users
export const getAllUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
  });
  res.json(users);
};

// Get All Payout Requests
export const getAllPayouts = async (req: Request, res: Response) => {
  const payouts = await prisma.payout.findMany({
    include: { doctor: { select: { name: true, email: true } } },
  });
  res.json(payouts);
};

// Approve or Reject Payout
export const updatePayoutStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // APPROVED or REJECTED

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  await prisma.payout.update({
    where: { id: Number(id) },
    data: { status },
  });

  res.json({ message: `Payout ${status.toLowerCase()} successfully` });
};
