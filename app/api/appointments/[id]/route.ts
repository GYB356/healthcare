import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const appointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  date: z.string(),
  time: z.string(),
  reason: z.string().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      doctor: true,
    },
  })

  if (!appointment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(appointment)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = appointmentSchema.partial().parse(body)

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json(appointment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await prisma.appointment.delete({
      where: { id: params.id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
} 