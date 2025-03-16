import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Patient Dashboard
export const getPatientDashboard = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const appointments = await prisma.appointment.findMany({
    where: { patientId: userId },
  });

  res.json({ message: "Patient Dashboard", appointments });
};

// Doctor Dashboard
export const getDoctorDashboard = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const patients = await prisma.patient.findMany({
    where: { doctorId: userId },
  });

  res.json({ message: "Doctor Dashboard", patients });
};

// Admin Dashboard
export const getAdminDashboard = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.json({ message: "Admin Dashboard", users });
};
