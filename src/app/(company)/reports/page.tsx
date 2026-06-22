import { logReportDownloadAction } from "@/app/actions/rfqs";
import { SubmitButton } from "@/components/submit-button";
import { PageHeader, StatCard } from "@/components/ui";
import { requirePermission } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  await requirePermission("download_reports");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    openRfqs,
    closedRfqs,
    pendingQuotations,
    delayedRfqs,
    monthlyCount,
    quotations,
    vendorHistory,
    categoryVendors,
    downloads,
  ] = await Promise.all([
    prisma.rFQ.count({ where: { status: { notIn: ["CLOSED", "CANCELLED"] }, deletedAt: null } }),
    prisma.rFQ.count({ where: { status: "CLOSED", deletedAt: null } }),
    prisma.rFQ.count({ where: { status: "QUOTATION_AWAITED", deletedAt: null } }),
    prisma.rFQ.count({
      where: {
        deletedAt: null,
        deadline: { lt: now },
        status: { notIn: ["CLOSED", "CANCELLED", "PO_CREATED"] },
      },
    }),
    prisma.rFQ.count({ where: { rfqDate: { gte: monthStart }, deletedAt: null } }),
    prisma.quotation.findMany({ where: { status: { in: ["SUBMITTED", "LOCKED"] } } }),
    prisma.vendor.findMany({
      include: { _count: { select: { rfqs: true, quotations: true } } },
      orderBy: { companyName: "asc" },
      take: 8,
    }),
    prisma.vendor.groupBy({ by: ["category"], _count: { _all: true } }),
    prisma.reportDownloadLog.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true } }),
  ]);

  const averageLeadTime =
    quotations.length === 0
      ? 0
      : quotations.reduce((sum, quote) => sum + (quote.leadTimeDays ?? 0), 0) / quotations.length;

  const lowestQuote = quotations.reduce(
    (lowest, quote) => (!lowest || quote.baseTotal.lessThan(lowest.baseTotal) ? quote : lowest),
    quotations[0],
  );

  const reportTypes = [
    "Open RFQs",
    "Closed RFQs",
    "Pending Quotations",
    "Vendor-wise RFQ History",
    "Category-wise Purchase Data",
    "Average Lead Time",
    "Lowest Quoted Vendor History",
    "Delayed RFQs",
    "Monthly RFQ Count",
    "Savings Report",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Operational RFQ reporting. Download actions are logged for audit visibility."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Open RFQs" value={openRfqs} />
        <StatCard label="Closed RFQs" value={closedRfqs} />
        <StatCard label="Pending Quotations" value={pendingQuotations} />
        <StatCard label="Delayed RFQs" value={delayedRfqs} />
        <StatCard label="Monthly RFQs" value={monthlyCount} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Average lead time" value={`${averageLeadTime.toFixed(1)} days`} />
        <StatCard label="Lowest submitted base quote" value={lowestQuote ? formatMoney(lowestQuote.baseTotal) : "-"} />
        <StatCard label="Quotation count" value={quotations.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="font-semibold text-zinc-950">Report downloads</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {reportTypes.map((type) => (
              <form key={type} action={logReportDownloadAction} className="flex items-center justify-between gap-4 px-5 py-3">
                <input type="hidden" name="reportType" value={type} />
                <div className="font-medium text-zinc-950">{type}</div>
                <SubmitButton className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-50">
                  Log download
                </SubmitButton>
              </form>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="font-semibold text-zinc-950">Vendor RFQ history</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {vendorHistory.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div>
                  <div className="font-medium text-zinc-950">{vendor.companyName}</div>
                  <div className="text-xs text-zinc-500">{vendor.category}</div>
                </div>
                <div className="text-right">
                  <div>{vendor._count.rfqs} RFQs</div>
                  <div className="text-xs text-zinc-500">{vendor._count.quotations} quotes</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-zinc-950">Category-wise purchase data</h2>
          <div className="mt-4 space-y-2 text-sm">
            {categoryVendors.map((category) => (
              <div key={category.category} className="flex justify-between">
                <span>{category.category}</span>
                <span className="font-semibold">{category._count._all} vendors</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-zinc-950">Recent report logs</h2>
          <div className="mt-4 space-y-2 text-sm">
            {downloads.map((download) => (
              <div key={download.id} className="flex justify-between gap-4">
                <span>{download.reportType}</span>
                <span className="text-zinc-500">{download.user.name}</span>
              </div>
            ))}
            {downloads.length === 0 ? <p className="text-zinc-500">No downloads logged yet.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
