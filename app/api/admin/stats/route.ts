import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch all stats in parallel
    const [
      totalProjects,
      activeProjects,
      totalEstimates,
      totalClients,
      totalUsers,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({
        where: { status: 'in-progress' },
      }),
      prisma.estimate.count(),
      prisma.client.count(),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      totalProjects,
      activeProjects,
      totalEstimates,
      totalClients,
      totalUsers,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
} 