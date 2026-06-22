"use server";

import { ApprovalStatus, RFQStatus, Role, TechnicalCompliance } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { calculateBaseTotal } from "@/lib/comparison";
import { sendRFQEmail } from "@/lib/email";
import { toNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { lockExpiredQuotations } from "@/lib/quotation-locks";
import { saveAttachment } from "@/lib/storage";

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function optionalDate(value: string) {
  return value ? new Date(value) : null;
}

async function nextRFQNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.rFQ.count({
    where: {
      rfqNumber: { startsWith: `RFQ-${year}-` },
    },
  });
  return `RFQ-${year}-${String(count + 1).padStart(3, "0")}`;
}

function parseRFQItems(formData: FormData) {
  const items = [];
  for (let i = 0; i < 10; i += 1) {
    const description = stringValue(formData, `itemDescription-${i}`);
    if (!description) continue;
    items.push({
      lineNumber: items.length + 1,
      description,
      partNumber: stringValue(formData, `itemPartNumber-${i}`) || null,
      quantity: Number(formData.get(`itemQuantity-${i}`) || 0),
      uom: stringValue(formData, `itemUom-${i}`) || "EA",
      technicalSpecification:
        stringValue(formData, `itemTechnicalSpecification-${i}`) || null,
      preferredMake: stringValue(formData, `itemPreferredMake-${i}`) || null,
      remarks: stringValue(formData, `itemRemarks-${i}`) || null,
    });
  }
  return items;
}

export async function createRFQAction(formData: FormData) {
  const user = await requirePermission("manage_rfqs");
  const items = parseRFQItems(formData);
  if (items.length === 0) redirect("/rfqs/new?error=items");

  const rfq = await prisma.rFQ.create({
    data: {
      rfqNumber: await nextRFQNumber(),
      rfqDate: optionalDate(stringValue(formData, "rfqDate")) ?? new Date(),
      deadline: optionalDate(stringValue(formData, "deadline")) ?? new Date(),
      department: stringValue(formData, "department"),
      requesterName: stringValue(formData, "requesterName"),
      description: stringValue(formData, "description"),
      requiredDeliveryDate: optionalDate(stringValue(formData, "requiredDeliveryDate")),
      deliveryLocation: stringValue(formData, "deliveryLocation"),
      technicalSpecification: stringValue(formData, "technicalSpecification") || null,
      preferredMake: stringValue(formData, "preferredMake") || null,
      paymentTerms: stringValue(formData, "paymentTerms") || null,
      warrantyRequirement: stringValue(formData, "warrantyRequirement") || null,
      taxes: stringValue(formData, "taxes") || null,
      remarks: stringValue(formData, "remarks") || null,
      status: "RFQ_PREPARED",
      createdById: user.id,
      items: { create: items },
    },
  });

  await saveAttachment({
    file: formData.get("attachment") as File | null,
    entityType: "RFQ",
    rfqId: rfq.id,
    user,
  });

  await logAudit({
    user,
    action: "RFQ_CREATED",
    entityType: "RFQ",
    entityId: rfq.id,
    newValue: { rfqNumber: rfq.rfqNumber, status: rfq.status },
  });

  revalidatePath("/rfqs");
  redirect(`/rfqs/${rfq.id}?created=1`);
}

export async function updateRFQAction(formData: FormData) {
  const user = await requirePermission("manage_rfqs");
  const rfqId = stringValue(formData, "rfqId");
  const items = parseRFQItems(formData);
  const oldRFQ = await prisma.rFQ.findUnique({ where: { id: rfqId }, include: { items: true } });

  if (!oldRFQ) redirect("/rfqs");

  await prisma.$transaction([
    prisma.rFQItem.deleteMany({ where: { rfqId } }),
    prisma.rFQ.update({
      where: { id: rfqId },
      data: {
        rfqDate: optionalDate(stringValue(formData, "rfqDate")) ?? oldRFQ.rfqDate,
        deadline: optionalDate(stringValue(formData, "deadline")) ?? oldRFQ.deadline,
        department: stringValue(formData, "department"),
        requesterName: stringValue(formData, "requesterName"),
        description: stringValue(formData, "description"),
        requiredDeliveryDate: optionalDate(stringValue(formData, "requiredDeliveryDate")),
        deliveryLocation: stringValue(formData, "deliveryLocation"),
        technicalSpecification: stringValue(formData, "technicalSpecification") || null,
        preferredMake: stringValue(formData, "preferredMake") || null,
        paymentTerms: stringValue(formData, "paymentTerms") || null,
        warrantyRequirement: stringValue(formData, "warrantyRequirement") || null,
        taxes: stringValue(formData, "taxes") || null,
        remarks: stringValue(formData, "remarks") || null,
        items: { create: items },
      },
    }),
  ]);

  await saveAttachment({
    file: formData.get("attachment") as File | null,
    entityType: "RFQ",
    rfqId,
    user,
  });

  await logAudit({
    user,
    action: "RFQ_EDITED",
    entityType: "RFQ",
    entityId: rfqId,
    oldValue: { description: oldRFQ.description, itemCount: oldRFQ.items.length },
    newValue: { description: stringValue(formData, "description"), itemCount: items.length },
  });

  revalidatePath(`/rfqs/${rfqId}`);
  redirect(`/rfqs/${rfqId}?saved=1`);
}

