"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, destroyCurrentSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await prisma.user.findUnique({
    where: { email },
    include: { vendor: true },
  });

  if (!user || !user.isActive || user.deletedAt) {
    redirect("/login?error=invalid");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    redirect("/login?error=invalid");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await createSession(user.id);
  await logAudit({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      vendorId: user.vendorId,
      vendor: user.vendor,
    },
    action: "USER_LOGIN",
    entityType: "USER",
    entityId: user.id,
  });

  redirect(user.role === "VENDOR" ? "/vendor/dashboard" : "/dashboard");
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/login");
}
