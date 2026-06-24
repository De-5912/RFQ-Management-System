"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { PasswordResetAudience } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, destroyCurrentSession, requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

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
      roleKey: user.roleKey,
      category: user.category,
      department: user.department,
      vendorId: user.vendorId,
      vendor: user.vendor,
    },
    action: "USER_LOGIN",
    entityType: "USER",
    entityId: user.id,
  });

  redirect(user.category === "VENDOR" ? "/vendor/dashboard" : "/dashboard");
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/login");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const audience = String(formData.get("audience") || "COMPANY_EMPLOYEE") as PasswordResetAudience;
  const user = await prisma.user.findFirst({
    where: {
      email,
      category: audience,
      isActive: true,
      deletedAt: null,
    },
  });

  if (!user) redirect("/forgot-password?requested=1");

  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      audience,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  await logAudit({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleKey: user.roleKey,
      category: user.category,
      department: user.department,
      vendorId: user.vendorId,
    },
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "USER",
    entityId: user.id,
    newValue: { audience },
  });

  redirect(`/reset-password?token=${token}&requested=1`);
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");
  if (!token || password.length < 8) redirect("/reset-password?error=invalid");

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!resetToken) redirect("/reset-password?error=expired");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        passwordUpdatedAt: new Date(),
        mustChangePassword: false,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await logAudit({
    user: {
      id: resetToken.user.id,
      name: resetToken.user.name,
      email: resetToken.user.email,
      role: resetToken.user.role,
      roleKey: resetToken.user.roleKey,
      category: resetToken.user.category,
      department: resetToken.user.department,
      vendorId: resetToken.user.vendorId,
    },
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "USER",
    entityId: resetToken.userId,
  });

  redirect("/login?passwordReset=1");
}

export async function changePasswordAction(formData: FormData) {
  const currentUser = await requireUser();
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  if (newPassword.length < 8) redirect("/change-password?error=length");

  const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
  if (!user) redirect("/login");

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) redirect("/change-password?error=current");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 12),
      passwordUpdatedAt: new Date(),
      mustChangePassword: false,
    },
  });

  await logAudit({
    user: currentUser,
    action: "PASSWORD_CHANGED",
    entityType: "USER",
    entityId: user.id,
  });

  revalidatePath("/change-password");
  redirect("/change-password?changed=1");
}
