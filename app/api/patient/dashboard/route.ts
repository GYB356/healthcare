import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { db } from '@/lib/db';
import { createAuditLog, verifyPatientAccess } from '@/lib/hipaa';
import { AuditAction, ResourceType, AuditSeverity, AuditStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { id: userId, patientId, role } = session.user;

    if (role !== 'PATIENT' || !patientId) {
      return new NextResponse(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403 }
      );
    }

    // Verify access and create audit log
    const hasAccess = await verifyPatientAccess(userId, patientId);
    
    if (!hasAccess) {
      await createAuditLog({
        userId,
        action: AuditAction.ACCESS_ATTEMPT,
        resourceType: ResourceType.PATIENT,
        resourceId: patientId,
        details: 'Unauthorized attempt to access patient dashboard data',
        severity: AuditSeverity.HIGH,
        status: AuditStatus.FAILURE,
        sessionId: session.sessionId,
        ipAddress: req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for'),
        userAgent: req.headers.get('user-agent'),
      });

      return new NextResponse(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403 }
      );
    }

    // Fetch patient data
    const patient = await db.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        appointments: {
          where: {
            startTime: {
              gte: new Date(),
            },
          },
          orderBy: {
            startTime: 'asc',
          },
          take: 5,
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        medicalRecords: {
          orderBy: {
            date: 'desc',
          },
          take: 5,
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!patient) {
      return new NextResponse(
        JSON.stringify({ error: 'Patient not found' }),
        { status: 404 }
      );
    }

    // Log successful data access
    await createAuditLog({
      userId,
      action: AuditAction.VIEW,
      resourceType: ResourceType.PATIENT,
      resourceId: patientId,
      details: 'Patient dashboard data accessed',
      severity: AuditSeverity.LOW,
      status: AuditStatus.SUCCESS,
      sessionId: session.sessionId,
      ipAddress: req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
    });

    // Transform data for client
    const dashboardData = {
      name: patient.user.name,
      dateOfBirth: patient.dateOfBirth,
      upcomingAppointments: patient.appointments.map(apt => ({
        id: apt.id,
        providerId: apt.providerId,
        providerName: apt.provider.user.name,
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status,
      })),
      recentAppointments: patient.appointments
        .filter(apt => apt.startTime < new Date())
        .map(apt => ({
          id: apt.id,
          providerId: apt.providerId,
          providerName: apt.provider.user.name,
          startTime: apt.startTime,
          endTime: apt.endTime,
          status: apt.status,
        })),
      medications: [], // Fetch from medical records or separate medications table
      unreadMessages: 0, // Implement message count query
      pendingBills: 0, // Implement billing count query
    };

    return new NextResponse(
      JSON.stringify(dashboardData),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch patient dashboard data:', error);
    
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
} 