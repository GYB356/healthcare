import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Define the AuditAction type
type AuditAction = 'USER_REGISTER' | 'USER_LOGIN' | 'USER_UPDATE' | 'USER_DELETE';

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['PATIENT', 'DOCTOR', 'STAFF']).default('PATIENT'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate the request body against the schema
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          fields: result.error.errors.map(err => ({
            field: err.path[0],
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const validatedData = result.data;

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: validatedData.role,
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Log the registration
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTER',
        entityType: 'USER',
        entityId: user.id,
        details: `User registered with role ${user.role}`,
      },
    });

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 