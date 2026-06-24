import Link from "next/link";
import { Badge, PageHeader, statusTone } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney, formatStatus } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { lockExpiredQuotations } from "@/lib/quotation-locks";

export default async function VendorQuotationsPage() {
  const user = await requireUser(["VENDOR"]);
  await lockExpiredQuotations();
  const quotations = await prisma.quotation.findMany({
    where: { vendorId: user.vendorId ?? "__none__" },
    include: { rfq: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="My Quotations" description="Your submitted quotation history. Other vendors' quotations are never visible here." />
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-5 py-3">RFQ</th>
              <th className="px-5 py-3">Base total</th>
              <th className="px-5 py-3">Availability</th>
              <th className="px-5 py-3">Lead time</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3">Last edited</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {quotations.map((quote) => (
              <tr key={quote.id}>
                <td className="px-5 py-3">
                  <Link href={`/vendor/rfqs/${quote.rfqId}`} className="font-semibold text-zinc-950 hover:underline">
                    {quote.rfq.rfqNumber}
                  </Link>
                  <div className="text-xs text-zinc-500">{quote.rfq.description}</div>
                </td>
                <td className="px-5 py-3 font-semibold">{formatMoney(quote.baseTotal)}</td>
                <td className="px-5 py-3">{formatStatus(quote.availability)}</td>
                <td className="px-5 py-3">{quote.leadTimeDays ?? "-"} days</td>
                <td className="px-5 py-3">{formatDate(quote.submittedAt)}</td>
                <td className="px-5 py-3">{formatDate(quote.lastEditedAt)}</td>
                <td className="px-5 py-3">
                  <Badge tone={statusTone(quote.status)}>{formatStatus(quote.status)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
