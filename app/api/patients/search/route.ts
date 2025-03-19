import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "10")

    const patients = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } }
        ],
        role: "PATIENT"
      },
      select: {
        id: true,
        name: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        phone: true
      },
      take: limit,
      orderBy: {
        name: "asc"
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "SEARCH",
        userId: session.user.id,
        userRole: session.user.role,
        details: `Searched for patients with query: ${query}`
      }
    })

    return NextResponse.json(patients)
  } catch (error) {
    console.error("Error searching patients:", error)
    return NextResponse.json(
      { error: "Failed to search patients" },
      { status: 500 }
    )
  }
} 