import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function POST(
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

    // Get request body
    const body = await request.json();
    const { diagnosis, prescription, notes } = body;

    if (!diagnosis || !prescription) {
      return NextResponse.json(
        { error: 'Diagnosis and prescription are required' },
        { status: 400 }
      );
    }

    // Get appointment and verify doctor's access
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.appointmentId,
        doctorId: userId,
        status: 'SCHEDULED',
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found or already completed' },
        { status: 404 }
      );
    }

    // Create medical record and update appointment status in a transaction
    const result = await prisma.$transaction([
      // Create medical record
      prisma.medicalRecord.create({
        data: {
          patientId: appointment.patientId,
          doctorId: userId,
          appointmentId: appointment.id,
          diagnosis,
          prescription,
          notes: notes || '',
        },
      }),
      // Update appointment status
      prisma.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          status: 'COMPLETED',
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Consultation completed successfully',
      medicalRecord: result[0],
    });
  } catch (error) {
    console.error('Error completing consultation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}