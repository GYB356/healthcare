import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string;
      role: string;
    };

    if (decoded.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Get appointments for the patient
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: decoded.userId,
      },
      include: {
        doctor: {
          select: {
            name: true,
            department: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Format appointments
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      doctorName: appointment.doctor.name,
      department: appointment.doctor.department,
      date: appointment.date.toISOString().split('T')[0],
      time: appointment.time,
      status: appointment.status,
    }));

    return NextResponse.json({ appointments: formattedAppointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Error fetching appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = cookies().get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string;
      role: string;
    };

    if (decoded.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    const { doctorId, date, time } = await request.json();

    // Validate input
    if (!doctorId || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slot is available
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: new Date(date),
        time,
        status: 'SCHEDULED',
      },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 400 }
      );
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: decoded.userId,
        doctorId,
        date: new Date(date),
        time,
        status: 'SCHEDULED',
      },
      include: {
        doctor: {
          select: {
            name: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json({
      appointment: {
        id: appointment.id,
        doctorName: appointment.doctor.name,
        department: appointment.doctor.department,
        date: appointment.date.toISOString().split('T')[0],
        time: appointment.time,
        status: appointment.status,
      },
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Error creating appointment' },
      { status: 500 }
    );
  }
} 