import { PrismaClient } from "@prisma/client";

export class AuditService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async logAction(
    entityType: string,
    entityId: string,
    action: string,
    actorUserId: string,
    source: string = "WEB",
    beforeValue?: string | null,
    afterValue?: string | null,
    reason?: string | null
  ) {
    return this.prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        action,
        actorUserId,
        source,
        beforeValue: beforeValue ?? null,
        afterValue: afterValue ?? null,
        reason: reason ?? null,
      },
    });
  }

  async getAuditForEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: "desc" },
    });
  }
}
