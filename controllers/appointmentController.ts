import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { sendAppointmentEmail } from "../utils/emailService";
import { sendNotification } from "../server";

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { doctorId, date, time } = req.body;
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const appointment = await prisma.appointment.create({
      data: { userId, doctorId, date, time },
    });

    if (user) {
      await sendAppointmentEmail(user.email, date, time);
    }

    sendNotification(`New appointment booked for ${date} at ${time}`);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Error booking appointment" });
  }
};

export const getUserAppointments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const appointments = await prisma.appointment.findMany({ where: { userId } });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching appointments" });
  }
};

export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.appointment.delete({ where: { id: parseInt(id) } });

    res.json({ message: "Appointment canceled" });
  } catch (error) {
    res.status(500).json({ message: "Error canceling appointment" });
  }
};
