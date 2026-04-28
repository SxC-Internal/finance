import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";

export async function writeAuditLog({
  userId,
  action,
  resourceType,
  resourceId,
  payload,
}: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        payload: payload as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    logger.error("Failed to write audit log", {
      userId,
      action,
      resourceType,
      error: String(error),
    });
  }
}
