import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from './prisma';
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            password: true,
            isActive: true,
          },
        });

        if (!user) {
          throw new Error('No user found with this email');
        }

        if (!user.isActive) {
          throw new Error('Your account is currently inactive. Please contact support.');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        // Handle user updates
        return { ...token, ...session.user };
      }

      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN' | 'STAFF';
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle role-based redirects after login
      if (url.startsWith(baseUrl)) {
        const user = await prisma.user.findUnique({
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
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    },
  },
}; 