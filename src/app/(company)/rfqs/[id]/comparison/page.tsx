import { selectFinalVendorAction } from "@/app/actions/rfqs";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge, PageHeader, statusTone } from "@/components/ui";
import { requirePermission } from "@/lib/auth";
import { formatDate, formatMoney, formatStatus } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { rankQuotations } from "@/lib/comparison";
import { lockExpiredQuotations } from "@/lib/quotation-locks";

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("view_comparison");
  const { id } = await params;
  await lockExpiredQuotations(id);

  const rfq = await prisma.rFQ.findUnique({
    where: { id },
    include: {
      quotations: {
        include: { vendor: true, items: true },
        where: { status: { in: ["SUBMITTED", "LOCKED"] } },
      },
      finalVendor: true,
    },
  });

  if (!rfq) return <PageHeader title="RFQ not found" />;

  const ranked = rankQuotations(
    rfq.quotations.map((quote) => ({
      id: quote.id,
      vendorName: quote.vendor.companyName,
      vendorId: quote.vendorId,
      baseTotal: quote.baseTotal,
      taxTotal: quote.taxTotal,
      freightCost: quote.freightCost,
      packingCost: quote.packingCost,
      discount: quote.discount,
      leadTimeDays: quote.leadTimeDays,
      paymentTerms: quote.paymentTerms,
      warranty: quote.warranty,
      technicalCompliance: quote.technicalCompliance,
      pastRating: quote.vendor.pastRating,
      remarks: quote.remarks,
      submittedAt: quote.submittedAt,
      status: quote.status,
    })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Comparison: ${rfq.rfqNumber}`}
        description="Ranking uses base quote price only. Tax, freight, packing, and other charges are visible but excluded from L1/L2/L3 ranking."
      />

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[1300px] text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Base quote</th>
              <th className="px-4 py-3">Tax</th>
              <th className="px-4 py-3">Freight</th>
              <th className="px-4 py-3">Packing</th>
              <th className="px-4 py-3">Lead time</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Warranty</th>
              <th className="px-4 py-3">Technical</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {ranked.map((quote) => (
              <tr key={quote.id} className={quote.isLowest ? "bg-emerald-50/70" : ""}>
                <td className="px-4 py-3">
                  <Badge tone={quote.isLowest ? "green" : "neutral"}>{quote.rankLabel}</Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-zinc-950">{quote.vendorName}</td>
                <td className="px-4 py-3 font-semibold text-zinc-950">{formatMoney(quote.baseTotal)}</td>
                <td className="px-4 py-3">{formatMoney(quote.taxTotal)}</td>
                <td className="px-4 py-3">{formatMoney(quote.freightCost)}</td>
                <td className="px-4 py-3">{formatMoney(quote.packingCost)}</td>
                <td className="px-4 py-3">{quote.leadTimeDays ?? "-"} days</td>
                <td className="px-4 py-3">{quote.paymentTerms ?? "-"}</td>
                <td className="px-4 py-3">{quote.warranty ?? "-"}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(quote.technicalCompliance)}>{formatStatus(quote.technicalCompliance)}</Badge>
                </td>
                <td className="px-4 py-3">{quote.pastRating?.toString() ?? "-"}</td>
                <td className="px-4 py-3">{formatDate(quote.submittedAt)}</td>
                <td className="px-4 py-3">
                  <form action={selectFinalVendorAction}>
                    <input type="hidden" name="rfqId" value={rfq.id} />
                    <input type="hidden" name="vendorId" value={quote.vendorId} />
                    <ConfirmSubmitButton
                      message={`Select ${quote.vendorName} as final vendor for HOD approval?`}
                      className="inline-flex h-9 items-center rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Select
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ranked.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No submitted quotations are available for comparison yet.
        </div>
      ) : null}

      {rfq.finalVendor ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Current final vendor selection: <span className="font-semibold">{rfq.finalVendor.companyName}</span>.
        </div>
      ) : null}
    </div>
  );
}
