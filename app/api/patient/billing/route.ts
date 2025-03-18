import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'patient') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const records = await prisma.billingRecord.findMany({
      where: {
        patientId: session.user.id,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching billing records:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 