export async function changeRFQStatusAction(formData: FormData) {
  const user = await requirePermission("manage_rfqs");
  const rfqId = stringValue(formData, "rfqId");
  const status = stringValue(formData, "status") as RFQStatus;
  const oldRFQ = await prisma.rFQ.findUnique({ where: { id: rfqId } });
  if (!oldRFQ) redirect("/rfqs");

  const rfq = await prisma.rFQ.update({
    where: { id: rfqId },
    data: { status },
  });

  await logAudit({
    user,
    action: "RFQ_STATUS_CHANGED",
    entityType: "RFQ",
    entityId: rfqId,
    oldValue: { status: oldRFQ.status },
    newValue: { status: rfq.status },
  });

  revalidatePath(`/rfqs/${rfqId}`);
}

export async function assignVendorsAction(formData: FormData) {
  const user = await requirePermission("assign_vendors");
  const rfqId = stringValue(formData, "rfqId");
  const vendorIds = formData
    .getAll("vendorIds")
    .map((value) => String(value))
    .filter(Boolean);

  if (vendorIds.length === 0) redirect(`/rfqs/${rfqId}/vendors?error=vendors`);

  await prisma.rFQVendor.createMany({
    data: vendorIds.map((vendorId) => ({ rfqId, vendorId })),
    skipDuplicates: true,
  });

  await prisma.rFQ.update({
    where: { id: rfqId },
    data: { status: "QUOTATION_AWAITED" },
  });

  for (const vendorId of vendorIds) {
    await logAudit({
      user,
      action: "VENDOR_ASSIGNED_TO_RFQ",
      entityType: "RFQ",
      entityId: rfqId,
      newValue: { vendorId },
    });
    await sendRFQEmail({ rfqId, vendorId, sentBy: user });
  }

  revalidatePath(`/rfqs/${rfqId}`);
  redirect(`/rfqs/${rfqId}?sent=1`);
}

function parseQuotationItems(formData: FormData) {
  const items = [];
  for (let i = 0; i < 20; i += 1) {
    const description = stringValue(formData, `quoteDescription-${i}`);
    const rfqItemId = stringValue(formData, `rfqItemId-${i}`) || null;
    if (!description) continue;
    const quantity = Number(formData.get(`quoteQuantity-${i}`) || 0);
    const unitPrice = Number(formData.get(`quoteUnitPrice-${i}`) || 0);
    items.push({
      rfqItemId,
      description,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      taxAmount: Number(formData.get(`quoteTaxAmount-${i}`) || 0),
      remarks: stringValue(formData, `quoteRemarks-${i}`) || null,
    });
  }
  return items;
}

export async function submitQuotationAction(formData: FormData) {
  const user = await requireUser(["VENDOR" as Role]);
  const rfqId = stringValue(formData, "rfqId");
  const existingQuotationId = stringValue(formData, "quotationId") || undefined;

  const rfq = await prisma.rFQ.findFirst({
    where: {
      id: rfqId,
      vendors: { some: { vendorId: user.vendorId ?? "__none__" } },
    },
    include: { quotations: { where: { vendorId: user.vendorId ?? "__none__" } } },
  });

  if (!rfq || !user.vendorId) redirect("/vendor/rfqs");

  await lockExpiredQuotations(rfqId);
  if (rfq.deadline.getTime() < Date.now()) {
    redirect(`/vendor/rfqs/${rfqId}/quote?locked=1`);
  }

  const items = parseQuotationItems(formData);
  if (items.length === 0) redirect(`/vendor/rfqs/${rfqId}/quote?error=items`);

  const discount = Number(formData.get("discount") || 0);
  const baseTotal = calculateBaseTotal(items, discount);
  const taxTotal = items.reduce((sum, item) => sum + toNumber(item.taxAmount), 0);
  const commonData = {
    status: "SUBMITTED" as const,
    baseTotal,
    taxTotal,
    freightCost: Number(formData.get("freightCost") || 0),
    packingCost: Number(formData.get("packingCost") || 0),
    discount,
    leadTimeDays: Number(formData.get("leadTimeDays") || 0) || null,
    paymentTerms: stringValue(formData, "paymentTerms") || null,
    warranty: stringValue(formData, "warranty") || null,
    validityDate: optionalDate(stringValue(formData, "validityDate")),
    technicalCompliance:
      (stringValue(formData, "technicalCompliance") || "NOT_APPLICABLE") as TechnicalCompliance,
    remarks: stringValue(formData, "remarks") || null,
    submittedById: user.id,
    lastEditedAt: new Date(),
  };

  const existing = rfq.quotations[0];
  let quotation;
  if (existing || existingQuotationId) {
    const quotationId = existingQuotationId ?? existing.id;
    const oldQuotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: true },
    });
    if (!oldQuotation || oldQuotation.vendorId !== user.vendorId) {
      redirect("/vendor/quotations");
    }
    if (oldQuotation.lockedAt || oldQuotation.status === "LOCKED") {
      redirect(`/vendor/rfqs/${rfqId}/quote?locked=1`);
    }
    quotation = await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        ...commonData,
        items: {
          deleteMany: {},
          create: items,
        },
      },
    });
    await logAudit({
      user,
      action: "VENDOR_EDITED_QUOTATION",
      entityType: "QUOTATION",
      entityId: quotation.id,
      oldValue: { baseTotal: oldQuotation.baseTotal.toString() },
      newValue: { baseTotal },
    });
  } else {
    quotation = await prisma.quotation.create({
      data: {
        ...commonData,
        rfqId,
        vendorId: user.vendorId,
        submittedAt: new Date(),
        items: { create: items },
      },
    });
    await logAudit({
      user,
      action: "VENDOR_SUBMITTED_QUOTATION",
      entityType: "QUOTATION",
      entityId: quotation.id,
      newValue: { baseTotal },
    });
  }

  await saveAttachment({
    file: formData.get("attachment") as File | null,
    entityType: "QUOTATION",
    quotationId: quotation.id,
    user,
  });

  await prisma.rFQ.update({
    where: { id: rfqId },
    data: { status: "QUOTATION_RECEIVED" },
  });

  revalidatePath(`/vendor/rfqs/${rfqId}`);
  redirect(`/vendor/rfqs/${rfqId}?submitted=1`);
}

