import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { patientId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Patients can only view their own profile
    if (session.user.role === "PATIENT" && session.user.id !== params.patientId) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const patient = await prisma.user.findUnique({
      where: {
        id: params.patientId,
        role: "PATIENT",
      },
      include: {
        patientProfile: true,
        emergencyContact: true,
        insurance: true,
        patientAppointments: {
          include: {
            doctor: {
              select: {
                name: true,
                doctorProfile: {
                  select: {
                    specialization: true,
                  },
                },
              },
            },
          },
          orderBy: {
            date: "desc",
          },
          take: 5,
        },
        patientMedicalRecords: {
          include: {
            doctor: {
              select: {
                name: true,
                doctorProfile: {
                  select: {
                    specialization: true,
                  },
                },
              },
            },
          },
          orderBy: {
            date: "desc",
          },
          take: 5,
        },
      },
    })

    if (!patient) {
      return new NextResponse("Patient not found", { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error("[PATIENT_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { patientId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only doctors or the patient themselves can update the profile
    if (
      session.user.role !== "DOCTOR" &&
      session.user.id !== params.patientId
    ) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      zipCode,
      patientProfile,
      emergencyContact,
      insurance,
    } = body

    const patient = await prisma.user.update({
      where: {
        id: params.patientId,
        role: "PATIENT",
      },
      data: {
        name,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        city,
        state,
        zipCode,
        patientProfile: patientProfile
          ? {
              upsert: {
                create: patientProfile,
                update: patientProfile,
              },
            }
          : undefined,
        emergencyContact: emergencyContact
          ? {
              upsert: {
                create: emergencyContact,
                update: emergencyContact,
              },
            }
          : undefined,
        insurance: insurance
          ? {
              upsert: {
                create: {
                  ...insurance,
                  expirationDate: new Date(insurance.expirationDate),
                },
                update: {
                  ...insurance,
                  expirationDate: new Date(insurance.expirationDate),
                },
              },
            }
          : undefined,
      },
      include: {
        patientProfile: true,
        emergencyContact: true,
        insurance: true,
      },
    })

    return NextResponse.json(patient)
  } catch (error) {
    console.error("[PATIENT_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { patientId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only doctors can delete patient profiles
    if (session.user.role !== "DOCTOR") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    await prisma.user.delete({
      where: {
        id: params.patientId,
        role: "PATIENT",
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[PATIENT_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 