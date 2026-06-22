import Link from "next/link";
import { Badge, PageHeader, statusTone } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatStatus } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { vendorRfqWhere } from "@/lib/rfq-access";
import { lockExpiredQuotations } from "@/lib/quotation-locks";

export default async function VendorRFQsPage() {
  const user = await requireUser(["VENDOR"]);
  await lockExpiredQuotations();
  const rfqs = await prisma.rFQ.findMany({
    where: vendorRfqWhere(user),
    orderBy: { deadline: "asc" },
    include: {
      quotations: { where: { vendorId: user.vendorId ?? "__none__" } },
      items: true,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Assigned RFQs" description="Only RFQs assigned to your vendor account are visible here." />
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-5 py-3">RFQ</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Items</th>
              <th className="px-5 py-3">Deadline</th>
              <th className="px-5 py-3">Quotation</th>
              <th className="px-5 py-3">RFQ status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rfqs.map((rfq) => {
              const quote = rfq.quotations[0];
              return (
                <tr key={rfq.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3">
                    <Link href={`/vendor/rfqs/${rfq.id}`} className="font-semibold text-zinc-950 hover:underline">
                      {rfq.rfqNumber}
                    </Link>
                    <div className="text-xs text-zinc-500">{rfq.description}</div>
                  </td>
                  <td className="px-5 py-3">{rfq.department}</td>
                  <td className="px-5 py-3">{rfq.items.length}</td>
                  <td className="px-5 py-3">{formatDateTime(rfq.deadline)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={quote ? statusTone(quote.status) : "amber"}>
                      {quote ? formatStatus(quote.status) : "Not submitted"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone(rfq.status)}>{formatStatus(rfq.status)}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
