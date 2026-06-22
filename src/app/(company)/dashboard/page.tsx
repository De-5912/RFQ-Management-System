import Link from "next/link";
import { ClipboardPlus, FileClock, ShieldCheck, Store } from "lucide-react";
import { Badge, ButtonLink, PageHeader, StatCard, statusTone } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate, formatStatus } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { companyRfqWhere } from "@/lib/rfq-access";

export default async function DashboardPage() {
  const user = await requireUser();
  const where = companyRfqWhere(user);

  const [openRfqs, closedRfqs, pendingQuotations, approvals, vendors, recent] =
    await Promise.all([
      prisma.rFQ.count({ where: { ...where, status: { notIn: ["CLOSED", "CANCELLED"] } } }),
      prisma.rFQ.count({ where: { ...where, status: "CLOSED" } }),
      prisma.rFQ.count({ where: { ...where, status: "QUOTATION_AWAITED" } }),
      prisma.approval.count({ where: { status: "PENDING" } }),
      prisma.vendor.count({ where: { deletedAt: null } }),
      prisma.rFQ.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: 6,
        include: { vendors: true, quotations: true },
      }),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Internal RFQ transparency across preparation, vendor assignment, quotation receipt, comparison, approval, and PO status."
        actions={
          <ButtonLink href="/rfqs/new">
            <ClipboardPlus className="h-4 w-4" />
            New RFQ
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Open RFQs" value={openRfqs} href="/rfqs" />
        <StatCard label="Closed RFQs" value={closedRfqs} href="/reports" />
        <StatCard label="Pending Quotations" value={pendingQuotations} href="/rfqs" />
        <StatCard label="Pending Approvals" value={approvals} href="/approvals" />
        <StatCard label="Active Vendors" value={vendors} href="/vendors" />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-950">Recent RFQs</h2>
          <Link href="/rfqs" className="text-sm font-semibold text-zinc-700 hover:text-zinc-950">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-5 py-3">RFQ</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Deadline</th>
                <th className="px-5 py-3">Vendors</th>
                <th className="px-5 py-3">Quotes</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recent.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3">
                    <Link href={`/rfqs/${rfq.id}`} className="font-semibold text-zinc-950 hover:underline">
                      {rfq.rfqNumber}
                    </Link>
                    <div className="text-xs text-zinc-500">{rfq.description}</div>
                  </td>
                  <td className="px-5 py-3">{rfq.department}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileClock className="h-4 w-4 text-zinc-400" />
                      {formatDate(rfq.deadline)}
                    </div>
                  </td>
                  <td className="px-5 py-3">{rfq.vendors.length}</td>
                  <td className="px-5 py-3">{rfq.quotations.length}</td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone(rfq.status)}>{formatStatus(rfq.status)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/vendors" className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:bg-zinc-50">
          <Store className="h-5 w-5 text-zinc-500" />
          <div className="mt-3 font-semibold text-zinc-950">Vendor master</div>
          <p className="mt-1 text-sm text-zinc-600">Maintain approved status, category, payment terms, and performance.</p>
        </Link>
        <Link href="/approvals" className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:bg-zinc-50">
          <ShieldCheck className="h-5 w-5 text-zinc-500" />
          <div className="mt-3 font-semibold text-zinc-950">HOD approvals</div>
          <p className="mt-1 text-sm text-zinc-600">Review final vendor selections and approval decisions.</p>
        </Link>
        <Link href="/reports" className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:bg-zinc-50">
          <Store className="h-5 w-5 text-zinc-500" />
          <div className="mt-3 font-semibold text-zinc-950">Reports</div>
          <p className="mt-1 text-sm text-zinc-600">Open RFQs, delayed RFQs, lead time, monthly count, and savings views.</p>
        </Link>
      </div>
    </div>
  );
}
