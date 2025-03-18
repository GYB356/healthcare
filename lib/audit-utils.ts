import { createAuditLog, verifyPatientAccess } from '@/lib/hipaa';
import { AuditAction, ResourceType, AuditSeverity, AuditStatus } from '@prisma/client';
import { headers } from 'next/headers';

export interface AuditContext {
  userId: string;
  patientId: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log patient dashboard access and verify permissions
 */
export async function logDashboardAccess(context: AuditContext) {
  try {
    // Verify access
    const hasAccess = await verifyPatientAccess(context.userId, context.patientId);
    
    if (!hasAccess) {
      await createAuditLog({
        userId: context.userId,
        action: AuditAction.ACCESS_ATTEMPT,
        resourceType: ResourceType.PATIENT,
        resourceId: context.patientId,
        details: 'Unauthorized attempt to access patient dashboard',
        severity: AuditSeverity.HIGH,
        status: AuditStatus.FAILURE,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      
      throw new Error('Unauthorized access to patient dashboard');
    }

    // Log successful access
    await createAuditLog({
      userId: context.userId,
      action: AuditAction.VIEW,
      resourceType: ResourceType.PATIENT,
      resourceId: context.patientId,
      details: 'Patient dashboard accessed',
      severity: AuditSeverity.LOW,
      status: AuditStatus.SUCCESS,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  } catch (error) {
    console.error('Failed to log dashboard access:', error);
    throw error;
  }
}

/**
 * Log patient data access
 */
export async function logPatientDataAccess(
  context: AuditContext,
  dataType: 'appointments' | 'medications' | 'vitals' | 'summary'
) {
  try {
    await createAuditLog({
      userId: context.userId,
      action: AuditAction.VIEW,
      resourceType: ResourceType.MEDICAL_RECORD,
      resourceId: context.patientId,
      details: `Accessed patient ${dataType} data`,
      severity: AuditSeverity.LOW,
      status: AuditStatus.SUCCESS,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  } catch (error) {
    console.error(`Failed to log ${dataType} data access:`, error);
    throw error;
  }
}

/**
 * Log patient action (e.g., scheduling appointment, requesting refill)
 */
export async function logPatientAction(
  context: AuditContext,
  action: AuditAction,
  details: string,
  severity: AuditSeverity = AuditSeverity.LOW
) {
  try {
    await createAuditLog({
      userId: context.userId,
      action,
      resourceType: ResourceType.PATIENT,
      resourceId: context.patientId,
      details,
      severity,
      status: AuditStatus.SUCCESS,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  } catch (error) {
    console.error('Failed to log patient action:', error);
    throw error;
  }
} 