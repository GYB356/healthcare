import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q") || ""
  const specialization = searchParams.get("specialization")
  const limit = parseInt(searchParams.get("limit") || "10")

  const doctors = await prisma.user.findMany({
    where: {
      role: "DOCTOR",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
      doctorProfile: specialization
        ? { specialization: { equals: specialization } }
        : undefined,
    },
    include: {
      doctorProfile: true,
    },
    take: limit,
  })

  return NextResponse.json(doctors)
} 