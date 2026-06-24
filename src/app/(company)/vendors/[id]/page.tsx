import Link from "next/link";
import { Badge, PageHeader, statusTone } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney, formatStatus } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      rfqs: { include: { rfq: true }, orderBy: { assignedAt: "desc" } },
      quotations: { include: { rfq: true }, orderBy: { updatedAt: "desc" } },
    },
  });

  if (!vendor) return <PageHeader title="Vendor not found" />;

  return (
    <div className="space-y-6">
      <PageHeader title={vendor.companyName} description={`${vendor.vendorCode ?? "No vendor code"} / ${formatStatus(vendor.vendorType)}`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <Badge tone={statusTone(vendor.approvedStatus)}>{formatStatus(vendor.approvedStatus)}</Badge>
          <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
            <div><dt className="font-medium text-zinc-500">Primary contact</dt><dd>{vendor.primaryContactName ?? vendor.contactPerson}</dd></div>
            <div><dt className="font-medium text-zinc-500">Primary email</dt><dd>{vendor.primaryContactEmail ?? vendor.email}</dd></div>
            <div><dt className="font-medium text-zinc-500">Primary mobile</dt><dd>{vendor.primaryContactMobile ?? vendor.phone}</dd></div>
            <div><dt className="font-medium text-zinc-500">Primary designation</dt><dd>{vendor.primaryContactDesignation ?? "-"}</dd></div>
            <div><dt className="font-medium text-zinc-500">Secondary contact</dt><dd>{vendor.secondaryContactName ?? "-"}</dd></div>
            <div><dt className="font-medium text-zinc-500">Secondary email</dt><dd>{vendor.secondaryContactEmail ?? "-"}</dd></div>
            <div><dt className="font-medium text-zinc-500">Secondary mobile</dt><dd>{vendor.secondaryContactMobile ?? "-"}</dd></div>
            <div><dt className="font-medium text-zinc-500">Secondary designation</dt><dd>{vendor.secondaryContactDesignation ?? "-"}</dd></div>
            <div><dt className="font-medium text-zinc-500">Business category</dt><dd>{vendor.category}</dd></div>
            <div><dt className="font-medium text-zinc-500">Product / service</dt><dd>{vendor.productCategory ?? "-"} / {vendor.serviceCategory ?? "-"}</dd></div>
            <div><dt className="font-medium text-zinc-500">GST</dt><dd>{vendor.gstNumber ?? "-"}</dd></div>
            <div><dt className="font-medium text-zinc-500">PAN</dt><dd>{vendor.pan ?? "-"}</dd></div>
            <div><dt className="font-medium text-zinc-500">Rating</dt><dd>{vendor.pastRating.toString()}</dd></div>
            <div><dt className="font-medium text-zinc-500">Payment terms</dt><dd>{vendor.paymentTerms ?? "-"}</dd></div>
            <div><dt className="font-medium text-zinc-500">City / State</dt><dd>{vendor.city ?? "-"} / {vendor.state ?? "-"}</dd></div>
            <div><dt className="font-medium text-zinc-500">Country / PIN</dt><dd>{vendor.country ?? "-"} / {vendor.pinCode ?? "-"}</dd></div>
            <div className="md:col-span-2"><dt className="font-medium text-zinc-500">Bank details</dt><dd>{vendor.bankDetails ?? "-"}</dd></div>
            <div className="md:col-span-2"><dt className="font-medium text-zinc-500">Address</dt><dd>{vendor.address}</dd></div>
            <div className="md:col-span-2"><dt className="font-medium text-zinc-500">Lead time history</dt><dd>{vendor.leadTimeHistory ?? "-"}</dd></div>
          </dl>
        </section>
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-zinc-950">RFQ activity</h2>
          <div className="mt-3 text-sm text-zinc-600">
            <div>{vendor.rfqs.length} assigned RFQs</div>
            <div>{vendor.quotations.length} submitted quotations</div>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="font-semibold text-zinc-950">Quotation history</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {vendor.quotations.map((quote) => (
            <Link key={quote.id} href={`/rfqs/${quote.rfqId}/comparison`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-zinc-50">
              <div>
                <div className="font-medium">{quote.rfq.rfqNumber}</div>
                <div className="text-xs text-zinc-500">{formatDate(quote.submittedAt)}</div>
              </div>
              <div className="font-semibold">{formatMoney(quote.baseTotal)}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
