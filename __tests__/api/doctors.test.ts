import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { GET, PUT } from '@/app/api/doctors/[id]/route'
import { GET as listGET } from '@/app/api/doctors/route'
import { GET as searchGET } from '@/app/api/doctors/search/route'
import { PUT as availabilityPUT } from '@/app/api/doctors/[id]/availability/route'

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
      update: vi.fn(),
    },
    availability: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(callback => callback()),
  })),
}))

describe('Doctors API', () => {
  let mockPrisma: PrismaClient
  let mockSession: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    mockSession = {
      user: {
        id: 'doctor-id',
        role: 'DOCTOR',
      },
    }
    ;(getServerSession as any).mockResolvedValue(mockSession)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/doctors', () => {
    it('should return 401 for unauthenticated users', async () => {
      ;(getServerSession as any).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/doctors')
      const response = await listGET(request)

      expect(response.status).toBe(401)
    })

    it('should return list of doctors', async () => {
      const mockDoctors = [
        { id: '1', name: 'Dr. Smith', specialization: 'Cardiology' },
        { id: '2', name: 'Dr. Jones', specialization: 'Neurology' },
      ]
      ;(mockPrisma.user.findMany as any).mockResolvedValue(mockDoctors)

      const request = new NextRequest('http://localhost:3000/api/doctors')
      const response = await listGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockDoctors)
    })

    it('should handle pagination', async () => {
      const mockDoctors = [{ id: '1', name: 'Dr. Smith' }]
      ;(mockPrisma.user.findMany as any).mockResolvedValue(mockDoctors)

      const request = new NextRequest('http://localhost:3000/api/doctors?page=2&limit=10')
      const response = await listGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
    })
  })

  describe('GET /api/doctors/search', () => {
    it('should return matching doctors', async () => {
      const mockDoctors = [
        { id: '1', name: 'Dr. Smith', specialization: 'Cardiology' },
      ]
      ;(mockPrisma.user.findMany as any).mockResolvedValue(mockDoctors)

      const request = new NextRequest('http://localhost:3000/api/doctors/search?q=smith')
      const response = await searchGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockDoctors)
    })

    it('should filter by specialization', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/doctors/search?specialization=cardiology'
      )
      await searchGET(request)

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            specialization: 'cardiology',
          }),
        })
      )
    })
  })

  describe('GET /api/doctors/[id]', () => {
    it('should return doctor data for valid ID', async () => {
      const mockDoctor = {
        id: '1',
        name: 'Dr. Smith',
        specialization: 'Cardiology',
      }
      ;(mockPrisma.user.findUnique as any).mockResolvedValue(mockDoctor)

      const request = new NextRequest('http://localhost:3000/api/doctors/1')
      const response = await GET(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockDoctor)
    })

    it('should return 404 for non-existent doctor', async () => {
      ;(mockPrisma.user.findUnique as any).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/doctors/999')
      const response = await GET(request, { params: { id: '999' } })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/doctors/[id]', () => {
    it('should update doctor profile', async () => {
      const mockDoctor = {
        id: '1',
        name: 'Dr. Smith Updated',
        specialization: 'Neurology',
      }
      ;(mockPrisma.user.update as any).mockResolvedValue(mockDoctor)

      const request = new NextRequest('http://localhost:3000/api/doctors/1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Dr. Smith Updated',
          specialization: 'Neurology',
        }),
      })
      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Dr. Smith Updated')
      expect(data.specialization).toBe('Neurology')
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/doctors/1', {
        method: 'PUT',
        body: JSON.stringify({}),
      })
      const response = await PUT(request, { params: { id: '1' } })

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/doctors/[id]/availability', () => {
    it('should update doctor availability', async () => {
      const mockAvailability = {
        id: '1',
        doctorId: '1',
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '17:00',
      }
      ;(mockPrisma.availability.upsert as any).mockResolvedValue(mockAvailability)

      const request = new NextRequest('http://localhost:3000/api/doctors/1/availability', {
        method: 'PUT',
        body: JSON.stringify({
          dayOfWeek: 'MONDAY',
          startTime: '09:00',
          endTime: '17:00',
        }),
      })
      const response = await availabilityPUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockAvailability)
    })

    it('should validate time format', async () => {
      const request = new NextRequest('http://localhost:3000/api/doctors/1/availability', {
        method: 'PUT',
        body: JSON.stringify({
          dayOfWeek: 'MONDAY',
          startTime: 'invalid',
          endTime: 'invalid',
        }),
      })
      const response = await availabilityPUT(request, { params: { id: '1' } })

      expect(response.status).toBe(400)
    })

    it('should validate day of week', async () => {
      const request = new NextRequest('http://localhost:3000/api/doctors/1/availability', {
        method: 'PUT',
        body: JSON.stringify({
          dayOfWeek: 'INVALID_DAY',
          startTime: '09:00',
          endTime: '17:00',
        }),
      })
      const response = await availabilityPUT(request, { params: { id: '1' } })

      expect(response.status).toBe(400)
    })

    it('should validate time range', async () => {
      const request = new NextRequest('http://localhost:3000/api/doctors/1/availability', {
        method: 'PUT',
        body: JSON.stringify({
          dayOfWeek: 'MONDAY',
          startTime: '17:00',
          endTime: '09:00',
        }),
      })
      const response = await availabilityPUT(request, { params: { id: '1' } })

      expect(response.status).toBe(400)
    })
  })
}) 