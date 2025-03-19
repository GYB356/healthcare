import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const availability = await prisma.doctorAvailability.findMany({
      where: {
        doctorId: params.id,
      },
      orderBy: {
        dayOfWeek: "asc",
      },
    })

    return NextResponse.json(availability)
  } catch (error) {
    console.error("[DOCTOR_AVAILABILITY_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only admin or the doctor themselves can update availability
    if (
      session.user.role !== "ADMIN" &&
      session.user.id !== params.id
    ) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const { availability } = body

    // Validate availability data
    if (!Array.isArray(availability)) {
      return new NextResponse("Invalid availability data", { status: 400 })
    }

    // Validate each availability entry
    for (const slot of availability) {
      if (
        typeof slot.dayOfWeek !== "number" ||
        slot.dayOfWeek < 0 ||
        slot.dayOfWeek > 6 ||
        typeof slot.startTime !== "string" ||
        typeof slot.endTime !== "string" ||
        typeof slot.isAvailable !== "boolean"
      ) {
        return new NextResponse("Invalid availability data format", { status: 400 })
      }
    }

    // Update availability
    await prisma.$transaction([
      // Delete existing availability
      prisma.doctorAvailability.deleteMany({
        where: {
          doctorId: params.id,
        },
      }),
      // Create new availability
      prisma.doctorAvailability.createMany({
        data: availability.map((slot) => ({
          doctorId: params.id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
        })),
      }),
    ])

    const updatedAvailability = await prisma.doctorAvailability.findMany({
      where: {
        doctorId: params.id,
      },
      orderBy: {
        dayOfWeek: "asc",
      },
    })

    return NextResponse.json(updatedAvailability)
  } catch (error) {
    console.error("[DOCTOR_AVAILABILITY_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only admin or the doctor themselves can update availability
    if (
      session.user.role !== "ADMIN" &&
      session.user.id !== params.id
    ) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const { dayOfWeek, updates } = body

    if (
      typeof dayOfWeek !== "number" ||
      dayOfWeek < 0 ||
      dayOfWeek > 6 ||
      !updates
    ) {
      return new NextResponse("Invalid data", { status: 400 })
    }

    const availability = await prisma.doctorAvailability.upsert({
      where: {
        doctorId_dayOfWeek: {
          doctorId: params.id,
          dayOfWeek,
        },
      },
      update: updates,
      create: {
        doctorId: params.id,
        dayOfWeek,
        ...updates,
      },
    })

    return NextResponse.json(availability)
  } catch (error) {
    console.error("[DOCTOR_AVAILABILITY_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 