import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import { createMocks } from "node-mocks-http"
import { GET, POST, PUT, DELETE } from "@/app/api/medical-records/[id]/route"
import { GET as listGET } from "@/app/api/medical-records/route"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'

vi.mock("next-auth")
vi.mock("@vercel/blob")

describe("Medical Records API", () => {
  let mockUser: any
  let mockPatient: any
  let mockDoctor: any
  let mockPrisma: any
  let mockSession: any

  beforeEach(async () => {
    // Create test users
    mockPatient = await prisma.user.create({
      data: {
        name: "Test Patient",
        email: "patient@test.com",
        role: "PATIENT",
      },
    })

    mockDoctor = await prisma.user.create({
      data: {
        name: "Test Doctor",
        email: "doctor@test.com",
        role: "DOCTOR",
      },
    })

    mockPrisma = new prisma.PrismaClient()
    mockSession = {
      user: {
        id: 'doctor-id',
        role: 'DOCTOR',
      },
    }
    ;(getServerSession as any).mockResolvedValue(mockSession)
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany()
    await prisma.attachment.deleteMany()
    await prisma.medicalRecord.deleteMany()
    await prisma.user.deleteMany()
    vi.clearAllMocks()
  })

  describe("GET /api/medical-records", () => {
    it("should return 401 if user is not authenticated", async () => {
      const { req, res } = createMocks({
        method: "GET",
      })

      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      await listGET(req)

      expect(res._getStatusCode()).toBe(401)
    })

    it("should return medical records for authenticated doctor", async () => {
      const { req, res } = createMocks({
        method: "GET",
      })

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: mockDoctor,
      })

      // Create test medical record
      await prisma.medicalRecord.create({
        data: {
          type: "CONSULTATION",
          date: new Date(),
          description: "Test consultation",
          patientId: mockPatient.id,
          doctorId: mockDoctor.id,
        },
      })

      const response = await listGET(req)
      const data = await response.json()

      expect(data.records).toBeDefined()
      expect(data.records.length).toBe(1)
      expect(data.pagination).toBeDefined()
    })

    it("should filter records by patient for patient users", async () => {
      mockSession.user.role = "PATIENT"
      mockSession.user.id = "patient-id"

      const mockRecords = [
        { id: "1", patientId: "patient-id", type: "CONSULTATION" },
      ]
      ;(mockPrisma.medicalRecord.findMany as any).mockResolvedValue(mockRecords)

      const request = new NextRequest("http://localhost:3000/api/medical-records")
      const response = await listGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockRecords)
      expect(mockPrisma.medicalRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            patientId: "patient-id",
          }),
        })
      )
    })
  })

  describe("GET /api/medical-records/[id]", () => {
    it("should return 401 for unauthenticated users", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null)

      const request = new NextRequest("http://localhost:3000/api/medical-records/1")
      const response = await GET(request, { params: { id: "1" } })

      expect(response.status).toBe(401)
    })

    it("should return medical record for valid ID", async () => {
      const mockRecord = {
        id: "1",
        patientId: "1",
        type: "CONSULTATION",
        doctorId: "doctor-id",
      }
      ;(mockPrisma.medicalRecord.findUnique as any).mockResolvedValue(mockRecord)

      const request = new NextRequest("http://localhost:3000/api/medical-records/1")
      const response = await GET(request, { params: { id: "1" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockRecord)
    })

    it("should return 404 for non-existent record", async () => {
      ;(mockPrisma.medicalRecord.findUnique as any).mockResolvedValue(null)

      const request = new NextRequest("http://localhost:3000/api/medical-records/999")
      const response = await GET(request, { params: { id: "999" } })

      expect(response.status).toBe(404)
    })
  })

  describe("POST /api/medical-records", () => {
    it("should return 401 if user is not a doctor", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          patientId: mockPatient.id,
          type: "CONSULTATION",
          date: new Date().toISOString(),
          description: "Test consultation",
        },
      })

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: mockPatient,
      })

      await POST(req)

      expect(res._getStatusCode()).toBe(401)
    })

    it("should create a new medical record", async () => {
      const mockRecord = {
        patientId: "1",
        type: "CONSULTATION",
        description: "Regular checkup",
      }
      ;(mockPrisma.medicalRecord.create as any).mockResolvedValue({
        id: "1",
        ...mockRecord,
        doctorId: "doctor-id",
      })

      const request = new NextRequest("http://localhost:3000/api/medical-records", {
        method: "POST",
        body: JSON.stringify(mockRecord),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe("1")
      expect(data.doctorId).toBe("doctor-id")
    })

    it("should validate required fields", async () => {
      const request = new NextRequest("http://localhost:3000/api/medical-records", {
        method: "POST",
        body: JSON.stringify({}),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it("should handle file uploads", async () => {
      const mockFile = new File(["test"], "test.pdf", { type: "application/pdf" })
      ;(put as any).mockResolvedValue({
        url: "https://example.com/test.pdf",
      })

      const formData = new FormData()
      formData.append("file", mockFile)
      formData.append(
        "data",
        JSON.stringify({
          patientId: "1",
          type: "CONSULTATION",
          description: "With attachment",
        })
      )

      const request = new NextRequest("http://localhost:3000/api/medical-records", {
        method: "POST",
        body: formData,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.attachments).toContainEqual({
        url: "https://example.com/test.pdf",
        name: "test.pdf",
        type: "application/pdf",
      })
    })
  })

  describe("PUT /api/medical-records/[id]", () => {
    it("should update an existing record", async () => {
      const mockRecord = {
        id: "1",
        description: "Updated description",
      }
      ;(mockPrisma.medicalRecord.update as any).mockResolvedValue(mockRecord)

      const request = new NextRequest("http://localhost:3000/api/medical-records/1", {
        method: "PUT",
        body: JSON.stringify({ description: "Updated description" }),
      })
      const response = await PUT(request, { params: { id: "1" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.description).toBe("Updated description")
    })

    it("should return 404 for non-existent record", async () => {
      ;(mockPrisma.medicalRecord.update as any).mockRejectedValue(new Error("Not found"))

      const request = new NextRequest("http://localhost:3000/api/medical-records/999", {
        method: "PUT",
        body: JSON.stringify({ description: "Updated" }),
      })
      const response = await PUT(request, { params: { id: "999" } })

      expect(response.status).toBe(404)
    })
  })

  describe("DELETE /api/medical-records/[id]", () => {
    it("should delete an existing record", async () => {
      ;(mockPrisma.medicalRecord.delete as any).mockResolvedValue({ id: "1" })

      const request = new NextRequest("http://localhost:3000/api/medical-records/1", {
        method: "DELETE",
      })
      const response = await DELETE(request, { params: { id: "1" } })

      expect(response.status).toBe(204)
    })

    it("should return 404 for non-existent record", async () => {
      ;(mockPrisma.medicalRecord.delete as any).mockRejectedValue(new Error("Not found"))

      const request = new NextRequest("http://localhost:3000/api/medical-records/999", {
        method: "DELETE",
      })
      const response = await DELETE(request, { params: { id: "999" } })

      expect(response.status).toBe(404)
    })
  })
}) 