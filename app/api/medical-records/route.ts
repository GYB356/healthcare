import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import {
  MedicalRecord,
  MedicalRecordFilters,
  PaginatedResponse,
  RecordType,
  AttachmentUpload
} from "@/types/medical-records"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export async function GET(
  request: NextRequest
): Promise<NextResponse<PaginatedResponse<MedicalRecord>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" } as any,
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const filters: MedicalRecordFilters = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") as RecordType | undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      patientId: searchParams.get("patientId") || undefined,
    }

    // Calculate skip for pagination
    const skip = (filters.page! - 1) * filters.limit!

    // Build where clause based on filters
    const where = {
      AND: [
        // Search in description or patient name
        filters.search
          ? {
              OR: [
                { description: { contains: filters.search, mode: "insensitive" } },
                { patient: { name: { contains: filters.search, mode: "insensitive" } } }
              ]
            }
          : {},
        // Filter by type if provided
        filters.type ? { type: filters.type } : {},
        // Filter by date range if provided
        filters.startDate && filters.endDate
          ? {
              date: {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate)
              }
            }
          : {},
        // Filter by patient if provided
        filters.patientId ? { patientId: filters.patientId } : {},
        // Role-based access control
        session.user.role === "PATIENT"
          ? { patientId: session.user.id }
          : session.user.role === "DOCTOR"
          ? { doctorId: session.user.id }
          : {}
      ]
    }

    // Get total count for pagination
    const total = await prisma.medicalRecord.count({ where })

    // Get records with pagination
    const records = await prisma.medicalRecord.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            gender: true,
            email: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            email: true
          }
        },
        attachments: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
            createdAt: true
          }
        }
      },
      orderBy: { date: "desc" },
      skip,
      take: filters.limit
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: "VIEW",
        entityType: "MEDICAL_RECORD",
        entityId: "MULTIPLE",
        userId: session.user.id,
        userRole: session.user.role,
        details: `Viewed medical records list with filters: ${JSON.stringify(filters)}`
      }
    })

    return NextResponse.json({
      data: records,
      pagination: {
        total,
        pages: Math.ceil(total / filters.limit!),
        page: filters.page!,
        limit: filters.limit!
      }
    })
  } catch (error) {
    console.error("Error fetching medical records:", error)
    return NextResponse.json(
      { error: "Failed to fetch medical records" } as any,
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<MedicalRecord>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Unauthorized" } as any,
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const patientId = formData.get("patientId") as string
    const type = formData.get("type") as RecordType
    const date = formData.get("date") as string
    const description = formData.get("description") as string
    const attachmentFiles = formData.getAll("attachments") as File[]

    if (!patientId || !type || !date || !description) {
      return NextResponse.json(
        { error: "Missing required fields" } as any,
        { status: 400 }
      )
    }

    // Validate file sizes and types
    for (const file of attachmentFiles) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
          } as any,
          { status: 400 }
        )
      }

      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not accepted` } as any,
          { status: 400 }
        )
      }
    }

    // Upload attachments
    const attachmentPromises = attachmentFiles.map(async (file) => {
      const blob = await put(file.name, file, {
        access: 'private',
      })

      return {
        name: file.name,
        type: file.type,
        url: blob.url,
      }
    })

    const attachments = await Promise.all(attachmentPromises)

    // Create medical record
    const record = await prisma.medicalRecord.create({
      data: {
        patientId,
        doctorId: session.user.id,
        type,
        date: new Date(date),
        description,
        attachments: {
          create: attachments.map(attachment => ({
            name: attachment.name,
            type: attachment.type,
            url: attachment.url
          }))
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            gender: true,
            email: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            email: true
          }
        },
        attachments: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
            createdAt: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "MEDICAL_RECORD",
        entityId: record.id,
        userId: session.user.id,
        userRole: session.user.role,
        details: `Created medical record for patient ${patientId}`
      }
    })

    revalidatePath("/medical-records")
    return NextResponse.json(record)
  } catch (error) {
    console.error("Error creating medical record:", error)
    return NextResponse.json(
      { error: "Failed to create medical record" } as any,
      { status: 500 }
    )
  }
} 