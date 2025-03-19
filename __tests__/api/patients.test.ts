import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { GET, POST, PUT, DELETE } from '@/app/api/patients/[id]/route'
import { GET as searchGET } from '@/app/api/patients/search/route'
import { GET as listGET } from '@/app/api/patients/route'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    patientProfile: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(callback => callback()),
  })),
}))

describe('Patients API', () => {
  let mockPrisma: any
  let mockSession: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    mockSession = {
      user: {
        id: 'test-user-id',
        role: 'ADMIN',
      },
    }
    ;(getServerSession as any).mockResolvedValue(mockSession)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/patients', () => {
    it('should return 401 if user is not authenticated', async () => {
      ;(getServerSession as any).mockResolvedValue(null)
      const request = new NextRequest('http://localhost:3000/api/patients')
      const response = await listGET(request)
      expect(response.status).toBe(401)
    })

    it('should return 403 if user is not authorized', async () => {
      mockSession.user.role = 'PATIENT'
      const request = new NextRequest('http://localhost:3000/api/patients')
      const response = await listGET(request)
      expect(response.status).toBe(403)
    })

    it('should return list of patients with pagination', async () => {
      const mockPatients = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      ]
      mockPrisma.user.findMany.mockResolvedValue(mockPatients)

      const request = new NextRequest('http://localhost:3000/api/patients?page=1&limit=10')
      const response = await listGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.patients).toEqual(mockPatients)
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'PATIENT' },
        skip: 0,
        take: 10,
        include: { patientProfile: true },
      })
    })
  })

  describe('GET /api/patients/search', () => {
    it('should return matching patients', async () => {
      const mockPatients = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
      ]
      mockPrisma.user.findMany.mockResolvedValue(mockPatients)

      const request = new NextRequest('http://localhost:3000/api/patients/search?q=john')
      const response = await searchGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.patients).toEqual(mockPatients)
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: 'PATIENT',
          OR: [
            { name: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
          ],
        },
        include: { patientProfile: true },
      })
    })
  })

  describe('GET /api/patients/[id]', () => {
    it('should return patient data for valid ID', async () => {
      const mockPatient = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        patientProfile: {
          dateOfBirth: '1990-01-01',
          bloodType: 'A+',
        },
      }
      mockPrisma.user.findUnique.mockResolvedValue(mockPatient)

      const request = new NextRequest('http://localhost:3000/api/patients/1')
      const response = await GET(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.patient).toEqual(mockPatient)
    })

    it('should return 404 for non-existent patient', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/patients/999')
      const response = await GET(request, { params: { id: '999' } })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/patients/[id]', () => {
    it('should update patient profile', async () => {
      const mockPatient = {
        id: '1',
        name: 'John Doe',
        patientProfile: {
          id: 'profile-1',
          dateOfBirth: '1990-01-01',
          bloodType: 'A+',
        },
      }
      mockPrisma.user.update.mockResolvedValue(mockPatient)

      const request = new NextRequest('http://localhost:3000/api/patients/1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'John Doe',
          dateOfBirth: '1990-01-01',
          bloodType: 'A+',
        }),
      })
      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.patient).toEqual(mockPatient)
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/patients/1', {
        method: 'PUT',
        body: JSON.stringify({}),
      })
      const response = await PUT(request, { params: { id: '1' } })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/patients/[id]', () => {
    it('should delete patient', async () => {
      mockPrisma.user.delete.mockResolvedValue({ id: '1' })

      const request = new NextRequest('http://localhost:3000/api/patients/1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: '1' } })

      expect(response.status).toBe(200)
    })

    it('should return 404 for non-existent patient', async () => {
      mockPrisma.user.delete.mockRejectedValue(new Error('Record not found'))

      const request = new NextRequest('http://localhost:3000/api/patients/999', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: '999' } })

      expect(response.status).toBe(404)
    })
  })
}) 