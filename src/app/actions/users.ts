"use server";

import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getCompanyEmailPolicy } from "@/lib/auth-config";
import { isCompanyRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function createUserAction(formData: FormData) {
  const admin = await requirePermission("manage_users");
  const password = String(formData.get("password") || "Password@123");
  const role = String(formData.get("role") || "DEPARTMENT_REQUESTER") as Role;
  const vendorId = String(formData.get("vendorId") || "") || null;
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const category = role === "VENDOR" ? "VENDOR" : "COMPANY_EMPLOYEE";

  if (isCompanyRole(role) && !getCompanyEmailPolicy().allows(email)) {
    redirect("/settings/users?error=company-domain");
  }

  const user = await prisma.user.create({
    data: {
      name: String(formData.get("name") || "").trim(),
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      roleKey: role,
      category,
      designation: String(formData.get("designation") || "").trim() || null,
      department: String(formData.get("department") || "").trim() || null,
      vendorId: role === "VENDOR" ? vendorId : null,
      phone: String(formData.get("phone") || "").trim() || null,
      isActive: formData.get("isActive") !== "off",
    },
  });

  await logAudit({
    user: admin,
    action: "USER_CREATED",
    entityType: "USER",
    entityId: user.id,
    newValue: { email: user.email, role: user.role },
  });

  revalidatePath("/settings/users");
  redirect("/settings/users?created=1");
}
