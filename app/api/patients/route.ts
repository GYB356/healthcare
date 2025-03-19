import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only doctors can list all patients
    if (session.user.role !== "DOCTOR") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where = {
      role: "PATIENT",
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    }

    const [patients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          patientProfile: {
            select: {
              bloodType: true,
              allergies: true,
              medications: true,
              chronicConditions: true,
            },
          },
          emergencyContact: {
            select: {
              name: true,
              relationship: true,
              phone: true,
            },
          },
          insurance: {
            select: {
              provider: true,
              policyNumber: true,
              expirationDate: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      patients,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    })
  } catch (error) {
    console.error("[PATIENTS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Only doctors can create patient profiles
    if (session.user.role !== "DOCTOR") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      email,
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

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return new NextResponse("Email already registered", { status: 400 })
    }

    const patient = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        city,
        state,
        zipCode,
        role: "PATIENT",
        patientProfile: patientProfile
          ? {
              create: patientProfile,
            }
          : undefined,
        emergencyContact: emergencyContact
          ? {
              create: emergencyContact,
            }
          : undefined,
        insurance: insurance
          ? {
              create: {
                ...insurance,
                expirationDate: new Date(insurance.expirationDate),
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
    console.error("[PATIENTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 