"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { VendorType } from "@prisma/client";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { saveAttachment } from "@/lib/storage";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function emailValue(formData: FormData, key: string) {
  return value(formData, key).toLowerCase();
}

async function saveAttachmentFields({
  formData,
  fieldNames,
  entityType,
  vendorId,
  vendorRegistrationId,
  user,
}: {
  formData: FormData;
  fieldNames: string[];
  entityType: "VENDOR" | "VENDOR_REGISTRATION";
  vendorId?: string;
  vendorRegistrationId?: string;
  user?: Awaited<ReturnType<typeof requirePermission>>;
}) {
  for (const fieldName of fieldNames) {
    for (const file of formData.getAll(fieldName)) {
      await saveAttachment({
        file: file as File,
        entityType,
        vendorId,
        vendorRegistrationId,
        user,
      });
    }
  }
}

async function nextVendorCode() {
  const year = new Date().getFullYear();
  const count = await prisma.vendor.count({
    where: { vendorCode: { startsWith: `VND-${year}-` } },
  });
  return `VND-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function createVendorAction(formData: FormData) {
  const user = await requirePermission("manage_vendors");
  const primaryName = value(formData, "primaryContactName") || value(formData, "contactPerson");
  const primaryEmail = emailValue(formData, "primaryContactEmail") || emailValue(formData, "email");
  const primaryMobile = value(formData, "primaryContactMobile") || value(formData, "phone");

  const vendor = await prisma.vendor.create({
    data: {
      vendorCode: value(formData, "vendorCode") || (await nextVendorCode()),
      companyName: value(formData, "companyName"),
      vendorType: (value(formData, "vendorType") || "REGULAR_VENDOR") as VendorType,
      contactPerson: primaryName,
      email: primaryEmail,
      phone: primaryMobile,
      address: value(formData, "address"),
      city: value(formData, "city") || null,
      state: value(formData, "state") || null,
      country: value(formData, "country") || null,
      pinCode: value(formData, "pinCode") || null,
      gstNumber: value(formData, "gstNumber") || null,
      pan: value(formData, "pan") || null,
      category: value(formData, "businessCategory") || value(formData, "category"),
      productCategory: value(formData, "productCategory") || null,
      serviceCategory: value(formData, "serviceCategory") || null,
      approvedStatus: String(formData.get("approvedStatus") || "PENDING") as never,
      pastRating: Number(formData.get("pastRating") || 0),
      paymentTerms: value(formData, "paymentTerms") || null,
      leadTimeHistory: value(formData, "leadTimeHistory") || null,
      primaryContactName: primaryName,
      primaryContactDesignation: value(formData, "primaryContactDesignation") || null,
      primaryContactMobile: primaryMobile,
      primaryContactEmail: primaryEmail,
      secondaryContactName: value(formData, "secondaryContactName") || null,
      secondaryContactDesignation: value(formData, "secondaryContactDesignation") || null,
      secondaryContactMobile: value(formData, "secondaryContactMobile") || null,
      secondaryContactEmail: emailValue(formData, "secondaryContactEmail") || null,
      bankDetails: value(formData, "bankDetails") || null,
      verifiedAt: formData.get("approvedStatus") === "APPROVED" ? new Date() : null,
      verifiedById: formData.get("approvedStatus") === "APPROVED" ? user.id : null,
    },
  });

  await saveAttachmentFields({
    formData,
    fieldNames: ["gstCertificate", "panCopy", "registrationDocuments", "supportingDocuments"],
    entityType: "VENDOR",
    vendorId: vendor.id,
    user,
  });

  await logAudit({
    user,
    action: "VENDOR_CREATED",
    entityType: "VENDOR",
    entityId: vendor.id,
    newValue: { companyName: vendor.companyName, email: vendor.email, vendorType: vendor.vendorType },
  });

  revalidatePath("/vendors");
  redirect(`/vendors/${vendor.id}?created=1`);
}

export async function createVendorRegistrationAction(formData: FormData) {
  const registration = await prisma.vendorRegistration.create({
    data: {
      companyName: value(formData, "companyName"),
      address: value(formData, "address"),
      city: value(formData, "city"),
      state: value(formData, "state"),
      country: value(formData, "country"),
      pinCode: value(formData, "pinCode"),
      primaryContactName: value(formData, "primaryContactName"),
      primaryContactDesignation: value(formData, "primaryContactDesignation") || null,
      primaryContactMobile: value(formData, "primaryContactMobile"),
      primaryContactEmail: emailValue(formData, "primaryContactEmail"),
      secondaryContactName: value(formData, "secondaryContactName") || null,
      secondaryContactDesignation: value(formData, "secondaryContactDesignation") || null,
      secondaryContactMobile: value(formData, "secondaryContactMobile") || null,
      secondaryContactEmail: emailValue(formData, "secondaryContactEmail") || null,
      gstNumber: value(formData, "gstNumber") || null,
      pan: value(formData, "pan") || null,
      bankDetails: value(formData, "bankDetails") || null,
      productCategory: value(formData, "productCategory") || null,
      serviceCategory: value(formData, "serviceCategory") || null,
      businessCategory: value(formData, "businessCategory") || null,
    },
  });

  await saveAttachmentFields({
    formData,
    fieldNames: ["gstCertificate", "panCopy", "supportingDocuments"],
    entityType: "VENDOR_REGISTRATION",
    vendorRegistrationId: registration.id,
  });

  await logAudit({
    action: "VENDOR_REGISTRATION_SUBMITTED",
    entityType: "VENDOR_REGISTRATION",
    entityId: registration.id,
    newValue: { companyName: registration.companyName, status: registration.status },
  });

  redirect("/vendor/register?submitted=1");
}

export async function approveVendorRegistrationAction(formData: FormData) {
  const user = await requirePermission("verify_vendors");
  const registrationId = value(formData, "registrationId");
  const registration = await prisma.vendorRegistration.findUnique({
    where: { id: registrationId },
  });
  if (!registration) redirect("/vendors");

  const vendor = await prisma.vendor.create({
    data: {
      vendorCode: await nextVendorCode(),
      companyName: registration.companyName,
      vendorType: "REGULAR_VENDOR",
      contactPerson: registration.primaryContactName,
      email: registration.primaryContactEmail,
      phone: registration.primaryContactMobile,
      address: registration.address,
      city: registration.city,
      state: registration.state,
      country: registration.country,
      pinCode: registration.pinCode,
      gstNumber: registration.gstNumber,
      pan: registration.pan,
      category: registration.businessCategory || registration.productCategory || "General",
      productCategory: registration.productCategory,
      serviceCategory: registration.serviceCategory,
      approvedStatus: "APPROVED",
      primaryContactName: registration.primaryContactName,
      primaryContactDesignation: registration.primaryContactDesignation,
      primaryContactMobile: registration.primaryContactMobile,
      primaryContactEmail: registration.primaryContactEmail,
      secondaryContactName: registration.secondaryContactName,
      secondaryContactDesignation: registration.secondaryContactDesignation,
      secondaryContactMobile: registration.secondaryContactMobile,
      secondaryContactEmail: registration.secondaryContactEmail,
      bankDetails: registration.bankDetails,
      verifiedAt: new Date(),
      verifiedById: user.id,
    },
  });

  const temporaryPassword = "Temp@12345";
  await prisma.user.create({
    data: {
      name: registration.primaryContactName,
      email: registration.primaryContactEmail,
      passwordHash: await bcrypt.hash(temporaryPassword, 12),
      role: "VENDOR",
      roleKey: "VENDOR",
      category: "VENDOR",
      vendorId: vendor.id,
      phone: registration.primaryContactMobile,
      mustChangePassword: true,
    },
  });

  await prisma.vendorRegistration.update({
    where: { id: registration.id },
    data: {
      status: "ACCOUNT_CREATED",
      createdVendorId: vendor.id,
      verifiedById: user.id,
      verifiedAt: new Date(),
      reviewerComments: value(formData, "comments") || null,
    },
  });

  await logAudit({
    user,
    action: "VENDOR_REGISTRATION_APPROVED",
    entityType: "VENDOR_REGISTRATION",
    entityId: registration.id,
    newValue: {
      vendorId: vendor.id,
      vendorCode: vendor.vendorCode,
      loginEmail: registration.primaryContactEmail,
      temporaryPasswordIssued: true,
    },
  });

  revalidatePath("/vendors");
  redirect(`/vendors/${vendor.id}?verified=1`);
}

export async function rejectVendorRegistrationAction(formData: FormData) {
  const user = await requirePermission("verify_vendors");
  const registrationId = value(formData, "registrationId");
  const comments = value(formData, "comments");
  if (!comments) redirect("/vendors?error=registration-comments");

  await prisma.vendorRegistration.update({
    where: { id: registrationId },
    data: {
      status: "REJECTED",
      reviewerComments: comments,
      verifiedById: user.id,
      verifiedAt: new Date(),
    },
  });

  await logAudit({
    user,
    action: "VENDOR_REGISTRATION_REJECTED",
    entityType: "VENDOR_REGISTRATION",
    entityId: registrationId,
    newValue: { comments },
  });

  revalidatePath("/vendors");
  redirect("/vendors?registrationRejected=1");
}
