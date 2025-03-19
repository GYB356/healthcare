import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

// In a production environment, you would use a cloud storage service like AWS S3
// This is a simple implementation that stores files locally
const UPLOAD_DIR = join(process.cwd(), "public", "uploads")

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return new NextResponse("No file provided", { status: 400 })
    }

    // Generate a unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${uuidv4()}-${file.name}`
    const filepath = join(UPLOAD_DIR, filename)

    // Write the file
    await writeFile(filepath, buffer)

    // In production, this would be the URL from your cloud storage
    const url = `/uploads/${filename}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error("[UPLOAD]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET() {
  return new NextResponse("Method not allowed", { status: 405 })
}