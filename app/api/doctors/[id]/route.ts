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

    const doctor = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: "DOCTOR",
      },
      include: {
        doctorProfile: true,
        availability: {
          orderBy: {
            dayOfWeek: "asc",
          },
        },
        doctorAppointments: {
          where: {
            date: {
              gte: new Date(),
            },
          },
          include: {
            patient: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            date: "asc",
          },
          take: 10,
        },
      },
    })

    if (!doctor) {
      return new NextResponse("Doctor not found", { status: 404 })
    }

    return NextResponse.json(doctor)
  } catch (error) {
    console.error("[DOCTOR_GET]", error)
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

    // Only admin or the doctor themselves can update the profile
    if (
      session.user.role !== "ADMIN" &&
      session.user.id !== params.id
    ) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      phone,
      image,
      address,
      city,
      state,
      zipCode,
      doctorProfile,
      availability,
    } = body

    const doctor = await prisma.user.update({
      where: {
        id: params.id,
        role: "DOCTOR",
      },
      data: {
        name,
        phone,
        image,
        address,
        city,
        state,
        zipCode,
        doctorProfile: doctorProfile
          ? {
              upsert: {
                create: doctorProfile,
                update: doctorProfile,
              },
            }
          : undefined,
        availability: availability
          ? {
              deleteMany: {},
              createMany: {
                data: availability,
              },
            }
          : undefined,
      },
      include: {
        doctorProfile: true,
        availability: {
          orderBy: {
            dayOfWeek: "asc",
          },
        },
      },
    })

    return NextResponse.json(doctor)
  } catch (error) {
    console.error("[DOCTOR_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only admin can delete doctor profiles
    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    await prisma.user.delete({
      where: {
        id: params.id,
        role: "DOCTOR",
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DOCTOR_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 