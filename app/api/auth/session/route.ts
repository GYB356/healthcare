import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json(null)
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    },
  })
} 