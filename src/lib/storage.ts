import crypto from "node:crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { AttachmentEntity } from "@prisma/client";
import { CurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

function uploadRoot() {
  return path.join(/* turbopackIgnore: true */ process.cwd(), "uploads");
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160);
}

export async function saveAttachment({
  file,
  entityType,
  rfqId,
  quotationId,
  approvalId,
  vendorId,
  vendorRegistrationId,
  user,
}: {
  file: File | null;
  entityType: AttachmentEntity;
  rfqId?: string;
  quotationId?: string;
  approvalId?: string;
  vendorId?: string;
  vendorRegistrationId?: string;
  user?: CurrentUser | null;
}) {
  if (!file || file.size === 0) return null;

  const root = uploadRoot();
  const key = `${Date.now()}-${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const relativePath = path.join(entityType.toLowerCase(), key);
  const absolutePath = path.resolve(root, relativePath);

  if (!absolutePath.startsWith(root)) {
    throw new Error("Invalid upload path");
  }

  await mkdir(path.dirname(absolutePath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  const attachment = await prisma.attachment.create({
    data: {
      fileName: file.name,
      storagePath: relativePath,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      entityType,
      rfqId,
      quotationId,
      approvalId,
      vendorId,
      vendorRegistrationId,
      uploadedById: user?.id,
    },
  });

  await logAudit({
    user,
    action: "ATTACHMENT_UPLOADED",
    entityType,
    entityId: attachment.id,
    details: `${file.name} uploaded`,
  });

  return attachment;
}

export function resolveAttachmentPath(storagePath: string) {
  const root = uploadRoot();
  const absolutePath = path.resolve(root, storagePath);
  if (!absolutePath.startsWith(root)) {
    throw new Error("Invalid attachment path");
  }
  return absolutePath;
}
