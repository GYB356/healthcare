import { createAuditLog, verifyPatientAccess } from '@/lib/hipaa';
import { AuditAction, ResourceType, AuditSeverity, AuditStatus } from '@prisma/client';

export interface MedicalRecordAuditContext {
  userId: string;
  patientId: string;
  recordId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log medical record access and verify permissions
 */
export async function logMedicalRecordAccess(context: MedicalRecordAuditContext) {
  try {
    // Verify access
    const hasAccess = await verifyPatientAccess(context.userId, context.patientId);
    
    if (!hasAccess) {
      await createAuditLog({
        userId: context.userId,
        action: AuditAction.ACCESS_ATTEMPT,
        resourceType: ResourceType.MEDICAL_RECORD,
        resourceId: context.recordId || context.patientId,
        details: 'Unauthorized attempt to access medical records',
        severity: AuditSeverity.HIGH,
        status: AuditStatus.FAILURE,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      
      throw new Error('Unauthorized access to medical records');
    }

    // Log successful access
    await createAuditLog({
      userId: context.userId,
      action: AuditAction.VIEW,
      resourceType: ResourceType.MEDICAL_RECORD,
      resourceId: context.recordId || context.patientId,
      details: context.recordId 
        ? `Accessed specific medical record ${context.recordId}`
        : 'Accessed medical records list',
      severity: AuditSeverity.LOW,
      status: AuditStatus.SUCCESS,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  } catch (error) {
    console.error('Failed to log medical record access:', error);
    throw error;
  }
}

/**
 * Log medical record attachment download
 */
export async function logAttachmentDownload(
  context: MedicalRecordAuditContext,
  attachmentId: string,
  fileName: string
) {
  try {
    await createAuditLog({
      userId: context.userId,
      action: AuditAction.DOWNLOAD,
      resourceType: ResourceType.MEDICAL_RECORD,
      resourceId: attachmentId,
      details: `Downloaded medical record attachment: ${fileName}`,
      severity: AuditSeverity.MEDIUM,
      status: AuditStatus.SUCCESS,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  } catch (error) {
    console.error('Failed to log attachment download:', error);
    throw error;
  }
}

/**
 * Log medical record search
 */
export async function logMedicalRecordSearch(
  context: MedicalRecordAuditContext,
  searchTerm: string,
  filterType?: string
) {
  try {
    await createAuditLog({
      userId: context.userId,
      action: AuditAction.SEARCH,
      resourceType: ResourceType.MEDICAL_RECORD,
      resourceId: context.patientId,
      details: `Searched medical records - Term: "${searchTerm}"${filterType ? ` Filter: ${filterType}` : ''}`,
      severity: AuditSeverity.LOW,
      status: AuditStatus.SUCCESS,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  } catch (error) {
    console.error('Failed to log medical record search:', error);
    throw error;
  }
} 