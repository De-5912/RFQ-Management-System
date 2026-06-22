import Link from "next/link";
import { Pencil } from "lucide-react";
import { Badge, ButtonLink, PageHeader, statusTone } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { formatDate, formatDateTime, formatMoney, formatStatus, isPast } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { vendorRfqWhere } from "@/lib/rfq-access";
import { lockExpiredQuotations } from "@/lib/quotation-locks";

export default async function VendorRFQDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(["VENDOR"]);
  const { id } = await params;
  await lockExpiredQuotations(id);
  const rfq = await prisma.rFQ.findFirst({
    where: { ...vendorRfqWhere(user), id },
    include: {
      items: { orderBy: { lineNumber: "asc" } },
      quotations: {
        where: { vendorId: user.vendorId ?? "__none__" },
        include: { items: true, attachments: true },
      },
      attachments: true,
    },
  });

  if (!rfq) return <PageHeader title="RFQ not found" description="This RFQ is not assigned to your vendor account." />;

  await prisma.rFQVendor.updateMany({
    where: { rfqId: id, vendorId: user.vendorId ?? "__none__" },
    data: { viewedAt: new Date() },
  });
  await logAudit({
    user,
    action: "VENDOR_VIEWED_RFQ",
    entityType: "RFQ",
    entityId: id,
  });

  const quote = rfq.quotations[0];
  const locked = isPast(rfq.deadline) || quote?.status === "LOCKED";

  return (
    <div className="space-y-6">
      <PageHeader
        title={rfq.rfqNumber}
        description={rfq.description}
        actions={
          !locked ? (
            <ButtonLink href={`/vendor/rfqs/${rfq.id}/quote`}>
              <Pencil className="h-4 w-4" />
              {quote ? "Edit quote" : "Submit quote"}
            </ButtonLink>
          ) : null
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap gap-3">
            <Badge tone={statusTone(rfq.status)}>{formatStatus(rfq.status)}</Badge>
            <Badge tone={locked ? "slate" : "green"}>{locked ? "Quotation locked" : "Editable before deadline"}</Badge>
          </div>
          <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
            <div><dt className="font-medium text-zinc-500">Department</dt><dd>{rfq.department}</dd></div>
            <div><dt className="font-medium text-zinc-500">Requester</dt><dd>{rfq.requesterName}</dd></div>
            <div><dt className="font-medium text-zinc-500">Deadline</dt><dd>{formatDateTime(rfq.deadline)}</dd></div>
            <div><dt className="font-medium text-zinc-500">Required delivery</dt><dd>{formatDate(rfq.requiredDeliveryDate)}</dd></div>
            <div><dt className="font-medium text-zinc-500">Delivery location</dt><dd>{rfq.deliveryLocation}</dd></div>
            <div><dt className="font-medium text-zinc-500">Payment terms</dt><dd>{rfq.paymentTerms ?? "-"}</dd></div>
            <div className="md:col-span-2"><dt className="font-medium text-zinc-500">Specification</dt><dd className="whitespace-pre-wrap">{rfq.technicalSpecification ?? "-"}</dd></div>
          </dl>
        </section>
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-zinc-950">Your quotation</h2>
          {quote ? (
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Status</span><Badge tone={statusTone(quote.status)}>{formatStatus(quote.status)}</Badge></div>
              <div className="flex justify-between"><span>Base total</span><span className="font-semibold">{formatMoney(quote.baseTotal)}</span></div>
              <div className="flex justify-between"><span>Lead time</span><span>{quote.leadTimeDays ?? "-"} days</span></div>
              <div className="flex justify-between"><span>Last edited</span><span>{formatDateTime(quote.lastEditedAt)}</span></div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">No quotation submitted yet.</p>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="font-semibold text-zinc-950">RFQ Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-5 py-3">Line</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Part/model</th>
                <th className="px-5 py-3">Qty</th>
                <th className="px-5 py-3">UOM</th>
                <th className="px-5 py-3">Specification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rfq.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3">{item.lineNumber}</td>
                  <td className="px-5 py-3 font-medium text-zinc-950">{item.description}</td>
                  <td className="px-5 py-3">{item.partNumber ?? "-"}</td>
                  <td className="px-5 py-3">{item.quantity.toString()}</td>
                  <td className="px-5 py-3">{item.uom}</td>
                  <td className="px-5 py-3">{item.technicalSpecification ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {quote ? (
        <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="font-semibold text-zinc-950">Submitted item-wise quotation</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {quote.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div>
                  <div className="font-medium text-zinc-950">{item.description}</div>
                  <div className="text-xs text-zinc-500">{item.quantity.toString()} x {formatMoney(item.unitPrice)}</div>
                </div>
                <div className="font-semibold">{formatMoney(item.totalPrice)}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {rfq.attachments.length ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-zinc-950">RFQ attachments</h2>
          <div className="mt-3 space-y-2 text-sm">
            {rfq.attachments.map((file) => (
              <Link key={file.id} href={`/api/attachments/${file.id}`} className="block text-zinc-700 hover:underline">
                {file.fileName}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
