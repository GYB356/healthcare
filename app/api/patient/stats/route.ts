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

    // Get upcoming appointments count
    const upcomingAppointments = await prisma.appointment.count({
      where: {
        patientId: decoded.userId,
        date: {
          gte: new Date(),
        },
        status: 'SCHEDULED',
      },
    });

    // Get completed appointments count
    const completedAppointments = await prisma.appointment.count({
      where: {
        patientId: decoded.userId,
        status: 'COMPLETED',
      },
    });

    // Get active prescriptions count
    const prescriptions = await prisma.prescription.count({
      where: {
        patientId: decoded.userId,
        endDate: {
          gte: new Date(),
        },
      },
    });

    return NextResponse.json({
      upcomingAppointments,
      completedAppointments,
      prescriptions,
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    return NextResponse.json(
      { error: 'Error fetching patient stats' },
      { status: 500 }
    );
  }
} 