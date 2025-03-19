import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession()

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      appointmentsByStatus,
      recentActivity
    ] = await Promise.all([
      // Get total patients
      prisma.user.count({
        where: { role: "PATIENT" }
      }),
      // Get total doctors
      prisma.user.count({
        where: { role: "DOCTOR" }
      }),
      // Get total appointments
      prisma.appointment.count(),
      // Get appointments by status
      prisma.appointment.groupBy({
        by: ['status'],
        _count: true
      }),
      // Get recent activity from audit logs
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              role: true
            }
          }
        }
      })
    ])

    // Transform appointment status counts
    const statusCounts = appointmentsByStatus.reduce((acc, curr) => {
      acc[curr.status.toLowerCase()] = curr._count
      return acc
    }, {} as Record<string, number>)

    // Transform recent activity
    const formattedActivity = recentActivity.map(log => ({
      id: log.id,
      type: log.action,
      description: `${log.user.name || 'User'} (${log.user.role.toLowerCase()}) ${log.action.toLowerCase()}d a ${log.entityType.toLowerCase().replace('_', ' ')}`,
      date: log.createdAt.toLocaleString()
    }))

    return NextResponse.json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      appointmentsByStatus: {
        scheduled: statusCounts['scheduled'] || 0,
        completed: statusCounts['completed'] || 0,
        cancelled: statusCounts['cancelled'] || 0
      },
      recentActivity: formattedActivity
    })
  } catch (error) {
    console.error('Analytics Error:', error)
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    )
  }
} 