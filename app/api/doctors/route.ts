import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('department');

    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        departmentId: departmentId || undefined,
      },
      select: {
        id: true,
        name: true,
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      doctors: doctors.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        department: doctor.department?.name || 'Unassigned',
      })),
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { error: 'Error fetching doctors' },
      { status: 500 }
    );
  }
} 