import { Prisma } from "@prisma/client";
import { CurrentUser } from "@/lib/auth";
import { canViewAllCompanyRfqs } from "@/lib/permissions";

export function companyRfqWhere(user: CurrentUser): Prisma.RFQWhereInput {
  const base: Prisma.RFQWhereInput = { deletedAt: null };

  if (canViewAllCompanyRfqs(user.role)) {
    return base;
  }

  if (user.role === "PURCHASE_EXECUTIVE") {
    return { ...base, createdById: user.id };
  }

  if (user.role === "DEPARTMENT_REQUESTER") {
    return { ...base, department: user.department ?? "__none__" };
  }

  return { ...base, createdById: user.id };
}

export function vendorRfqWhere(user: CurrentUser): Prisma.RFQWhereInput {
  return {
    deletedAt: null,
    vendors: { some: { vendorId: user.vendorId ?? "__none__" } },
  };
}
