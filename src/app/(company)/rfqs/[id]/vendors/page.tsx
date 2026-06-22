import { assignVendorsAction } from "@/app/actions/rfqs";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge, PageHeader, statusTone } from "@/components/ui";
import { requirePermission } from "@/lib/auth";
import { formatStatus } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function RFQVendorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("assign_vendors");
  const { id } = await params;
  const [rfq, vendors] = await Promise.all([
    prisma.rFQ.findUnique({ where: { id }, include: { vendors: true } }),
    prisma.vendor.findMany({ where: { deletedAt: null }, orderBy: { companyName: "asc" } }),
  ]);

  if (!rfq) return <PageHeader title="RFQ not found" />;

  const assigned = new Set(rfq.vendors.map((item) => item.vendorId));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Select vendors for ${rfq.rfqNumber}`}
        description="Selected vendors are linked to this RFQ and RFQ emails are sent or locally logged through the email service."
      />
      <form action={assignVendorsAction} className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <input type="hidden" name="rfqId" value={rfq.id} />
        <div className="divide-y divide-zinc-100">
          {vendors.map((vendor) => (
            <label key={vendor.id} className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 hover:bg-zinc-50">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="vendorIds"
                  value={vendor.id}
                  defaultChecked={assigned.has(vendor.id)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <div>
                  <div className="font-semibold text-zinc-950">{vendor.companyName}</div>
                  <div className="text-sm text-zinc-500">{vendor.email} / {vendor.category}</div>
                </div>
              </div>
              <Badge tone={statusTone(vendor.approvedStatus)}>{formatStatus(vendor.approvedStatus)}</Badge>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-end border-t border-zinc-200 px-5 py-4">
          <ConfirmSubmitButton message="Assign selected vendors and send/log RFQ emails?">
            Assign and send RFQ
          </ConfirmSubmitButton>
        </div>
      </form>
    </div>
  );
}
