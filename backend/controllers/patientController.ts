import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Get all patients (Admin Only)
export const getAllPatients = async (req: Request, res: Response) => {
  const patients = await prisma.patient.findMany();
  res.json(patients);
};

// Get all patients assigned to the logged-in doctor
export const getDoctorPatients = async (req: Request, res: Response) => {
  const doctorId = req.user?.id;

  const patients = await prisma.patient.findMany({
    where: { doctorId },
  });

  res.json(patients);
};

// Get a specific patient by ID (Doctor/Admin Only)
export const getPatientById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = req.user?.role;
  const userId = req.user?.id;

  const patient = await prisma.patient.findUnique({
    where: { id: Number(id) },
  });

  if (!patient) return res.status(404).json({ message: "Patient not found" });

  if (userRole === "DOCTOR" && patient.doctorId !== userId) {
    return res.status(403).json({ message: "Access denied" });
  }

  res.json(patient);
};

// Update patient details (Doctor/Admin Only)
export const updatePatient = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = req.user?.role;
  const userId = req.user?.id;

  const patient = await prisma.patient.findUnique({
    where: { id: Number(id) },
  });

  if (!patient) return res.status(404).json({ message: "Patient not found" });

  if (userRole === "DOCTOR" && patient.doctorId !== userId) {
    return res.status(403).json({ message: "Access denied" });
  }

  const updatedPatient = await prisma.patient.update({
    where: { id: Number(id) },
    data: req.body,
  });

  res.json(updatedPatient);
};
