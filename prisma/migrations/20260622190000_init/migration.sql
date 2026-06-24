-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PURCHASE_EXECUTIVE', 'PURCHASE_MANAGER', 'HOD', 'FINANCE', 'DEPARTMENT_REQUESTER', 'EMPLOYEE', 'BUYER_PURCHASE_EXECUTIVE', 'REGION_HEAD', 'EVALUATION_MANAGER', 'INSTALLATION_HOD', 'MAINTENANCE_HOD', 'MOD_HOD', 'ADMIN_HOD', 'SAFETY_HOD', 'QUALITY_HOD', 'SALES_HOD', 'PURCHASE_HOD', 'HOS', 'ADMINISTRATOR', 'VENDOR');

-- CreateEnum
CREATE TYPE "UserCategory" AS ENUM ('COMPANY_EMPLOYEE', 'VENDOR');

-- CreateEnum
CREATE TYPE "RFQStatus" AS ENUM ('DRAFT', 'RFQ_PREPARED', 'RFQ_SENT', 'QUOTATION_AWAITED', 'QUOTATION_RECEIVED', 'UNDER_COMPARISON', 'NEGOTIATION', 'FINAL_VENDOR_SELECTED', 'APPROVED', 'PO_CREATED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VendorApprovalStatus" AS ENUM ('APPROVED', 'CONDITIONAL', 'BLOCKED', 'PENDING');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('REGULAR_VENDOR', 'OEM', 'AUTHORIZED_VENDOR', 'CUSTOMIZED_VENDOR');

-- CreateEnum
CREATE TYPE "VendorRegistrationStatus" AS ENUM ('PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'ACCOUNT_CREATED');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'LOCKED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'PARTIALLY_AVAILABLE', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "TechnicalCompliance" AS ENUM ('COMPLIANT', 'PARTIAL', 'NON_COMPLIANT', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "RFQType" AS ENUM ('NORMAL', 'SPECIAL');

-- CreateEnum
CREATE TYPE "RFQApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComparisonStatus" AS ENUM ('NOT_GENERATED', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ComparisonApprovalStage" AS ENUM ('RFQ_APPROVAL', 'STAGE_1', 'STAGE_2', 'STAGE_3', 'STAGE_4');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttachmentEntity" AS ENUM ('RFQ', 'QUOTATION', 'COMPARISON', 'APPROVAL', 'EMAIL_SCREENSHOT', 'PO', 'VENDOR', 'VENDOR_REGISTRATION');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'FAILED', 'LOGGED_ONLY');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('NOT_READY', 'PENDING', 'SENT', 'FAILED', 'SYNCED');

-- CreateEnum
CREATE TYPE "PasswordResetAudience" AS ENUM ('COMPANY_EMPLOYEE', 'VENDOR');

-- CreateTable
CREATE TABLE "RoleDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "UserCategory" NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "roleKey" TEXT,
    "category" "UserCategory" NOT NULL DEFAULT 'COMPANY_EMPLOYEE',
    "designation" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "vendorId" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "passwordUpdatedAt" TIMESTAMP(3),
    "verifiedCompanyEmail" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "vendorCode" TEXT,
    "companyName" TEXT NOT NULL,
    "vendorType" "VendorType" NOT NULL DEFAULT 'REGULAR_VENDOR',
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "pinCode" TEXT,
    "gstNumber" TEXT,
    "pan" TEXT,
    "category" TEXT NOT NULL,
    "productCategory" TEXT,
    "serviceCategory" TEXT,
    "approvedStatus" "VendorApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "pastRating" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "paymentTerms" TEXT,
    "leadTimeHistory" TEXT,
    "primaryContactName" TEXT,
    "primaryContactDesignation" TEXT,
    "primaryContactMobile" TEXT,
    "primaryContactEmail" TEXT,
    "secondaryContactName" TEXT,
    "secondaryContactDesignation" TEXT,
    "secondaryContactMobile" TEXT,
    "secondaryContactEmail" TEXT,
    "bankDetails" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQ" (
    "id" TEXT NOT NULL,
    "rfqNumber" TEXT NOT NULL,
    "rfqDate" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "department" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredDeliveryDate" TIMESTAMP(3),
    "deliveryLocation" TEXT NOT NULL,
    "technicalSpecification" TEXT,
    "preferredMake" TEXT,
    "paymentTerms" TEXT,
    "warrantyRequirement" TEXT,
    "taxes" TEXT,
    "remarks" TEXT,
    "rfqType" "RFQType" NOT NULL DEFAULT 'NORMAL',
    "rfqApprovalStatus" "RFQApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "rfqApprovedAt" TIMESTAMP(3),
    "rfqApprovedById" TEXT,
    "specialVendorJustification" TEXT,
    "comparisonStatus" "ComparisonStatus" NOT NULL DEFAULT 'NOT_GENERATED',
    "comparisonGeneratedAt" TIMESTAMP(3),
    "comparisonRejectedAt" TIMESTAMP(3),
    "comparisonRejectionComments" TEXT,
    "sapReferenceNumber" TEXT,
    "integrationStatus" "IntegrationStatus" NOT NULL DEFAULT 'NOT_READY',
    "status" "RFQStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "finalVendorId" TEXT,
    "poNumber" TEXT,
    "poCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "RFQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQItem" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "partNumber" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL,
    "uom" TEXT NOT NULL,
    "technicalSpecification" TEXT,
    "preferredMake" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQVendor" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailSentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "noQuoteReason" TEXT,
    "notes" TEXT,

    CONSTRAINT "RFQVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "submittedById" TEXT,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "availability" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "quantityOffered" DECIMAL(14,3),
    "baseTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "freightCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "packingCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "leadTimeDays" INTEGER,
    "paymentTerms" TEXT,
    "warranty" TEXT,
    "taxCode" TEXT,
    "hsn" TEXT,
    "hsc" TEXT,
    "importDuty" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "retention" TEXT,
    "bankGuarantee" TEXT,
    "otherCommercialTerms" TEXT,
    "validityDate" TIMESTAMP(3),
    "technicalCompliance" "TechnicalCompliance" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "remarks" TEXT,
    "submittedAt" TIMESTAMP(3),
    "lastEditedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "rfqItemId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "totalPrice" DECIMAL(14,2) NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "entityType" "AttachmentEntity" NOT NULL,
    "rfqId" TEXT,
    "quotationId" TEXT,
    "approvalId" TEXT,
    "vendorId" TEXT,
    "vendorRegistrationId" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRegistration" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "pinCode" TEXT NOT NULL,
    "primaryContactName" TEXT NOT NULL,
    "primaryContactDesignation" TEXT,
    "primaryContactMobile" TEXT NOT NULL,
    "primaryContactEmail" TEXT NOT NULL,
    "secondaryContactName" TEXT,
    "secondaryContactDesignation" TEXT,
    "secondaryContactMobile" TEXT,
    "secondaryContactEmail" TEXT,
    "gstNumber" TEXT,
    "pan" TEXT,
    "bankDetails" TEXT,
    "productCategory" TEXT,
    "serviceCategory" TEXT,
    "businessCategory" TEXT,
    "status" "VendorRegistrationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "reviewerComments" TEXT,
    "createdVendorId" TEXT,
    "verifiedById" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "selectedVendorId" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonApproval" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "stage" "ComparisonApprovalStage" NOT NULL,
    "approverRoleKey" TEXT,
    "approverRole" "Role",
    "approverId" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComparisonApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userRole" "Role",
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "audience" "PasswordResetAudience" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "providerMessageId" TEXT,
    "error" TEXT,
    "sentById" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportDownloadLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "filters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportDownloadLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemServiceCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "defaultUom" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemServiceCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoleDefinition_key_key" ON "RoleDefinition"("key");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_vendorCode_key" ON "Vendor"("vendorCode");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_email_key" ON "Vendor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RFQ_rfqNumber_key" ON "RFQ"("rfqNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RFQItem_rfqId_lineNumber_key" ON "RFQItem"("rfqId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RFQVendor_rfqId_vendorId_key" ON "RFQVendor"("rfqId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_rfqId_vendorId_key" ON "Quotation"("rfqId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonApproval_rfqId_stage_key" ON "ComparisonApproval"("rfqId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ItemServiceCatalog_name_key" ON "ItemServiceCatalog"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleKey_fkey" FOREIGN KEY ("roleKey") REFERENCES "RoleDefinition"("key") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_finalVendorId_fkey" FOREIGN KEY ("finalVendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQItem" ADD CONSTRAINT "RFQItem_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQVendor" ADD CONSTRAINT "RFQVendor_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQVendor" ADD CONSTRAINT "RFQVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_rfqItemId_fkey" FOREIGN KEY ("rfqItemId") REFERENCES "RFQItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "Approval"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_vendorRegistrationId_fkey" FOREIGN KEY ("vendorRegistrationId") REFERENCES "VendorRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRegistration" ADD CONSTRAINT "VendorRegistration_createdVendorId_fkey" FOREIGN KEY ("createdVendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRegistration" ADD CONSTRAINT "VendorRegistration_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_selectedVendorId_fkey" FOREIGN KEY ("selectedVendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonApproval" ADD CONSTRAINT "ComparisonApproval_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonApproval" ADD CONSTRAINT "ComparisonApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportDownloadLog" ADD CONSTRAINT "ReportDownloadLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

