import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      patientId?: string
      providerId?: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: Role
    patientId?: string
    providerId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    patientId?: string
    providerId?: string
  }
}

export type Role = 
  | "ADMIN"
  | "DOCTOR"
  | "NURSE"
  | "STAFF"
  | "PATIENT"; 