import { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "ADMIN" | "DOCTOR" | "PATIENT"
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: "ADMIN" | "DOCTOR" | "PATIENT"
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