import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Get Doctor Earnings
export const getDoctorEarnings = async (req: Request, res: Response) => {
  const doctorId = req.user?.id;

  const earnings = await prisma.payment.findMany({
    where: { doctorId },
  });

  const totalEarnings = earnings.reduce((sum, payment) => sum + payment.amount, 0);

  res.json({ totalEarnings, payments: earnings });
};

// Request Payout
export const requestPayout = async (req: Request, res: Response) => {
  const doctorId = req.user?.id;
  const { amount } = req.body;

  const totalEarnings = await prisma.payment.aggregate({
    where: { doctorId },
    _sum: { amount: true },
  });

  if (amount > totalEarnings._sum.amount) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  await prisma.payout.create({
    data: { doctorId, amount },
  });

  res.json({ message: "Payout requested successfully" });
};
