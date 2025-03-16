import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getAnalyticsData = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalAppointments = await prisma.appointment.count();
    const totalRevenue = await prisma.payout.aggregate({
      _sum: { amount: true },
    });

    res.json({
      totalUsers,
      totalAppointments,
      totalRevenue: totalRevenue._sum.amount || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching analytics" });
  }
};
