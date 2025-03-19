import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { GET, POST, PUT, DELETE } from '@/app/api/appointments/[id]/route'
import { GET as listGET } from '@/app/api/appointments/route'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    appointment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    availability: {
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(callback => callback()),
  })),
}))

describe('Appointments API', () => {
  let mockPrisma: PrismaClient
  let mockSession: any

  beforeEach(() => {
    mockPrisma = new PrismaClient()
    mockSession = {
      user: {
        id: 'user-id',
        role: 'DOCTOR',
      },
    }
    ;(getServerSession as any).mockResolvedValue(mockSession)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/appointments', () => {
    it('should return 401 for unauthenticated users', async () => {
      ;(getServerSession as any).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/appointments')
      const response = await listGET(request)

      expect(response.status).toBe(401)
    })

    it('should return appointments for doctors', async () => {
      const mockAppointments = [
        {
          id: '1',
          patientId: 'patient-1',
          doctorId: 'user-id',
          date: '2024-03-15',
          time: '09:00',
          status: 'SCHEDULED',
        },
      ]
      ;(mockPrisma.appointment.findMany as any).mockResolvedValue(mockAppointments)

      const request = new NextRequest('http://localhost:3000/api/appointments')
      const response = await listGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockAppointments)
    })

    it('should filter appointments by patient for patient users', async () => {
      mockSession.user.role = 'PATIENT'
      mockSession.user.id = 'patient-id'

      const request = new NextRequest('http://localhost:3000/api/appointments')
      await listGET(request)

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            patientId: 'patient-id',
          }),
        })
      )
    })

    it('should handle date range filtering', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/appointments?startDate=2024-03-01&endDate=2024-03-31'
      )
      await listGET(request)

      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: {
              gte: '2024-03-01',
              lte: '2024-03-31',
            },
          }),
        })
      )
    })
  })

  describe('GET /api/appointments/[id]', () => {
    it('should return appointment data for valid ID', async () => {
      const mockAppointment = {
        id: '1',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        date: '2024-03-15',
        time: '09:00',
        status: 'SCHEDULED',
      }
      ;(mockPrisma.appointment.findUnique as any).mockResolvedValue(mockAppointment)

      const request = new NextRequest('http://localhost:3000/api/appointments/1')
      const response = await GET(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockAppointment)
    })

    it('should return 404 for non-existent appointment', async () => {
      ;(mockPrisma.appointment.findUnique as any).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/appointments/999')
      const response = await GET(request, { params: { id: '999' } })

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/appointments', () => {
    it('should create a new appointment', async () => {
      const mockAppointment = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        date: '2024-03-15',
        time: '09:00',
      }
      ;(mockPrisma.appointment.create as any).mockResolvedValue({
        id: '1',
        ...mockAppointment,
        status: 'SCHEDULED',
      })
      ;(mockPrisma.availability.findMany as any).mockResolvedValue([
        {
          dayOfWeek: 'FRIDAY',
          startTime: '09:00',
          endTime: '17:00',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify(mockAppointment),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('1')
      expect(data.status).toBe('SCHEDULED')
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should validate doctor availability', async () => {
      ;(mockPrisma.availability.findMany as any).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: 'patient-1',
          doctorId: 'doctor-1',
          date: '2024-03-15',
          time: '09:00',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/appointments/[id]', () => {
    it('should update appointment status', async () => {
      const mockAppointment = {
        id: '1',
        status: 'COMPLETED',
      }
      ;(mockPrisma.appointment.update as any).mockResolvedValue(mockAppointment)

      const request = new NextRequest('http://localhost:3000/api/appointments/1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      const response = await PUT(request, { params: { id: '1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('COMPLETED')
    })

    it('should validate status values', async () => {
      const request = new NextRequest('http://localhost:3000/api/appointments/1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'INVALID_STATUS' }),
      })
      const response = await PUT(request, { params: { id: '1' } })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/appointments/[id]', () => {
    it('should cancel an appointment', async () => {
      ;(mockPrisma.appointment.delete as any).mockResolvedValue({ id: '1' })

      const request = new NextRequest('http://localhost:3000/api/appointments/1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: '1' } })

      expect(response.status).toBe(204)
    })

    it('should return 404 for non-existent appointment', async () => {
      ;(mockPrisma.appointment.delete as any).mockRejectedValue(new Error('Not found'))

      const request = new NextRequest('http://localhost:3000/api/appointments/999', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: '999' } })

      expect(response.status).toBe(404)
    })
  })
}) 