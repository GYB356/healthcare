import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

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

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's appointments count
    const todayAppointments = await prisma.appointment.count({
      where: {
        doctorId: userId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get total unique patients count
    const totalPatients = await prisma.user.count({
      where: {
        appointments: {
          some: {
            doctorId: userId,
          },
        },
        role: 'PATIENT',
      },
    });

    // Get pending reports count (appointments completed but no medical record)
    const pendingReports = await prisma.appointment.count({
      where: {
        doctorId: userId,
        status: 'COMPLETED',
        medicalRecord: null,
      },
    });

    return NextResponse.json({
      todayAppointments,
      totalPatients,
      pendingReports,
    });
  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 