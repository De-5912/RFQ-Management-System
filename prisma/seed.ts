import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { calculateBaseTotal } from "../src/lib/comparison";

const prisma = new PrismaClient();

const password = "Password@123";

async function createUser(input: {
  name: string;
  email: string;
  role: Role;
  department?: string;
  vendorId?: string;
}) {
  return prisma.user.create({
    data: {
      ...input,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
}

async function main() {
  await prisma.reportDownloadLog.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.rFQVendor.deleteMany();
  await prisma.rFQItem.deleteMany();
  await prisma.rFQ.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vendor.deleteMany();

  const alpha = await prisma.vendor.create({
    data: {
      companyName: "Alpha Industrial Supplies",
      contactPerson: "Ravi Menon",
      email: "vendor.alpha@rfq.local",
      phone: "+91 98765 10001",
      address: "Peenya Industrial Area, Bengaluru",
      gstNumber: "29ABCDE1234F1Z5",
      pan: "ABCDE1234F",
      category: "Electrical",
      approvedStatus: "APPROVED",
      pastRating: 4.4,
      paymentTerms: "45 days credit",
      leadTimeHistory: "Average 12 days for standard motors",
    },
  });

  const beta = await prisma.vendor.create({
    data: {
      companyName: "Beta Power Systems",
      contactPerson: "Neha Sharma",
      email: "vendor.beta@rfq.local",
      phone: "+91 98765 10002",
      address: "MIDC, Pune",
      gstNumber: "27BCDEF2345G1Z2",
      pan: "BCDEF2345G",
      category: "Electrical",
      approvedStatus: "APPROVED",
      pastRating: 4.1,
      paymentTerms: "30 days credit",
      leadTimeHistory: "Average 16 days with strong after-sales support",
    },
  });

  const gamma = await prisma.vendor.create({
    data: {
      companyName: "Gamma Automation OEM",
      contactPerson: "Arun Iyer",
      email: "vendor.gamma@rfq.local",
      phone: "+91 98765 10003",
      address: "Guindy, Chennai",
      gstNumber: "33CDEFG3456H1Z8",
      pan: "CDEFG3456H",
      category: "Automation OEM",
      approvedStatus: "CONDITIONAL",
      pastRating: 3.8,
      paymentTerms: "Advance 20%, balance before dispatch",
      leadTimeHistory: "OEM items average 28 days",
    },
  });

  const admin = await createUser({
    name: "Admin User",
    email: "admin@rfq.local",
    role: "ADMIN",
    department: "Administration",
  });
  const purchaseExecutive = await createUser({
    name: "Priya Purchase Executive",
    email: "purchase.executive@rfq.local",
    role: "PURCHASE_EXECUTIVE",
    department: "Purchase",
  });
  await createUser({
    name: "Mahesh Purchase Manager",
    email: "purchase.manager@rfq.local",
    role: "PURCHASE_MANAGER",
    department: "Purchase",
  });
  const hod = await createUser({
    name: "HOD Operations",
    email: "hod@rfq.local",
    role: "HOD",
    department: "Operations",
  });
  await createUser({
    name: "Finance Viewer",
    email: "finance@rfq.local",
    role: "FINANCE",
    department: "Finance",
  });
  await createUser({
    name: "Maintenance Requester",
    email: "requester@rfq.local",
    role: "DEPARTMENT_REQUESTER",
    department: "Maintenance",
  });
  await createUser({
    name: "Alpha Vendor User",
    email: "vendor.alpha@rfq.local",
    role: "VENDOR",
    vendorId: alpha.id,
  });
  await createUser({
    name: "Beta Vendor User",
    email: "vendor.beta@rfq.local",
    role: "VENDOR",
    vendorId: beta.id,
  });
  await createUser({
    name: "Gamma Vendor User",
    email: "vendor.gamma@rfq.local",
    role: "VENDOR",
    vendorId: gamma.id,
  });

  const rfq = await prisma.rFQ.create({
    data: {
      rfqNumber: "RFQ-2026-001",
      rfqDate: new Date("2026-06-22T09:00:00+05:30"),
      deadline: new Date("2026-06-29T17:00:00+05:30"),
      department: "Maintenance",
      requesterName: "Maintenance Requester",
      description: "Motor, cable and sensor requirement for line-2 maintenance",
      requiredDeliveryDate: new Date("2026-07-10T00:00:00+05:30"),
      deliveryLocation: "Main Stores - Plant 1",
      technicalSpecification: "Standard industrial grade, suitable for continuous duty.",
      preferredMake: "Siemens / ABB or equivalent approved make",
      paymentTerms: "45 days credit preferred",
      warrantyRequirement: "Minimum 12 months from commissioning",
      taxes: "GST extra as applicable",
      remarks: "Alternatives are not allowed for this RFQ.",
      status: "QUOTATION_RECEIVED",
      createdById: purchaseExecutive.id,
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
      baseTotal: calculateBaseTotal(alphaItems, 5000),
      taxTotal: 50130,
      freightCost: 8500,
      packingCost: 3000,
      discount: 5000,
      leadTimeDays: 12,
      paymentTerms: "45 days credit",
      warranty: "18 months",
      validityDate: new Date("2026-07-31T00:00:00+05:30"),
      technicalCompliance: "COMPLIANT",
      remarks: "All items quoted as per RFQ specification.",
      submittedAt: new Date("2026-06-23T14:00:00+05:30"),
      lastEditedAt: new Date("2026-06-24T09:30:00+05:30"),
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
      baseTotal: calculateBaseTotal(betaItems, 0),
      taxTotal: 51300,
      freightCost: 4000,
      packingCost: 1800,
      discount: 0,
      leadTimeDays: 18,
      paymentTerms: "30 days credit",
      warranty: "12 months",
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
      comments: "Seed approval awaiting HOD decision for lowest base quote.",
    },
  });

  await prisma.emailLog.createMany({
    data: [alpha, beta, gamma].map((vendor) => ({
      rfqId: rfq.id,
      vendorId: vendor.id,
      toEmail: vendor.email,
      subject: `RFQ ${rfq.rfqNumber}: quotation requested`,
      body: `Seed email log for ${vendor.companyName}`,
      status: "LOGGED_ONLY",
      sentById: purchaseExecutive.id,
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
        userId: purchaseExecutive.id,
        userRole: purchaseExecutive.role,
        action: "RFQ_CREATED",
        entityType: "RFQ",
        entityId: rfq.id,
        details: "Seed RFQ created with three items and three assigned vendors",
      },
      {
        userId: purchaseExecutive.id,
        userRole: purchaseExecutive.role,
        action: "RFQ_EMAIL_SENT",
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
      department: "Production",
      requesterName: "Line Supervisor",
      description: "OEM sensor replacement",
      requiredDeliveryDate: new Date("2026-06-01T00:00:00+05:30"),
      deliveryLocation: "Plant 2 Stores",
      status: "CLOSED",
      createdById: purchaseExecutive.id,
      finalVendorId: gamma.id,
      poNumber: "4500123456",
      poCreatedAt: new Date("2026-05-25T12:00:00+05:30"),
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
      userId: purchaseExecutive.id,
      userRole: purchaseExecutive.role,
      action: "PO_STATUS_UPDATED",
      entityType: "RFQ",
      entityId: closed.id,
      details: "Seed closed RFQ linked to SAP PO placeholder",
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