export async function selectFinalVendorAction(formData: FormData) {
  const user = await requirePermission("view_comparison");
  const rfqId = stringValue(formData, "rfqId");
  const vendorId = stringValue(formData, "vendorId");

  const hod = await prisma.user.findFirst({
    where: { role: "HOD", isActive: true, deletedAt: null },
  });

  const rfq = await prisma.rFQ.update({
    where: { id: rfqId },
    data: {
      finalVendorId: vendorId,
      status: "FINAL_VENDOR_SELECTED",
    },
  });

  if (hod) {
    await prisma.approval.create({
      data: {
        rfqId,
        approverId: hod.id,
        selectedVendorId: vendorId,
        comments: "Generated from comparison final vendor selection.",
      },
    });
  }

  await logAudit({
    user,
    action: "VENDOR_SELECTED",
    entityType: "RFQ",
    entityId: rfqId,
    newValue: { finalVendorId: rfq.finalVendorId },
  });

  revalidatePath(`/rfqs/${rfqId}`);
  redirect(`/rfqs/${rfqId}/comparison?selected=1`);
}

export async function submitApprovalAction(formData: FormData) {
  const user = await requirePermission("approve_vendor_selection");
  const approvalId = stringValue(formData, "approvalId");
  const status = stringValue(formData, "status") as ApprovalStatus;
  const comments = stringValue(formData, "comments") || null;

  const approval = await prisma.approval.update({
    where: { id: approvalId },
    data: {
      status,
      comments,
      decidedAt: new Date(),
      rfq: {
        update: {
          status: status === "APPROVED" ? "APPROVED" : "UNDER_COMPARISON",
        },
      },
    },
    include: { rfq: true },
  });

  await logAudit({
    user,
    action: status === "APPROVED" ? "APPROVAL_SUBMITTED" : "APPROVAL_REJECTED",
    entityType: "APPROVAL",
    entityId: approval.id,
    newValue: { status, comments },
  });

  revalidatePath("/approvals");
  redirect("/approvals?approved=1");
}

export async function updatePOStatusAction(formData: FormData) {
  const user = await requirePermission("update_po_status");
  const rfqId = stringValue(formData, "rfqId");
  const poNumber = stringValue(formData, "poNumber");

  await prisma.rFQ.update({
    where: { id: rfqId },
    data: {
      poNumber,
      poCreatedAt: new Date(),
      status: "PO_CREATED",
    },
  });

  await logAudit({
    user,
    action: "PO_STATUS_UPDATED",
    entityType: "RFQ",
    entityId: rfqId,
    newValue: { poNumber },
  });

  revalidatePath(`/rfqs/${rfqId}`);
  redirect(`/rfqs/${rfqId}?po=1`);
}

export async function logReportDownloadAction(formData: FormData) {
  const user = await requirePermission("download_reports");
  const reportType = stringValue(formData, "reportType");

  await prisma.reportDownloadLog.create({
    data: {
      userId: user.id,
      reportType,
      filters: {},
    },
  });

  await logAudit({
    user,
    action: "REPORT_DOWNLOADED",
    entityType: "REPORT",
    entityId: reportType,
  });

  revalidatePath("/reports");
}
