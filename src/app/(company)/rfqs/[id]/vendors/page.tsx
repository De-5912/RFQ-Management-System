import { assignVendorsAction } from "@/app/actions/rfqs";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge, PageHeader, statusTone } from "@/components/ui";
import { requirePermission } from "@/lib/auth";
import { formatStatus } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function RFQVendorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("assign_vendors");
  const { id } = await params;
  const { error } = await searchParams;
  const [rfq, vendors] = await Promise.all([
    prisma.rFQ.findUnique({ where: { id }, include: { vendors: true } }),
    prisma.vendor.findMany({ where: { deletedAt: null }, orderBy: { companyName: "asc" } }),
  ]);

  if (!rfq) return <PageHeader title="RFQ not found" />;

  const assigned = new Set(rfq.vendors.map((item) => item.vendorId));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Release ${rfq.rfqNumber} to vendors`}
        description="Normal RFQs require 3 to 10 vendors. OEM, authorized, or customized vendor RFQs may be released to a single vendor after RFQ approval."
      />
      {rfq.rfqApprovalStatus !== "APPROVED" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          RFQ release approval is pending. Vendor invitation emails are not available until HOD or HOS approval is recorded.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error === "normal-count"
            ? "Select between 3 and 10 regular vendors for a normal RFQ."
            : error === "special-max"
              ? "Special RFQs can be released to one OEM, authorized, or customized vendor."
              : "RFQ must be approved before vendor release."}
        </div>
      ) : null}
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
                  <div className="text-sm text-zinc-500">
                    {vendor.primaryContactEmail || vendor.email} / {vendor.category} / {formatStatus(vendor.vendorType)}
                  </div>
                </div>
              </div>
              <Badge tone={statusTone(vendor.approvedStatus)}>{formatStatus(vendor.approvedStatus)}</Badge>
            </label>
          ))}
        </div>
        {rfq.rfqApprovalStatus === "APPROVED" ? (
        <div className="flex items-center justify-end border-t border-zinc-200 px-5 py-4">
          <ConfirmSubmitButton message="Assign selected vendors and send/log RFQ emails?">
            Release RFQ and send emails
          </ConfirmSubmitButton>
        </div>
        ) : null}
      </form>
    </div>
  );
}
