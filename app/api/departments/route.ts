import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Error fetching departments' },
      { status: 500 }
    );
  }
} 