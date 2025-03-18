import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'staff') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const records = await prisma.billingRecord.findMany({
      where: {
        status: 'pending',
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching staff billing records:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 