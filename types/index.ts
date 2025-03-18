// User types
export type UserRole = 'patient' | 'doctor' | 'nurse' | 'staff' | 'administrator';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

// Appointment types
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Medical report types
export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  treatment: string;
  medications: string[];
  notes: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BillingRecord {
  id: string;
  patientId: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  dueDate: string;
  description: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    coverage: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  department: string;
  shift: 'morning' | 'afternoon' | 'night';
  date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceData {
  id: string;
  deviceId: string;
  patientId: string;
  type: string;
  data: Record<string, any>;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  totalPatients: number;
  totalAppointments: number;
  revenue: number;
  appointmentsByStatus: Record<string, number>;
  patientsByDepartment: Record<string, number>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

// Accessibility audit types
export enum A11ySeverity {
  CRITICAL = 'critical',
  HIGH = 'serious',
  MEDIUM = 'moderate',
  LOW = 'minor'
}

export interface A11yViolation {
  id: string;
  impact: A11ySeverity;
  description: string;
  help: string;
  helpUrl: string;
  nodes: {
    html: string;
    failureSummary: string;
  }[];
}

export interface AuditResult {
  route: string;
  url: string;
  timestamp: string;
  results: {
    violations: A11yViolation[];
    passes: any[];
    incomplete: any[];
  };
  screenshot?: string;
  html?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
