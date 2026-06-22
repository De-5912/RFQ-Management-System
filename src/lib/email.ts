import nodemailer from "nodemailer";
import { EmailStatus } from "@prisma/client";
import { CurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

let transport: nodemailer.Transporter | null = null;

function getTransport() {
  if (transport) return transport;

  if (process.env.SMTP_HOST) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
    });
  } else {
    transport = nodemailer.createTransport({ jsonTransport: true });
  }

  return transport;
}

export async function sendRFQEmail({
  rfqId,
  vendorId,
  sentBy,
}: {
  rfqId: string;
  vendorId: string;
  sentBy: CurrentUser;
}) {
  const [rfq, vendor] = await Promise.all([
    prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: { items: true },
    }),
    prisma.vendor.findUnique({ where: { id: vendorId } }),
  ]);

  if (!rfq || !vendor) {
    throw new Error("RFQ or vendor not found for email");
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const portalUrl = `${appUrl}/vendor/rfqs/${rfq.id}`;
  const subject = `RFQ ${rfq.rfqNumber}: quotation requested by ${rfq.department}`;
  const itemLines = rfq.items
    .map((item) => `- ${item.description} | Qty: ${item.quantity} ${item.uom}`)
    .join("\n");

  const body = `Dear ${vendor.contactPerson},

You have been invited to quote for ${rfq.rfqNumber}.

Department: ${rfq.department}
Requester: ${rfq.requesterName}
Deadline: ${rfq.deadline.toISOString()}
Delivery location: ${rfq.deliveryLocation}

Items:
${itemLines}

Please log in to the vendor portal and submit your quotation:
${portalUrl}

Regards,
Purchase Team`;

  try {
    const info = await getTransport().sendMail({
      from: process.env.EMAIL_FROM || "RFQ Management <rfq.local@example.com>",
      to: vendor.email,
      subject,
      text: body,
    });

    const status: EmailStatus = process.env.SMTP_HOST ? "SENT" : "LOGGED_ONLY";
    const emailLog = await prisma.emailLog.create({
      data: {
        rfqId,
        vendorId,
        toEmail: vendor.email,
        subject,
        body,
        status,
        providerMessageId: info.messageId,
        sentById: sentBy.id,
      },
    });

    await prisma.rFQVendor.updateMany({
      where: { rfqId, vendorId },
      data: { emailSentAt: new Date() },
    });

    await logAudit({
      user: sentBy,
      action: "RFQ_EMAIL_SENT",
      entityType: "RFQ",
      entityId: rfqId,
      details: `${status} email to ${vendor.email}`,
    });

    return emailLog;
  } catch (error) {
    const emailLog = await prisma.emailLog.create({
      data: {
        rfqId,
        vendorId,
        toEmail: vendor.email,
        subject,
        body,
        status: "FAILED",
        error: error instanceof Error ? error.message : String(error),
        sentById: sentBy.id,
      },
    });

    await logAudit({
      user: sentBy,
      action: "RFQ_EMAIL_FAILED",
      entityType: "RFQ",
      entityId: rfqId,
      details: `Email to ${vendor.email} failed`,
    });

    return emailLog;
  }
}
