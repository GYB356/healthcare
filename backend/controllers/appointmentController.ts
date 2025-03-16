import { Request, Response } from "express";
import prisma from "../lib/prisma";

// Patients book an appointment
export const bookAppointment = async (req: Request, res: Response) => {
  const { doctorId, date, reason } = req.body;
  const patientId = req.user?.id;

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      date: new Date(date),
      reason,
      status: "PENDING",
    },
  });

  res.status(201).json(appointment);
};

// Get all appointments (Admin only)
export const getAllAppointments = async (req: Request, res: Response) => {
  const appointments = await prisma.appointment.findMany();
  res.json(appointments);
};

// Get doctor's appointments
export const getDoctorAppointments = async (req: Request, res: Response) => {
  const doctorId = req.user?.id;
  
  const appointments = await prisma.appointment.findMany({
    where: { doctorId },
  });

  res.json(appointments);
};

// Get patient's appointments
export const getPatientAppointments = async (req: Request, res: Response) => {
  const patientId = req.user?.id;
  
  const appointments = await prisma.appointment.findMany({
    where: { patientId },
  });

  res.json(appointments);
};

// Doctors approve appointments
export const approveAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const doctorId = req.user?.id;

  const appointment = await prisma.appointment.findUnique({
    where: { id: Number(id) },
  });

  if (!appointment || appointment.doctorId !== doctorId) {
    return res.status(403).json({ message: "Access denied" });
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id: Number(id) },
    data: { status: "APPROVED" },
  });

  res.json(updatedAppointment);
};

// Doctors reject appointments
export const rejectAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const doctorId = req.user?.id;

  const appointment = await prisma.appointment.findUnique({
    where: { id: Number(id) },
  });

  if (!appointment || appointment.doctorId !== doctorId) {
    return res.status(403).json({ message: "Access denied" });
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id: Number(id) },
    data: { status: "REJECTED" },
  });

  res.json(updatedAppointment);
};
