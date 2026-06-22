import { Prisma } from "@prisma/client";
import { CurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AuditInput = {
  user?: CurrentUser | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
};

export async function logAudit(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      userId: input.user?.id,
      userRole: input.user?.role,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValue: input.oldValue,
      newValue: input.newValue,
      details: input.details,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}
