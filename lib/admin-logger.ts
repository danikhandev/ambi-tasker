import { prisma } from "../services/prisma";

/**
 * AdminLogger Utility
 * 
 * Provides centralized logging for sensitive administrative actions.
 */
export async function logAdminAction(params: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
}) {
  try {
    await prisma.adminLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        details: params.details,
      },
    });
  } catch (error) {
    console.error("[AdminLogger] Failed to create log entry:", error);
    // We don't throw here to avoid breaking the main operation
  }
}
