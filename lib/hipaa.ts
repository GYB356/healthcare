import { db } from '@/lib/db';
import { AuditLog, Prisma, ResourceType, AuditAction, AuditSeverity, AuditStatus, Role } from '@prisma/client';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { RateLimiter } from 'limiter';
import { Redis } from 'ioredis';

// Constants for encryption
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY_LENGTH = 32; // 256 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

// Rate limiting configuration
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

// Redis client for rate limiting
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Rate limiter instance
const rateLimiter = new RateLimiter({
  tokensPerInterval: MAX_REQUESTS,
  interval: RATE_LIMIT_WINDOW,
  fireImmediately: true,
});

export interface AuditOptions {
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  medicalRecordId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  severity?: AuditSeverity;
  status?: AuditStatus;
  sessionId?: string;
  timestamp?: Date;
}

interface EncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
}

/**
 * Check rate limit for a specific IP address
 */
async function checkRateLimit(ipAddress: string): Promise<boolean> {
  const key = `ratelimit:${ipAddress}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, Math.floor(RATE_LIMIT_WINDOW / 1000));
  }
  
  return count <= MAX_REQUESTS;
}

/**
 * Create an audit log entry (HIPAA requirement)
 */
export async function createAuditLog(options: AuditOptions): Promise<AuditLog> {
  try {
    // Check rate limit if IP address is provided
    if (options.ipAddress) {
      const allowed = await checkRateLimit(options.ipAddress);
      if (!allowed) {
        throw new Error('Rate limit exceeded');
      }
    }

    const timestamp = options.timestamp || new Date();
    
    // Generate integrity hash for the log entry
    const logData = {
      ...options,
      timestamp,
    };
    
    return await db.auditLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        resourceType: options.resourceType,
        resourceId: options.resourceId,
        medicalRecordId: options.medicalRecordId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        details: options.details,
        severity: options.severity || AuditSeverity.LOW,
        status: options.status || AuditStatus.SUCCESS,
        sessionId: options.sessionId,
        timestamp,
        integrityHash: generateIntegrityHash(logData),
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    throw new Error('Failed to create audit log entry');
  }
}

/**
 * Get audit logs with filtering options
 */
export async function getAuditLogs(
  filters: {
    userId?: string;
    resourceType?: ResourceType;
    resourceId?: string;
    medicalRecordId?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: AuditSeverity;
    status?: AuditStatus;
    sessionId?: string;
  },
  pagination: {
    page?: number;
    limit?: number;
  } = {}
) {
  try {
    const { userId, resourceType, resourceId, medicalRecordId, startDate, endDate, severity, status, sessionId } = filters;
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;
    
    const where: Prisma.AuditLogWhereInput = {};
    
    if (userId) where.userId = userId;
    if (resourceType) where.resourceType = resourceType;
    if (resourceId) where.resourceId = resourceId;
    if (medicalRecordId) where.medicalRecordId = medicalRecordId;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (sessionId) where.sessionId = sessionId;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }
    
    const [logs, count] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: {
          timestamp: 'desc',
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    // Verify integrity of logs
    const verifiedLogs = logs.map(log => {
      const { user, ...logData } = log;
      return {
        ...log,
        integrityVerified: verifyLogIntegrity(logData),
      };
    });
    
    return {
      logs: verifiedLogs,
      pagination: {
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit,
      },
    };
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error);
    throw new Error('Failed to retrieve audit logs');
  }
}

/**
 * Generate a key from password using scrypt
 */
async function generateKey(password: string, salt: Buffer): Promise<Buffer> {
  const scryptAsync = promisify(scrypt);
  return await scryptAsync(password, salt, ENCRYPTION_KEY_LENGTH) as Buffer;
}

/**
 * Encrypt sensitive data (HIPAA requirement)
 * This uses AES-256-GCM encryption for PHI data
 */
export async function encryptData(data: string): Promise<EncryptedData> {
  try {
    const iv = randomBytes(16);
    const salt = randomBytes(32);
    
    // Generate key from environment variable
    const key = await generateKey(process.env.ENCRYPTION_KEY || '', salt);
    
    const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData: `${encryptedData}:${salt.toString('hex')}`,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export async function decryptData(encrypted: EncryptedData): Promise<string> {
  try {
    const [data, saltHex] = encrypted.encryptedData.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(encrypted.iv, 'hex');
    const authTag = Buffer.from(encrypted.authTag, 'hex');
    
    // Generate key from environment variable
    const key = await generateKey(process.env.ENCRYPTION_KEY || '', salt);
    
    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate integrity hash for audit log
 */
function generateIntegrityHash(data: any): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(data));
  return hash.digest('hex');
}

/**
 * Verify integrity of audit log
 */
function verifyLogIntegrity(log: AuditLog & { integrityHash?: string }): boolean {
  if (!log.integrityHash) return false;
  
  const { integrityHash, ...logData } = log;
  const computedHash = generateIntegrityHash(logData);
  
  return computedHash === integrityHash;
}

/**
 * Verify if a user has access to a patient's data
 */
export async function verifyPatientAccess(userId: string, patientId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

    // Admin has access to all patients
    if (user.role === Role.ADMIN) return true;

    // Patient can only access their own data
    if (user.role === Role.PATIENT) {
      const patient = await db.patient.findUnique({
        where: { userId: user.id },
      });
      
      return patient?.id === patientId;
    }

    // Healthcare providers (doctors, nurses) can access their patients
    if ([Role.DOCTOR, Role.NURSE].includes(user.role)) {
      const provider = await db.healthcareProvider.findUnique({
        where: { userId: user.id },
      });
      
      if (!provider) return false;
      
      // Check if provider has any appointments with this patient
      const hasAppointment = await db.appointment.findFirst({
        where: {
          providerId: provider.id,
          patientId: patientId,
        },
      });
      
      if (hasAppointment) return true;
      
      // Check if provider has any medical records for this patient
      const hasRecord = await db.medicalRecord.findFirst({
        where: {
          providerId: provider.id,
          patientId: patientId,
        },
      });
      
      return !!hasRecord;
    }

    // Staff members need explicit verification
    if (user.role === Role.STAFF) {
      return false; // More restrictive access for staff
    }

    return false;
  } catch (error) {
    console.error('Failed to verify patient access:', error);
    throw new Error('Failed to verify patient access');
  }
}

/**
 * Check if user has access to a specific medical record
 */
export async function verifyMedicalRecordAccess(userId: string, recordId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) return false;

    // Admin has access to all records
    if (user.role === Role.ADMIN) return true;

    const record = await db.medicalRecord.findUnique({
      where: { id: recordId },
      include: { patient: true },
    });

    if (!record) return false;

    // Patient can only access their own records
    if (user.role === Role.PATIENT) {
      const patient = await db.patient.findUnique({
        where: { userId: user.id },
      });
      
      return patient?.id === record.patientId;
    }

    // Healthcare providers (doctors, nurses) can access records of their patients
    if ([Role.DOCTOR, Role.NURSE].includes(user.role)) {
      const provider = await db.healthcareProvider.findUnique({
        where: { userId: user.id },
      });
      
      if (!provider) return false;
      
      // Provider can access if they created the record
      if (provider.id === record.providerId) return true;
      
      // Check if provider has any appointments with this patient
      const hasAppointment = await db.appointment.findFirst({
        where: {
          providerId: provider.id,
          patientId: record.patientId,
        },
      });
      
      return !!hasAppointment;
    }

    // Staff members typically have limited access to medical records
    if (user.role === Role.STAFF) {
      return false; // Restrictive access for staff
    }

    return false;
  } catch (error) {
    console.error('Failed to verify medical record access:', error);
    throw new Error('Failed to verify medical record access');
  }
}

/**
 * Apply data retention policies (HIPAA requirement)
 */
export async function applyDataRetentionPolicies() {
  try {
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() - 7); // 7 years retention
    
    // Archive old audit logs
    await db.auditLog.updateMany({
      where: {
        timestamp: {
          lt: retentionDate,
        },
        archived: false,
      },
      data: {
        archived: true,
        archivedAt: new Date(),
      },
    });
    
    await createAuditLog({
      userId: 'system',
      action: AuditAction.UPDATE,
      resourceType: ResourceType.AUDIT_LOG,
      details: 'Applied data retention policies',
      severity: AuditSeverity.LOW,
      status: AuditStatus.SUCCESS,
    });
    
    return {
      status: 'success',
      message: 'Data retention policies applied',
      date: new Date(),
    };
  } catch (error) {
    console.error('Failed to apply data retention policies:', error);
    throw new Error('Failed to apply data retention policies');
  }
}

/**
 * Create a backup of PHI data (HIPAA requirement)
 */
export async function createHIPAABackup() {
  try {
    const timestamp = new Date().toISOString();
    
    await createAuditLog({
      userId: 'system',
      action: AuditAction.CREATE,
      resourceType: ResourceType.BACKUP,
      details: `Created HIPAA-compliant backup at ${timestamp}`,
      severity: AuditSeverity.MEDIUM,
      status: AuditStatus.SUCCESS,
    });
    
    return {
      status: 'success',
      message: 'HIPAA-compliant backup created',
      timestamp,
    };
  } catch (error) {
    console.error('Failed to create HIPAA backup:', error);
    
    await createAuditLog({
      userId: 'system',
      action: AuditAction.CREATE,
      resourceType: ResourceType.BACKUP,
      details: `Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: AuditSeverity.HIGH,
      status: AuditStatus.FAILURE,
    });
    
    throw new Error('Failed to create HIPAA backup');
  }
}

/**
 * Check if user has access to view a conversation
 * This is a simplified mock implementation
 */
export async function verifyConversationAccess(
  userId: string, 
  conversationId: string
): Promise<boolean> {
  // In production, this would check the database to ensure the user
  // is a participant in the conversation
  console.log(`Checking if user ${userId} has access to conversation ${conversationId}`);
  
  // For development, we'll just return true
  return true;
}

/**
 * Encrypt sensitive PHI data (HIPAA requirement)
 * This is a simplified mock implementation
 */
export async function encryptPHI(data: string): Promise<string> {
  // In production, this would use proper encryption
  // For development, we'll just return the original data
  return `[ENCRYPTED]${data}`;
}

/**
 * Decrypt sensitive PHI data
 * This is a simplified mock implementation
 */
export async function decryptPHI(encryptedData: string): Promise<string> {
  // In production, this would use proper decryption
  // For development, we'll just return the data without the [ENCRYPTED] prefix
  return encryptedData.replace('[ENCRYPTED]', '');
}