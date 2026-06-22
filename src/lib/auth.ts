import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { can, Permission } from "@/lib/permissions";

export const SESSION_COOKIE = "rfq_session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  vendorId: string | null;
  vendor?: { id: string; companyName: string } | null;
};

function sessionHash(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);

  await prisma.session.create({
    data: {
      tokenHash: sessionHash(token),
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: sessionHash(token) },
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: sessionHash(token),
      expiresAt: { gt: new Date() },
      user: { isActive: true, deletedAt: null },
    },
    include: {
      user: {
        include: {
          vendor: { select: { id: true, companyName: true } },
        },
      },
    },
  });

  if (!session) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    department: session.user.department,
    vendorId: session.user.vendorId,
    vendor: session.user.vendor,
  };
}

export async function requireUser(allowedRoles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect(user.role === "VENDOR" ? "/vendor/dashboard" : "/dashboard");
  }
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    redirect(user.role === "VENDOR" ? "/vendor/dashboard" : "/dashboard");
  }
  return user;
}
