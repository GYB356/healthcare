import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { appointmentId: string } }
) {
  try {
    // Get token from cookies
    const token = cookies().get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and get user ID
    const decoded = verify(token, process.env.JWT_SECRET!) as { id: string };
    const userId = decoded.id;

    // Get appointment details
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.appointmentId,
        doctorId: userId,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Format appointment for response
    const formattedAppointment = {
      id: appointment.id,
      patientId: appointment.patient.id,
      patientName: appointment.patient.name,
      date: appointment.date.toISOString().split('T')[0],
      time: appointment.time,
      status: appointment.status,
    };

    return NextResponse.json({ appointment: formattedAppointment });
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 