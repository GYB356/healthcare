import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { Appointment } from '@prisma/client';

export async function GET() {
  try {
    // Get token from cookies
    const token = cookies().get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and get user ID
    const decoded = verify(token, process.env.JWT_SECRET!) as { id: string };
    const userId = decoded.id;

    // Get doctor's appointments for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: userId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        patient: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        time: 'asc',
      },
    });

    // Format appointments for response
    const formattedAppointments = appointments.map((appointment: Appointment & { patient: { name: string } }) => ({
      id: appointment.id,
      patientName: appointment.patient.name,
      date: appointment.date.toISOString().split('T')[0],
      time: appointment.time,
      status: appointment.status,
    }));

    return NextResponse.json({ appointments: formattedAppointments });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 