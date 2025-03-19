import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put, del } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import {
  MedicalRecord,
  RecordType,
  DeletedAttachment
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
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<MedicalRecord>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" } as any,
        { status: 401 }
      )
    }

    const record = await prisma.medicalRecord.findUnique({
      where: { id: params.id },
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

    if (!record) {
      return NextResponse.json(
        { error: "Medical record not found" } as any,
        { status: 404 }
      )
    }

    // Check if user has permission to view this record
    if (
      session.user.role === "PATIENT" &&
      record.patientId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Unauthorized" } as any,
        { status: 401 }
      )
    }

    if (
      session.user.role === "DOCTOR" &&
      record.doctorId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Unauthorized" } as any,
        { status: 401 }
      )
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: "VIEW",
        entityType: "MEDICAL_RECORD",
        entityId: record.id,
        userId: session.user.id,
        userRole: session.user.role,
        details: `Viewed medical record ${record.id}`
      }
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error("Error fetching medical record:", error)
    return NextResponse.json(
      { error: "Failed to fetch medical record" } as any,
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const type = formData.get("type") as RecordType | null
    const date = formData.get("date") as string | null
    const description = formData.get("description") as string | null
    const attachmentFiles = formData.getAll("attachments") as File[]
    const deletedAttachments = JSON.parse(
      formData.get("deletedAttachments") as string || "[]"
    ) as DeletedAttachment[]

    // Check if record exists and user has permission
    const existingRecord = await prisma.medicalRecord.findUnique({
      where: { id: params.id },
      include: { attachments: true }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Medical record not found" } as any,
        { status: 404 }
      )
    }

    if (existingRecord.doctorId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" } as any,
        { status: 401 }
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

    // Delete removed attachments from storage and database
    if (deletedAttachments.length > 0) {
      const attachmentsToDelete = existingRecord.attachments.filter(
        (att) => deletedAttachments.some(deleted => deleted.id === att.id)
      )

      for (const attachment of attachmentsToDelete) {
        await del(attachment.url)
      }

      await prisma.attachment.deleteMany({
        where: {
          id: { in: deletedAttachments.map(att => att.id) }
        }
      })
    }

    // Upload new attachments
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

    const newAttachments = await Promise.all(attachmentPromises)

    // Update record
    const updatedRecord = await prisma.medicalRecord.update({
      where: { id: params.id },
      data: {
        type: type || undefined,
        date: date ? new Date(date) : undefined,
        description: description || undefined,
        attachments: {
          create: newAttachments.map(attachment => ({
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

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entityType: "MEDICAL_RECORD",
        entityId: updatedRecord.id,
        userId: session.user.id,
        userRole: session.user.role,
        details: `Updated medical record ${updatedRecord.id}`
      }
    })

    revalidatePath("/medical-records")
    revalidatePath(`/medical-records/${params.id}`)
    return NextResponse.json(updatedRecord)
  } catch (error) {
    console.error("Error updating medical record:", error)
    return NextResponse.json(
      { error: "Failed to update medical record" } as any,
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ success: boolean }>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Unauthorized" } as any,
        { status: 401 }
      )
    }

    // Check if record exists and user has permission
    const record = await prisma.medicalRecord.findUnique({
      where: { id: params.id },
      include: { attachments: true }
    })

    if (!record) {
      return NextResponse.json(
        { error: "Medical record not found" } as any,
        { status: 404 }
      )
    }

    if (record.doctorId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" } as any,
        { status: 401 }
      )
    }

    // Delete attachments from storage
    for (const attachment of record.attachments) {
      await del(attachment.url)
    }

    // Delete record and related attachments
    await prisma.medicalRecord.delete({
      where: { id: params.id }
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: "DELETE",
        entityType: "MEDICAL_RECORD",
        entityId: record.id,
        userId: session.user.id,
        userRole: session.user.role,
        details: `Deleted medical record ${record.id}`
      }
    })

    revalidatePath("/medical-records")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting medical record:", error)
    return NextResponse.json(
      { error: "Failed to delete medical record" } as any,
      { status: 500 }
    )
  }
} 