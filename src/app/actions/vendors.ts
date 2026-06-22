"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function createVendorAction(formData: FormData) {
  const user = await requirePermission("manage_vendors");

  const vendor = await prisma.vendor.create({
    data: {
      companyName: String(formData.get("companyName") || "").trim(),
      contactPerson: String(formData.get("contactPerson") || "").trim(),
      email: String(formData.get("email") || "").trim().toLowerCase(),
      phone: String(formData.get("phone") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      gstNumber: String(formData.get("gstNumber") || "").trim() || null,
      pan: String(formData.get("pan") || "").trim() || null,
      category: String(formData.get("category") || "").trim(),
      approvedStatus: String(formData.get("approvedStatus") || "PENDING") as never,
      pastRating: Number(formData.get("pastRating") || 0),
      paymentTerms: String(formData.get("paymentTerms") || "").trim() || null,
      leadTimeHistory: String(formData.get("leadTimeHistory") || "").trim() || null,
    },
  });

  await logAudit({
    user,
    action: "VENDOR_CREATED",
    entityType: "VENDOR",
    entityId: vendor.id,
    newValue: { companyName: vendor.companyName, email: vendor.email },
  });

  revalidatePath("/vendors");
  redirect(`/vendors/${vendor.id}?created=1`);
}
