import Link from "next/link";
import { FileClock } from "lucide-react";
import { Badge, PageHeader, StatCard, statusTone } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate, formatStatus } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { vendorRfqWhere } from "@/lib/rfq-access";
import { lockExpiredQuotations } from "@/lib/quotation-locks";

export default async function VendorDashboardPage() {
  const user = await requireUser(["VENDOR"]);
  await lockExpiredQuotations();
  const where = vendorRfqWhere(user);

  const [pending, submitted, awarded, rfqs] = await Promise.all([
    prisma.rFQ.count({
      where: {
        ...where,
        quotations: { none: { vendorId: user.vendorId ?? "__none__" } },
        deadline: { gt: new Date() },
      },
    }),
    prisma.quotation.count({ where: { vendorId: user.vendorId ?? "__none__" } }),
    prisma.rFQ.count({ where: { ...where, finalVendorId: user.vendorId ?? "__none__" } }),
    prisma.rFQ.findMany({
      where,
      orderBy: { deadline: "asc" },
      take: 6,
      include: {
        quotations: { where: { vendorId: user.vendorId ?? "__none__" } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Dashboard"
        description="Assigned RFQs, submission deadlines, quotation status, and your quotation history."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="RFQs awaiting quote" value={pending} href="/vendor/rfqs" />
        <StatCard label="Quotes submitted" value={submitted} href="/vendor/quotations" />
        <StatCard label="RFQs awarded" value={awarded} href="/vendor/rfqs" />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="font-semibold text-zinc-950">Pending RFQs and quote status</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {rfqs.map((rfq) => {
            const quote = rfq.quotations[0];
            return (
              <Link key={rfq.id} href={`/vendor/rfqs/${rfq.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-zinc-50">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-zinc-950">
                    <FileClock className="h-4 w-4 text-zinc-500" />
                    {rfq.rfqNumber}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">{rfq.description}</div>
                  <div className="mt-1 text-xs text-zinc-500">Deadline {formatDate(rfq.deadline)}</div>
                </div>
                <Badge tone={quote ? statusTone(quote.status) : "amber"}>
                  {quote ? formatStatus(quote.status) : "Awaiting quote"}
                </Badge>
              </Link>
            );
          })}
          {rfqs.length === 0 ? (
            <div className="px-5 py-8 text-sm text-zinc-500">No assigned RFQs yet.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
