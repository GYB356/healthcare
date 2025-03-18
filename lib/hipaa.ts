import { db } from '@/lib/db';
import { AuditLog } from '@prisma/client';

export type AuditAction = 
  | 'view' 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'export' 
  | 'print' 
  | 'access_attempt' 
  | 'login' 
  | 'logout';

export type ResourceType = 
  | 'patient' 
  | 'medicalRecord' 
  | 'appointment' 
  | 'billing' 
  | 'user' 
  | 'message' 
  | 'device';

interface AuditOptions {
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  medicalRecordId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

export async function createAuditLog(options: AuditOptions): Promise<AuditLog> {
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
    }
  });
}

export async function getAuditLogs(
  filters: {
    userId?: string;
    resourceType?: ResourceType;
    resourceId?: string;
    medicalRecordId?: string;
    startDate?: Date;
    endDate?: Date;
  },
  pagination: {
    page?: number;
    limit?: number;
  } = {}
) {
  const { userId, resourceType, resourceId, medicalRecordId, startDate, endDate } = filters;
  const { page = 1, limit = 50 } = pagination;
  const skip = (page - 1) * limit;
  
  const where: any = {};
  
  if (userId) where.userId = userId;
  if (resourceType) where.resourceType = resourceType;
  if (resourceId) where.resourceId = resourceId;
  if (medicalRecordId) where.medicalRecordId = medicalRecordId;
  
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
  
  return {
    logs,
    pagination: {
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit,
    },
  };
}