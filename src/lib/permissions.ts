import { RFQStatus, Role, UserCategory } from "@prisma/client";

export type Permission =
  | "create_rfqs"
  | "manage_users"
  | "manage_vendors"
  | "verify_vendors"
  | "manage_rfqs"
  | "approve_rfqs"
  | "assign_vendors"
  | "release_rfqs"
  | "send_rfq_email"
  | "submit_quotation"
  | "view_comparison"
  | "generate_comparison"
  | "approve_comparison"
  | "approve_vendor_selection"
  | "view_finance_data"
  | "view_audit_logs"
  | "download_reports"
  | "update_po_status"
  | "manage_branding"
  | "manage_auth";

export type RoleDefinitionSeed = {
  key: Role;
  name: string;
  category: UserCategory;
  permissions: Permission[];
};

const allPermissions: Permission[] = [
  "create_rfqs",
  "manage_users",
  "manage_vendors",
  "verify_vendors",
  "manage_rfqs",
  "approve_rfqs",
  "assign_vendors",
  "release_rfqs",
  "send_rfq_email",
  "submit_quotation",
  "view_comparison",
  "generate_comparison",
  "approve_comparison",
  "approve_vendor_selection",
  "view_finance_data",
  "view_audit_logs",
  "download_reports",
  "update_po_status",
  "manage_branding",
  "manage_auth",
];

export const companyRoleList: Role[] = [
  "ADMIN",
  "ADMINISTRATOR",
  "EMPLOYEE",
  "DEPARTMENT_REQUESTER",
  "PURCHASE_EXECUTIVE",
  "BUYER_PURCHASE_EXECUTIVE",
  "PURCHASE_MANAGER",
  "REGION_HEAD",
  "EVALUATION_MANAGER",
  "HOD",
  "INSTALLATION_HOD",
  "MAINTENANCE_HOD",
  "MOD_HOD",
  "ADMIN_HOD",
  "SAFETY_HOD",
  "QUALITY_HOD",
  "SALES_HOD",
  "PURCHASE_HOD",
  "HOS",
  "FINANCE",
];

const buyerPermissions: Permission[] = [
  "create_rfqs",
  "manage_rfqs",
  "assign_vendors",
  "release_rfqs",
  "send_rfq_email",
  "view_comparison",
  "generate_comparison",
  "download_reports",
];

const managerPermissions: Permission[] = [
  ...buyerPermissions,
  "manage_vendors",
  "verify_vendors",
  "approve_comparison",
  "view_audit_logs",
  "update_po_status",
];

const hodPermissions: Permission[] = [
  "create_rfqs",
  "approve_rfqs",
  "view_comparison",
  "approve_comparison",
  "approve_vendor_selection",
  "download_reports",
];

const permissionsByRole: Record<Role, Permission[]> = {
  ADMIN: allPermissions,
  ADMINISTRATOR: allPermissions,
  EMPLOYEE: ["create_rfqs"],
  DEPARTMENT_REQUESTER: ["create_rfqs"],
  PURCHASE_EXECUTIVE: buyerPermissions,
  BUYER_PURCHASE_EXECUTIVE: buyerPermissions,
  PURCHASE_MANAGER: managerPermissions,
  REGION_HEAD: ["create_rfqs", "view_comparison", "approve_comparison", "download_reports"],
  EVALUATION_MANAGER: [
    "create_rfqs",
    "view_comparison",
    "approve_comparison",
    "download_reports",
  ],
  HOD: hodPermissions,
  INSTALLATION_HOD: hodPermissions,
  MAINTENANCE_HOD: hodPermissions,
  MOD_HOD: hodPermissions,
  ADMIN_HOD: hodPermissions,
  SAFETY_HOD: hodPermissions,
  QUALITY_HOD: hodPermissions,
  SALES_HOD: hodPermissions,
  PURCHASE_HOD: [
    "create_rfqs",
    "view_comparison",
    "approve_comparison",
    "approve_vendor_selection",
    "download_reports",
  ],
  HOS: ["create_rfqs", "approve_rfqs", "view_comparison", "download_reports"],
  FINANCE: ["create_rfqs", "view_comparison", "view_finance_data", "download_reports"],
  VENDOR: ["submit_quotation"],
};

export const roleDefinitions: RoleDefinitionSeed[] = (Object.keys(permissionsByRole) as Role[])
  .map((role) => ({
    key: role,
    name: role
      .toLowerCase()
      .split("_")
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" "),
    category: role === "VENDOR" ? "VENDOR" : "COMPANY_EMPLOYEE",
    permissions: permissionsByRole[role],
  }));

export const editableStatuses: RFQStatus[] = [
  "DRAFT",
  "RFQ_PREPARED",
  "RFQ_SENT",
  "QUOTATION_AWAITED",
  "QUOTATION_RECEIVED",
  "UNDER_COMPARISON",
  "NEGOTIATION",
  "FINAL_VENDOR_SELECTED",
  "APPROVED",
  "PO_CREATED",
  "CLOSED",
  "CANCELLED",
];

export function can(role: Role, permission: Permission) {
  return permissionsByRole[role]?.includes(permission) ?? false;
}

export function canViewAllCompanyRfqs(role: Role) {
  return [
    "ADMIN",
    "ADMINISTRATOR",
    "PURCHASE_MANAGER",
    "REGION_HEAD",
    "EVALUATION_MANAGER",
    "HOD",
    "INSTALLATION_HOD",
    "MAINTENANCE_HOD",
    "MOD_HOD",
    "ADMIN_HOD",
    "SAFETY_HOD",
    "QUALITY_HOD",
    "SALES_HOD",
    "PURCHASE_HOD",
    "HOS",
    "FINANCE",
  ].includes(role);
}

export function isCompanyRole(role: Role) {
  return companyRoleList.includes(role);
}

export function companyRoles(): Role[] {
  return companyRoleList;
}

export function vendorRoles(): Role[] {
  return ["VENDOR"];
}
