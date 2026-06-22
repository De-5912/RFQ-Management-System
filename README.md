# RFQ Management Platform

Local-first RFQ Management Platform with company-side procurement workflows and a vendor portal. The prototype is built for local validation before any production hosting decision.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Custom cookie/session authentication with bcrypt password hashes
- Local file uploads under `uploads/`
- Local email logging by default, SMTP-ready through environment variables

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and update `DATABASE_URL` for your local PostgreSQL database:

```bash
cp .env.example .env
```

3. Create/migrate the database:

```bash
npm run db:migrate
```

4. Seed sample users, vendors, RFQs, quotations, approvals, email logs, and audit logs:

```bash
npm run db:seed
```

5. Run locally:

```bash
npm run dev
```

6. Verify production build:

```bash
npm run build
```

## Seed Users

All seed users use password:

```text
Password@123
```

| Role | Email |
| --- | --- |
| Admin | `admin@rfq.local` |
| Purchase Executive | `purchase.executive@rfq.local` |
| Purchase Manager | `purchase.manager@rfq.local` |
| HOD | `hod@rfq.local` |
| Finance | `finance@rfq.local` |
| Department Requester | `requester@rfq.local` |
| Vendor - Alpha | `vendor.alpha@rfq.local` |
| Vendor - Beta | `vendor.beta@rfq.local` |
| Vendor - Gamma | `vendor.gamma@rfq.local` |

## Implemented MVP

- Role-based company and vendor portals
- Vendor master management
- RFQ creation with multiple item rows and attachments
- Vendor assignment with RFQ email logging/sending architecture
- Vendor-only assigned RFQ visibility
- Vendor quotation submission with item-wise pricing and attachments
- Quotation edits before deadline only
- Automatic quotation locking when expired RFQs are viewed or compared
- Comparison table with L1/L2/L3 ranking based on base quote price only
- Tax, freight, packing, and other charges displayed separately from ranking
- Final vendor selection and HOD approval workflow
- RFQ workflow statuses through the requested status list
- Audit logs for important events
- Reports dashboard with download logging
- Local seed data for manual workflow testing

## Email Behavior

If SMTP environment variables are empty, RFQ emails are written through Nodemailer JSON transport and stored in `EmailLog` as `LOGGED_ONLY`. To send real email later, set:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM="RFQ Management <rfq@example.com>"
APP_URL="http://localhost:3000"
```

## File Uploads

Files are stored locally under:

```text
uploads/
```

Downloads go through `/api/attachments/[id]`, which checks authentication and vendor/company access rules before returning a file.

## Pending Assumptions

- Vendors currently quote all RFQ items by default, while the schema still permits optional extra quotation lines. Validation can later enforce strict all-items mandatory rules.
- Approval permissions are centralized in `src/lib/permissions.ts` so status/role rules can be revised later.
- SAP integration is intentionally not implemented. RFQs support a PO number/status placeholder for later SAP linkage.
- Local email logging is enabled by default. SMTP can be configured later without changing RFQ workflow code.
- Production hosting, SSO, cloud storage, and enterprise approval thresholds are intentionally outside this MVP.

## Useful Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build
```
