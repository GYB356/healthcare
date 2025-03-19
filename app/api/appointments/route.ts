import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

const prismaClient = new PrismaClient()

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { date, time, doctorId, reason } = body

    // Validate required fields
    if (!date || !time || !doctorId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create appointment
    const appointment = await prismaClient.appointment.create({
      data: {
        date: new Date(date),
        time,
        patientId: session.user.id,
        doctorId,
        reason,
        status: 'SCHEDULED',
      },
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { patientId: session.user.id },
          { doctorId: session.user.id }
        ]
      },
      include: {
        patient: {
          select: {
            name: true,
            email: true
          }
        },
        doctor: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        date: "asc"
      }
    })

    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      date: apt.date.toISOString(),
      time: apt.time,
      patientName: apt.patient.name,
      patientEmail: apt.patient.email,
      doctorName: apt.doctor.name,
      reason: apt.reason,
      status: apt.status,
      notes: apt.notes
    }))

    return NextResponse.json(formattedAppointments)
  } catch (error) {
    console.error("[APPOINTMENTS_GET]", error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
} 