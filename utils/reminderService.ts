import cron from "node-cron";
import prisma from "../lib/prisma";
import { sendAppointmentEmail } from "./emailService";

cron.schedule("0 * * * *", async () => {
  const now = new Date();
  now.setHours(now.getHours() + 1);

  const upcomingAppointments = await prisma.appointment.findMany({
    where: { date: now.toISOString().split("T")[0], time: now.toTimeString().slice(0, 5) },
    include: { user: true },
  });

  for (const appt of upcomingAppointments) {
    await sendAppointmentEmail(appt.user.email, appt.date, appt.time);
  }
});
