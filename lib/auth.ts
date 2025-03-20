import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare, hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { JWT } from 'next-auth/jwt';
import { User, Prisma } from '@prisma/client';
import { createAuditLog } from '@/lib/hipaa';
import { getClientIp } from 'request-ip';
import type { NextApiRequest } from 'next';
import type { Role } from '@/types/next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';

/**
 * Get request metadata for audit logging
 */
function getRequestMetadata(req?: NextApiRequest) {
  return {
    ipAddress: req ? getClientIp(req) : undefined,
    userAgent: req?.headers['user-agent'],
    sessionId: req?.headers['x-session-id'] as string,
  };
}

/**
 * JWT Token verification and management
 */
export async function verifyJwtToken(token: string): Promise<JWT & { role: string; patientId?: string }> {
  try {
    // This would be your implementation to verify the JWT
    // For now, we'll just return a dummy object
    return {
      sub: "user-id",
      role: "patient",
      patientId: "patient-id",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 1 week
      jti: "token-id",
    };
  } catch (error) {
    throw new Error("Invalid token");
  }
}

/**
 * NextAuth options for authentication
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (HIPAA compliant session timeout)
  },
  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/register',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        const metadata = getRequestMetadata(req as NextApiRequest);

        if (!user) {
          // Log failed login attempt with unknown user
          await createAuditLog({
            userId: 'unknown',
            action: "access_attempt",
            resourceType: "user",
            details: `Failed login attempt for email: ${credentials.email}`,
            severity: "high",
            status: "failure",
            ...metadata
          });
          
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          // Log failed login attempt
          await createAuditLog({
            userId: user.id,
            action: "access_attempt",
            resourceType: "user",
            resourceId: user.id,
            details: "Failed login attempt - invalid password",
            severity: "high",
            status: "failure",
            ...metadata
          });
          
          throw new Error('Invalid credentials');
        }

        // Log successful login
        await createAuditLog({
          userId: user.id,
          action: "login",
          resourceType: "user",
          resourceId: user.id,
          details: "Successful login",
          severity: "medium",
          status: "success",
          ...metadata
        });

        return user;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = user as User;
        token.id = dbUser.id;
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.role = dbUser.role as Role;
        
        // If user is a patient, add patientId to token
        if (dbUser.role === "PATIENT") {
          const patient = await db.patient.findUnique({
            where: {
              userId: dbUser.id,
            },
          });
          if (patient) {
            token.patientId = patient.id;
          }
        }

        // If user is a healthcare provider, add providerId to token
        if (["DOCTOR", "NURSE"].includes(dbUser.role)) {
          const provider = await db.healthcareProvider.findUnique({
            where: {
              userId: dbUser.id,
            },
          });
          if (provider) {
            token.providerId = provider.id;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        
        if (token.patientId) {
          session.user.patientId = token.patientId;
        }
        
        if (token.providerId) {
          session.user.providerId = token.providerId;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle role-based redirects after login
      if (url.startsWith(baseUrl)) {
        const user = await db.user.findUnique({
          where: { id: url.split('user=')[1]?.split('&')[0] },
          select: { role: true },
        });

        if (user) {
          switch (user.role) {
            case 'ADMIN':
              return `${baseUrl}/admin/dashboard`;
            case 'DOCTOR':
              return `${baseUrl}/doctor/dashboard`;
            case 'NURSE':
              return `${baseUrl}/nurse/dashboard`;
            case 'STAFF':
              return `${baseUrl}/staff/dashboard`;
            default:
              return `${baseUrl}/patient/dashboard`;
          }
        }
      }
      return url;
    },
  },
  events: {
    async signIn({ user }) {
      // Update last login time
      await db.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    },
    async signOut({ token, session }) {
      if (token && token.id) {
        const metadata = getRequestMetadata();
        
        // Log logout
        await createAuditLog({
          userId: token.id as string,
          action: "logout",
          resourceType: "user",
          resourceId: token.id as string,
          details: "User logged out",
          severity: "low",
          status: "success",
          ...metadata
        });
      }
    },
  },
};

/**
 * Register a new user
 */
export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: Role,
  additionalData: any = {},
  req?: NextApiRequest
) => {
  const metadata = getRequestMetadata(req);

  const existingUser = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    await createAuditLog({
      userId: 'unknown',
      action: "create",
      resourceType: "user",
      details: `Registration attempt with existing email: ${email}`,
      severity: "medium",
      status: "failure",
      ...metadata
    });
    
    throw new Error("Email already in use");
  }

  // Hash the password
  const hashedPassword = await hash(password, 10);

  // Create the user in a transaction to ensure all related data is created
  try {
    const result = await db.$transaction(async (prisma) => {
      // Create the user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
      });

      // If role is patient, create patient record
      if (role === "PATIENT") {
        const { dateOfBirth, gender, address, phone, emergencyContact } = additionalData;
        
        await prisma.patient.create({
          data: {
            userId: user.id,
            dateOfBirth: new Date(dateOfBirth),
            gender,
            address,
            phone,
            emergencyContact,
          },
        });
      }
      
      // If role is healthcare provider, create provider record
      if (["DOCTOR", "NURSE"].includes(role)) {
        const { specialty, licenseNumber, department } = additionalData;
        
        await prisma.healthcareProvider.create({
          data: {
            userId: user.id,
            specialty,
            licenseNumber,
            department,
          },
        });
      }

      // Log user creation
      await createAuditLog({
        userId: user.id,
        action: "create",
        resourceType: "user",
        resourceId: user.id,
        details: `Created new user with role: ${role}`,
        severity: "medium",
        status: "success",
        ...metadata
      });

      return user;
    });

    return result;
  } catch (error) {
    // Log registration failure
    await createAuditLog({
      userId: 'unknown',
      action: "create",
      resourceType: "user",
      details: `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: "high",
      status: "failure",
      ...metadata
    });
    
    throw error;
  }
};

/**
 * Get current user information with their role-specific data
 */
export const getCurrentUser = async (userId: string, req?: NextApiRequest) => {
  const metadata = getRequestMetadata(req);

  try {
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      await createAuditLog({
        userId: userId,
        action: "view",
        resourceType: "user",
        resourceId: userId,
        details: "Attempted to access non-existent user profile",
        severity: "high",
        status: "failure",
        ...metadata
      });
      
      throw new Error("User not found");
    }

    let roleData = null;

    if (user.role === "PATIENT") {
      roleData = await db.patient.findUnique({
        where: {
          userId: user.id,
        },
        include: {
          insurance: true,
        },
      });
    } else if (["DOCTOR", "NURSE"].includes(user.role)) {
      roleData = await db.healthcareProvider.findUnique({
        where: {
          userId: user.id,
        },
      });
    }

    // Log successful user access
    await createAuditLog({
      userId: user.id,
      action: "view",
      resourceType: "user",
      resourceId: user.id,
      details: "User profile accessed",
      severity: "low",
      status: "success",
      ...metadata
    });

    return {
      ...user,
      roleData,
    };
  } catch (error) {
    // Log access failure
    await createAuditLog({
      userId: userId,
      action: "view",
      resourceType: "user",
      resourceId: userId,
      details: `Failed to access user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: "high",
      status: "failure",
      ...metadata
    });
    
    throw error;
  }
}; 