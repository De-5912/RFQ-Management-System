import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function lockExpiredQuotations(rfqId?: string) {
  const quotations = await prisma.quotation.findMany({
    where: {
      status: "SUBMITTED",
      lockedAt: null,
      rfq: {
        deadline: { lt: new Date() },
        ...(rfqId ? { id: rfqId } : {}),
      },
    },
    include: { rfq: true, vendor: true },
  });

  for (const quotation of quotations) {
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: "LOCKED", lockedAt: new Date() },
    });

    await logAudit({
      action: "QUOTATION_LOCKED_AFTER_DEADLINE",
      entityType: "QUOTATION",
      entityId: quotation.id,
      details: `${quotation.vendor.companyName} quotation locked for ${quotation.rfq.rfqNumber}`,
    });
  }

  return quotations.length;
}
