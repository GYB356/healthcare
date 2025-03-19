import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSignedUrl } from "@vercel/blob"

interface DownloadResponse {
  url: string
  name: string
  type: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
): Promise<NextResponse<DownloadResponse>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" } as any,
        { status: 401 }
      )
    }

    // Find the medical record and attachment
    const record = await prisma.medicalRecord.findUnique({
      where: { id: params.id },
      include: {
        attachments: {
          where: { id: params.attachmentId }
        }
      }
    })

    if (!record) {
      return NextResponse.json(
        { error: "Medical record not found" } as any,
        { status: 404 }
      )
    }

    if (record.attachments.length === 0) {
      return NextResponse.json(
        { error: "Attachment not found" } as any,
        { status: 404 }
      )
    }

    // Check if user has permission to access this record
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

    const attachment = record.attachments[0]

    // Generate signed URL for secure download
    const signedUrl = await getSignedUrl(
      attachment.url,
      { type: attachment.type },
      { expires: new Date(Date.now() + 5 * 60 * 1000) } // URL expires in 5 minutes
    )

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: "DOWNLOAD",
        entityType: "ATTACHMENT",
        entityId: attachment.id,
        userId: session.user.id,
        userRole: session.user.role,
        details: `Downloaded attachment ${attachment.name} from medical record ${record.id}`
      }
    })

    return NextResponse.json({
      url: signedUrl,
      name: attachment.name,
      type: attachment.type
    })
  } catch (error) {
    console.error("Error generating download URL:", error)
    return NextResponse.json(
      { error: "Failed to generate download URL" } as any,
      { status: 500 }
    )
  }
}