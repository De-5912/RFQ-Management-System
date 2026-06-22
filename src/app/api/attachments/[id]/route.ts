import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { resolveAttachmentPath } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: {
      rfq: { include: { vendors: true } },
      quotation: true,
    },
  });

  if (!attachment) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (user.role === "VENDOR") {
    const canReadRFQ =
      attachment.rfq?.vendors.some((item) => item.vendorId === user.vendorId) ??
      false;
    const canReadOwnQuote = attachment.quotation?.vendorId === user.vendorId;
    if (!canReadRFQ && !canReadOwnQuote) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const file = await readFile(resolveAttachmentPath(attachment.storagePath));
  await logAudit({
    user,
    action: "ATTACHMENT_DOWNLOADED",
    entityType: "ATTACHMENT",
    entityId: attachment.id,
    details: attachment.fileName,
  });

  return new NextResponse(file, {
    headers: {
      "content-type": attachment.mimeType,
      "content-disposition": `attachment; filename="${attachment.fileName.replaceAll('"', "")}"`,
    },
  });
}
