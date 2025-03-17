import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { User, Appointment } from '@prisma/client';

interface PatientWithAppointments extends User {
  appointments: {
    date: Date;
    time: string;
  }[];
  _count: {
    appointments: number;
  };
}

interface UpcomingAppointment {
  patientId: string;
  date: Date;
  time: string;
}

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

    // Get doctor's recent patients with their last visit and next appointment
    const patients = await prisma.user.findMany({
      where: {
        appointments: {
          some: {
            doctorId: userId,
          },
        },
        role: 'PATIENT',
      },
      select: {
        id: true,
        name: true,
        appointments: {
          orderBy: {
            date: 'desc',
          },
          take: 1,
          select: {
            date: true,
            time: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: {
        appointments: {
          _count: 'desc',
        },
      },
      take: 10, // Limit to 10 most recent patients
    });

    // Format patients for response
    const formattedPatients = patients.map((patient: PatientWithAppointments) => {
      const lastAppointment = patient.appointments[0];
      return {
        id: patient.id,
        name: patient.name,
        lastVisit: lastAppointment ? 
          `${lastAppointment.date.toISOString().split('T')[0]} ${lastAppointment.time}` : 
          null,
        totalVisits: patient._count.appointments,
        upcomingAppointment: null, // We'll fetch this separately
      };
    });

    // Get upcoming appointments for these patients
    const patientIds = patients.map((p: PatientWithAppointments) => p.id);
    const now = new Date();
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: userId,
        patientId: {
          in: patientIds,
        },
        date: {
          gte: now,
        },
        status: 'SCHEDULED',
      },
      select: {
        patientId: true,
        date: true,
        time: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Add upcoming appointments to the formatted patients
    const upcomingByPatient = upcomingAppointments.reduce((acc: Record<string, string>, apt: UpcomingAppointment) => {
      if (!acc[apt.patientId]) {
        acc[apt.patientId] = `${apt.date.toISOString().split('T')[0]} ${apt.time}`;
      }
      return acc;
    }, {} as Record<string, string>);

    formattedPatients.forEach((patient: { id: string; upcomingAppointment: string | null }) => {
      patient.upcomingAppointment = upcomingByPatient[patient.id] || null;
    });

    return NextResponse.json({ patients: formattedPatients });
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 