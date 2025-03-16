// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient' | 'staff';
  createdAt: string;
  updatedAt: string;
}

// Appointment types
export interface Appointment {
  _id: string;
  doctor: string | User;
  patient: string | User;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  reasonForVisit: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Medical report types
export interface MedicalInfo {
  symptoms: string[];
  diagnosis: string;
  recommendations: string[];
  medications: string[];
  followUpNeeded: boolean;
}

export interface Report {
  _id: string;
  appointmentId: string | Appointment;
  doctor: string | User;
  report: string;
  medicalInfo: MedicalInfo;
  followUpQuestions?: string;
  createdAt: string;
  updatedAt: string;
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
