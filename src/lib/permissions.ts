import { RFQStatus, Role } from "@prisma/client";

export type Permission =
  | "manage_users"
  | "manage_vendors"
  | "manage_rfqs"
  | "assign_vendors"
  | "send_rfq_email"
  | "submit_quotation"
  | "view_comparison"
  | "approve_vendor_selection"
  | "view_finance_data"
  | "view_audit_logs"
  | "download_reports"
  | "update_po_status";

const permissionsByRole: Record<Role, Permission[]> = {
  ADMIN: [
    "manage_users",
    "manage_vendors",
    "manage_rfqs",
    "assign_vendors",
    "send_rfq_email",
    "view_comparison",
    "approve_vendor_selection",
    "view_finance_data",
    "view_audit_logs",
    "download_reports",
    "update_po_status",
  ],
  PURCHASE_EXECUTIVE: [
    "manage_rfqs",
    "assign_vendors",
    "send_rfq_email",
    "view_comparison",
    "download_reports",
  ],
  PURCHASE_MANAGER: [
    "manage_vendors",
    "manage_rfqs",
    "assign_vendors",
    "send_rfq_email",
    "view_comparison",
    "view_audit_logs",
    "download_reports",
    "update_po_status",
  ],
  HOD: ["view_comparison", "approve_vendor_selection", "download_reports"],
  FINANCE: ["view_comparison", "view_finance_data", "download_reports"],
  DEPARTMENT_REQUESTER: ["manage_rfqs"],
  VENDOR: ["submit_quotation"],
};

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
  return ["ADMIN", "PURCHASE_MANAGER", "HOD", "FINANCE"].includes(role);
}

export function companyRoles(): Role[] {
  return [
    "ADMIN",
    "PURCHASE_EXECUTIVE",
    "PURCHASE_MANAGER",
    "HOD",
    "FINANCE",
    "DEPARTMENT_REQUESTER",
  ];
}

export function vendorRoles(): Role[] {
  return ["VENDOR"];
}
