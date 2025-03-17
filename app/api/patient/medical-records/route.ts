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

    // Get medical records for the patient
    const records = await prisma.medicalRecord.findMany({
      where: {
        patientId: decoded.userId,
      },
      include: {
        doctor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Format records
    const formattedRecords = records.map(record => ({
      id: record.id,
      date: record.date.toISOString().split('T')[0],
      type: record.type,
      diagnosis: record.diagnosis,
      prescription: record.prescription,
      doctorName: record.doctor.name,
    }));

    return NextResponse.json({ records: formattedRecords });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    return NextResponse.json(
      { error: 'Error fetching medical records' },
      { status: 500 }
    );
  }
} 