import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { GET } from '@/app/api/auth/[...nextauth]/route'
import { POST as registerPOST } from '@/app/api/auth/register/route'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(callback => callback()),
  })),
}))

describe('Auth API', () => {
  let mockPrisma: any
  let mockSession: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    mockSession = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    }
    ;(getServerSession as any).mockResolvedValue(mockSession)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/auth/session', () => {
    it('should return session data for authenticated users', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/session')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockSession)
    })

    it('should return null for unauthenticated users', async () => {
      ;(getServerSession as any).mockResolvedValue(null)
      const request = new NextRequest('http://localhost:3000/api/auth/session')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toBeNull()
    })
  })

  describe('POST /api/auth/register', () => {
    it('should create a new user account', async () => {
      const mockUser = {
        email: 'new@example.com',
        password: 'StrongPass123!',
        name: 'New User',
        role: 'PATIENT',
      }
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue({ id: '1', ...mockUser })

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(mockUser),
      })
      const response = await registerPOST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('id')
      expect(data.email).toBe(mockUser.email)
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toEqual(expect.stringContaining('Required fields missing'))
      expect(data.fields).toEqual(
        expect.arrayContaining(['email', 'password', 'name', 'role'])
      )
    })

    it('should validate password strength', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User',
          role: 'PATIENT',
        }),
      })
      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toEqual(expect.stringContaining('password'))
      expect(data.error).toEqual(
        expect.stringContaining('Password must be at least 8 characters')
      )
    })

    it('should prevent duplicate email registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@example.com' })

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'StrongPass123!',
          name: 'Test User',
          role: 'PATIENT',
        }),
      })
      const response = await registerPOST(request)

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error).toEqual(expect.stringContaining('Email already exists'))
    })

    it('should validate email format', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'StrongPass123!',
          name: 'Test User',
          role: 'PATIENT',
        }),
      })
      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toEqual(expect.stringContaining('email'))
      expect(data.error).toEqual(expect.stringContaining('Invalid email format'))
    })

    it('should validate role', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'StrongPass123!',
          name: 'Test User',
          role: 'INVALID_ROLE',
        }),
      })
      const response = await registerPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toEqual(expect.stringContaining('role'))
      expect(data.error).toEqual(
        expect.stringContaining('Invalid role. Must be one of: PATIENT, DOCTOR, STAFF')
      )
    })
  })
}) 