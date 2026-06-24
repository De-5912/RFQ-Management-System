import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { calculateBaseTotal } from "../src/lib/comparison";
import { fallbackDepartments, fallbackItemServices } from "../src/lib/master-data";
import { roleDefinitions } from "../src/lib/permissions";

const prisma = new PrismaClient();
const password = "Password@123";

async function createUser(input: {
  name: string;
  email: string;
  role: Role;
  department?: string;
  vendorId?: string;
  designation?: string;
}) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      roleKey: input.role,
      category: input.role === "VENDOR" ? "VENDOR" : "COMPANY_EMPLOYEE",
      designation: input.designation ?? null,
      department: input.department,
      vendorId: input.vendorId,
      verifiedCompanyEmail: input.role !== "VENDOR",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
}

async function main() {
  await prisma.reportDownloadLog.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.comparisonApproval.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.rFQVendor.deleteMany();
  await prisma.rFQItem.deleteMany();
  await prisma.rFQ.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.roleDefinition.deleteMany();
  await prisma.vendorRegistration.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.itemServiceCatalog.deleteMany();

  await prisma.roleDefinition.createMany({
    data: roleDefinitions.map((role) => ({
      key: role.key,
      name: role.name,
      category: role.category,
      permissions: role.permissions,
      isSystem: true,
      isActive: true,
    })),
  });

  await prisma.department.createMany({
    data: fallbackDepartments.map((name) => ({ name })),
  });
  await prisma.itemServiceCatalog.createMany({
    data: fallbackItemServices.map((name) => ({ name, category: "General", defaultUom: "EA" })),
  });

  const alpha = await prisma.vendor.create({
    data: {
      vendorCode: "VND-2026-0001",
      companyName: "Alpha Industrial Supplies",
      vendorType: "REGULAR_VENDOR",
      contactPerson: "Ravi Menon",
      email: "vendor.alpha@rfq.local",
      phone: "+91 98765 10001",
      address: "Peenya Industrial Area",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      pinCode: "560058",
      gstNumber: "29ABCDE1234F1Z5",
      pan: "ABCDE1234F",
      category: "Electrical",
      productCategory: "Electrical",
      serviceCategory: "Industrial supplies",
      approvedStatus: "APPROVED",
      pastRating: 4.4,
      paymentTerms: "Within 45 days",
      leadTimeHistory: "Average 12 days for standard motors",
      primaryContactName: "Ravi Menon",
      primaryContactDesignation: "Sales Manager",
      primaryContactMobile: "+91 98765 10001",
      primaryContactEmail: "vendor.alpha@rfq.local",
      secondaryContactName: "Kiran Rao",
      secondaryContactDesignation: "Inside Sales",
      secondaryContactMobile: "+91 98765 10011",
      secondaryContactEmail: "alpha.backup@rfq.local",
      bankDetails: "Local prototype bank details",
      verifiedAt: new Date("2026-06-01T10:00:00+05:30"),
    },
  });

  const beta = await prisma.vendor.create({
    data: {
      vendorCode: "VND-2026-0002",
      companyName: "Beta Power Systems",
      vendorType: "REGULAR_VENDOR",
      contactPerson: "Neha Sharma",
      email: "vendor.beta@rfq.local",
      phone: "+91 98765 10002",
      address: "MIDC",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      pinCode: "411019",
      gstNumber: "27BCDEF2345G1Z2",
      pan: "BCDEF2345G",
      category: "Electrical",
      productCategory: "Electrical",
      serviceCategory: "Power systems",
      approvedStatus: "APPROVED",
      pastRating: 4.1,
      paymentTerms: "Within 30 days",
      leadTimeHistory: "Average 16 days with strong after-sales support",
      primaryContactName: "Neha Sharma",
      primaryContactDesignation: "Key Account Manager",
      primaryContactMobile: "+91 98765 10002",
      primaryContactEmail: "vendor.beta@rfq.local",
    },
  });

  const gamma = await prisma.vendor.create({
    data: {
      vendorCode: "VND-2026-0003",
      companyName: "Gamma Automation OEM",
      vendorType: "OEM",
      contactPerson: "Arun Iyer",
      email: "vendor.gamma@rfq.local",
      phone: "+91 98765 10003",
      address: "Guindy",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
      pinCode: "600032",
      gstNumber: "33CDEFG3456H1Z8",
      pan: "CDEFG3456H",
      category: "Automation OEM",
      productCategory: "Automation",
      serviceCategory: "OEM spares",
      approvedStatus: "APPROVED",
      pastRating: 3.8,
      paymentTerms: "Immediate upon presentation of Invoice",
      leadTimeHistory: "OEM items average 28 days",
      primaryContactName: "Arun Iyer",
      primaryContactDesignation: "OEM Sales",
      primaryContactMobile: "+91 98765 10003",
      primaryContactEmail: "vendor.gamma@rfq.local",
    },
  });

  const admin = await createUser({
    name: "Admin User",
    email: "admin@rfq.local",
    role: "ADMINISTRATOR",
    department: "Administration",
    designation: "System Administrator",
  });
  const employee = await createUser({
    name: "Anita Employee",
    email: "employee@rfq.local",
    role: "EMPLOYEE",
    department: "Maintenance",
    designation: "Maintenance Engineer",
  });
  const buyer = await createUser({
    name: "Priya Buyer",
    email: "buyer@rfq.local",
    role: "BUYER_PURCHASE_EXECUTIVE",
    department: "Purchase",
    designation: "Buyer / Purchase Executive",
  });
  await createUser({
    name: "Mahesh Purchase Manager",
    email: "purchase.manager@rfq.local",
    role: "PURCHASE_MANAGER",
    department: "Purchase",
    designation: "Purchase Manager",
  });
  await createUser({
    name: "Renu Region Head",
    email: "region.head@rfq.local",
    role: "REGION_HEAD",
    department: "Operations",
    designation: "Region Head",
  });
  await createUser({
    name: "Esha Evaluation Manager",
    email: "evaluation.manager@rfq.local",
    role: "EVALUATION_MANAGER",
    department: "Operations",
    designation: "Evaluation Manager",
  });
  const hod = await createUser({
    name: "Maintenance HOD",
    email: "maintenance.hod@rfq.local",
    role: "MAINTENANCE_HOD",
    department: "Maintenance",
    designation: "Maintenance HOD",
  });
  await createUser({
    name: "Purchase HOD",
    email: "purchase.hod@rfq.local",
    role: "PURCHASE_HOD",
    department: "Purchase",
    designation: "Purchase HOD",
  });
  await createUser({
    name: "HOS User",
    email: "hos@rfq.local",
    role: "HOS",
    department: "Operations",
    designation: "Head of Section",
  });
  await createUser({
    name: "Finance Viewer",
    email: "finance@rfq.local",
    role: "FINANCE",
    department: "Finance",
    designation: "Finance",
  });
  await createUser({
    name: "Alpha Vendor User",
    email: "vendor.alpha@rfq.local",
    role: "VENDOR",
    vendorId: alpha.id,
    designation: "Vendor Contact",
  });
  await createUser({
    name: "Beta Vendor User",
    email: "vendor.beta@rfq.local",
    role: "VENDOR",
    vendorId: beta.id,
    designation: "Vendor Contact",
  });
  await createUser({
    name: "Gamma Vendor User",
    email: "vendor.gamma@rfq.local",
    role: "VENDOR",
    vendorId: gamma.id,
    designation: "Vendor Contact",
  });

  await prisma.vendorRegistration.create({
    data: {
      companyName: "Delta Safety Works",
      address: "Industrial Estate",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      pinCode: "500032",
      primaryContactName: "Sonia Mehta",
      primaryContactDesignation: "Partner",
      primaryContactMobile: "+91 98765 10004",
      primaryContactEmail: "vendor.delta@rfq.local",
      secondaryContactName: "Dev Patel",
      secondaryContactDesignation: "Accounts",
      secondaryContactMobile: "+91 98765 10014",
      secondaryContactEmail: "delta.accounts@rfq.local",
      gstNumber: "36DEFGH4567I1Z4",
      pan: "DEFGH4567I",
      bankDetails: "Pending verification bank details",
      productCategory: "Safety equipment",
      serviceCategory: "Safety inspection",
      businessCategory: "Safety",
    },
  });

  const rfq = await prisma.rFQ.create({
    data: {
      rfqNumber: "RFQ-2026-001",
      rfqDate: new Date("2026-06-22T09:00:00+05:30"),
      deadline: new Date("2026-06-29T17:00:00+05:30"),
      department: "Maintenance",
      requesterName: employee.name,
      description: "Motor, cable and sensor requirement for line-2 maintenance",
      requiredDeliveryDate: new Date("2026-07-10T00:00:00+05:30"),
      deliveryLocation: "Main Stores - Plant 1",
      technicalSpecification: "Standard industrial grade, suitable for continuous duty.",
      preferredMake: "Siemens / ABB or equivalent approved make",
      paymentTerms: "Within 45 days",
      warrantyRequirement: "Minimum 12 months from commissioning",
      taxes: "GST extra as applicable",
      remarks: "Alternatives are not allowed for this RFQ.",
      status: "QUOTATION_RECEIVED",
      rfqType: "NORMAL",
      rfqApprovalStatus: "APPROVED",
      rfqApprovedAt: new Date("2026-06-22T09:45:00+05:30"),
      rfqApprovedById: hod.id,
      createdById: employee.id,
      items: {
        create: [
          {
            lineNumber: 1,
            description: "3-phase induction motor",
            partNumber: "MTR-15KW-IE3",
            quantity: 5,
            uom: "PCS",
            technicalSpecification: "15 kW, IE3 efficiency, foot mounted",
            preferredMake: "Siemens / ABB",
          },
          {
            lineNumber: 2,
            description: "Copper power cable",
            partNumber: "4C-16SQMM",
            quantity: 100,
            uom: "MTR",
            technicalSpecification: "4 core 16 sq mm copper armored cable",
          },
          {
            lineNumber: 3,
            description: "Proximity sensor",
            partNumber: "PNP-M18",
            quantity: 10,
            uom: "PCS",
            technicalSpecification: "M18 PNP NO, 10-30 VDC",
          },
        ],
      },
      vendors: {
        create: [
          { vendorId: alpha.id, emailSentAt: new Date("2026-06-22T10:10:00+05:30") },
          { vendorId: beta.id, emailSentAt: new Date("2026-06-22T10:10:00+05:30") },
          { vendorId: gamma.id, emailSentAt: new Date("2026-06-22T10:10:00+05:30") },
        ],
      },
    },
    include: { items: true },
  });

  const alphaItems = [
    { quantity: 5, unitPrice: 42000 },
    { quantity: 100, unitPrice: 620 },
    { quantity: 10, unitPrice: 1450 },
  ];
  const betaItems = [
    { quantity: 5, unitPrice: 40500 },
    { quantity: 100, unitPrice: 675 },
    { quantity: 10, unitPrice: 1550 },
  ];

  await prisma.quotation.create({
    data: {
      rfqId: rfq.id,
      vendorId: alpha.id,
      status: "SUBMITTED",
      availability: "AVAILABLE",
      quantityOffered: 115,
      baseTotal: calculateBaseTotal(alphaItems, 5000),
      taxTotal: 50130,
      freightCost: 8500,
      packingCost: 3000,
      discount: 5000,
      leadTimeDays: 12,
      paymentTerms: "Within 45 days",
      warranty: "18 months",
      taxCode: "GST18",
      hsn: "8501",
      hsc: "LOCAL",
      validityDate: new Date("2026-07-31T00:00:00+05:30"),
      technicalCompliance: "COMPLIANT",
      remarks: "All items quoted as per RFQ specification.",
      submittedAt: new Date("2026-06-23T14:00:00+05:30"),
      lastEditedAt: new Date("2026-06-24T09:30:00+05:30"),
      submittedById: buyer.id,
      items: {
        create: rfq.items.map((item, index) => {
          const quoteItem = alphaItems[index];
          return {
            rfqItemId: item.id,
            description: item.description,
            quantity: quoteItem.quantity,
            unitPrice: quoteItem.unitPrice,
            totalPrice: quoteItem.quantity * quoteItem.unitPrice,
            taxAmount: quoteItem.quantity * quoteItem.unitPrice * 0.18,
          };
        }),
      },
    },
  });

  await prisma.quotation.create({
    data: {
      rfqId: rfq.id,
      vendorId: beta.id,
      status: "SUBMITTED",
      availability: "PARTIALLY_AVAILABLE",
      quantityOffered: 112,
      baseTotal: calculateBaseTotal(betaItems, 0),
      taxTotal: 51300,
      freightCost: 4000,
      packingCost: 1800,
      discount: 0,
      leadTimeDays: 18,
      paymentTerms: "Within 30 days",
      warranty: "12 months",
      taxCode: "GST18",
      hsn: "8501",
      hsc: "LOCAL",
      validityDate: new Date("2026-07-20T00:00:00+05:30"),
      technicalCompliance: "COMPLIANT",
      remarks: "Price excludes installation.",
      submittedAt: new Date("2026-06-24T11:20:00+05:30"),
      lastEditedAt: new Date("2026-06-24T11:20:00+05:30"),
      items: {
        create: rfq.items.map((item, index) => {
          const quoteItem = betaItems[index];
          return {
            rfqItemId: item.id,
            description: item.description,
            quantity: quoteItem.quantity,
            unitPrice: quoteItem.unitPrice,
            totalPrice: quoteItem.quantity * quoteItem.unitPrice,
            taxAmount: quoteItem.quantity * quoteItem.unitPrice * 0.18,
          };
        }),
      },
    },
  });

  await prisma.approval.create({
    data: {
      rfqId: rfq.id,
      approverId: hod.id,
      selectedVendorId: beta.id,
      status: "PENDING",
      comments: "Legacy approval sample retained for the approvals page.",
    },
  });

  await prisma.emailLog.createMany({
    data: [alpha, beta, gamma].map((vendor) => ({
      rfqId: rfq.id,
      vendorId: vendor.id,
      toEmail: [vendor.primaryContactEmail || vendor.email, vendor.secondaryContactEmail]
        .filter(Boolean)
        .join(", "),
      subject: `RFQ ${rfq.rfqNumber}: quotation requested`,
      body: `Seed email log for ${vendor.companyName}`,
      status: "LOGGED_ONLY",
      sentById: buyer.id,
    })),
  });

  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        userRole: admin.role,
        action: "SYSTEM_SEEDED",
        entityType: "SYSTEM",
        entityId: "seed",
        details: "Initial local development data created",
      },
      {
        userId: employee.id,
        userRole: employee.role,
        action: "RFQ_CREATED",
        entityType: "RFQ",
        entityId: rfq.id,
        details: "Seed RFQ created by a general company employee",
      },
      {
        userId: hod.id,
        userRole: hod.role,
        action: "RFQ_APPROVED",
        entityType: "RFQ",
        entityId: rfq.id,
        details: "Seed RFQ approved for release",
      },
      {
        userId: buyer.id,
        userRole: buyer.role,
        action: "RFQ_RELEASED",
        entityType: "RFQ",
        entityId: rfq.id,
        details: "Seed RFQ emails logged for assigned vendors",
      },
    ],
  });

  const closed = await prisma.rFQ.create({
    data: {
      rfqNumber: "RFQ-2026-000",
      rfqDate: new Date("2026-05-12T09:00:00+05:30"),
      deadline: new Date("2026-05-19T17:00:00+05:30"),
      department: "Maintenance",
      requesterName: "Line Supervisor",
      description: "OEM sensor replacement",
      requiredDeliveryDate: new Date("2026-06-01T00:00:00+05:30"),
      deliveryLocation: "Plant 2 Stores",
      status: "CLOSED",
      rfqType: "SPECIAL",
      rfqApprovalStatus: "APPROVED",
      comparisonStatus: "APPROVED",
      createdById: buyer.id,
      finalVendorId: gamma.id,
      poNumber: "4500123456",
      sapReferenceNumber: "SAP-RFQ-4500123456",
      integrationStatus: "NOT_READY",
      poCreatedAt: new Date("2026-05-25T12:00:00+05:30"),
      specialVendorJustification: "OEM replacement item; single OEM quote accepted.",
      items: {
        create: [
          {
            lineNumber: 1,
            description: "OEM encoder sensor",
            partNumber: "ENC-OEM-2480",
            quantity: 2,
            uom: "PCS",
            technicalSpecification: "OEM original replacement",
          },
        ],
      },
      vendors: {
        create: [{ vendorId: gamma.id, emailSentAt: new Date("2026-05-12T11:00:00+05:30") }],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: buyer.id,
      userRole: buyer.role,
      action: "RFQ_CLOSED",
      entityType: "RFQ",
      entityId: closed.id,
      details: "Seed closed RFQ linked to SAP readiness placeholders",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
