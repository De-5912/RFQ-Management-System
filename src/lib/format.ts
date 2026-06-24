import {
  ApprovalStatus,
  AvailabilityStatus,
  ComparisonApprovalStage,
  EmailStatus,
  ComparisonStatus,
  IntegrationStatus,
  QuotationStatus,
  RFQApprovalStatus,
  RFQStatus,
  RFQType,
  Role,
  TechnicalCompliance,
  VendorApprovalStatus,
  VendorType,
} from "@prisma/client";

export function formatRole(role: Role) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatStatus(
  status:
    | RFQStatus
    | QuotationStatus
    | ApprovalStatus
    | AvailabilityStatus
    | VendorApprovalStatus
    | TechnicalCompliance
    | EmailStatus
    | RFQApprovalStatus
    | ComparisonStatus
    | ComparisonApprovalStage
    | RFQType
    | IntegrationStatus
    | VendorType,
) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(date?: Date | string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function formatDateTime(date?: Date | string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatMoney(value: unknown) {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : typeof value === "object" && value && "toNumber" in value
          ? (value as { toNumber: () => number }).toNumber()
          : 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && value && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return 0;
}

export function isPast(date: Date | string) {
  return new Date(date).getTime() < Date.now();
}
