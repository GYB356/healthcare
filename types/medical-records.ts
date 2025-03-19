export type RecordType =
  | "CONSULTATION"
  | "DIAGNOSIS"
  | "TREATMENT"
  | "PRESCRIPTION"
  | "LAB_RESULT"
  | "IMAGING"
  | "SURGERY"
  | "FOLLOW_UP"

export interface Attachment {
  id: string
  name: string
  type: string
  url: string
  createdAt: Date
  medicalRecordId: string
}

export interface Patient {
  id: string
  name: string
  dateOfBirth: Date
  gender: string
  email: string
  phone: string | null
}

export interface Doctor {
  id: string
  name: string
  specialization: string
  email: string
}

export interface MedicalRecord {
  id: string
  type: RecordType
  date: Date
  description: string
  patientId: string
  doctorId: string
  createdAt: Date
  updatedAt: Date
  patient: Patient
  doctor: Doctor
  attachments: Attachment[]
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    pages: number
    page: number
    limit: number
  }
}

export interface MedicalRecordFilters {
  search?: string
  type?: RecordType
  startDate?: string
  endDate?: string
  patientId?: string
  page?: number
  limit?: number
}

export interface AttachmentUpload {
  file: File
}

export interface DeletedAttachment {
  id: string
  url: string
} 