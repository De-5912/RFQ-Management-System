import Link from "next/link";
import { Plus } from "lucide-react";
import {
  approveVendorRegistrationAction,
  rejectVendorRegistrationAction,
} from "@/app/actions/vendors";
import { Badge, ButtonLink, EmptyState, Field, PageHeader, statusTone, textareaClass } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatStatus } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function VendorsPage() {
  const user = await requireUser();
  const canManageVendors = can(user.role, "manage_vendors");
  const canVerifyVendors = can(user.role, "verify_vendors");
  const [vendors, registrations] = await Promise.all([
    prisma.vendor.findMany({
      where: { deletedAt: null },
      orderBy: { companyName: "asc" },
      include: { _count: { select: { rfqs: true, quotations: true } } },
    }),
    canVerifyVendors
      ? prisma.vendorRegistration.findMany({
          where: { status: "PENDING_VERIFICATION" },
          orderBy: { submittedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Master"
        description="Maintain local vendor records used for RFQ assignment, email dispatch, and quotation comparison."
        actions={
          canManageVendors ? (
            <ButtonLink href="/vendors/new">
              <Plus className="h-4 w-4" />
              New vendor
            </ButtonLink>
          ) : null
        }
      />
      {canVerifyVendors && registrations.length > 0 ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 shadow-sm">
          <div className="border-b border-amber-200 px-5 py-4">
            <h2 className="font-semibold text-amber-950">Pending vendor verification</h2>
          </div>
          <div className="divide-y divide-amber-200">
            {registrations.map((registration) => (
              <div key={registration.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_360px]">
                <div className="text-sm">
                  <div className="font-semibold text-zinc-950">{registration.companyName}</div>
                  <div className="mt-1 text-zinc-700">
                    {registration.primaryContactName} / {registration.primaryContactEmail} / {registration.primaryContactMobile}
                  </div>
                  <div className="mt-1 text-zinc-600">
                    GST {registration.gstNumber ?? "-"} / PAN {registration.pan ?? "-"} / {registration.city}, {registration.state}
                  </div>
                </div>
                <div className="space-y-3">
                  <form action={approveVendorRegistrationAction} className="flex justify-end">
                    <input type="hidden" name="registrationId" value={registration.id} />
                    <ConfirmSubmitButton message="Approve this registration and create vendor login access?">
                      Approve and activate
                    </ConfirmSubmitButton>
                  </form>
                  <form action={rejectVendorRegistrationAction} className="space-y-2">
                    <input type="hidden" name="registrationId" value={registration.id} />
                    <Field label="Rejection comments">
                      <textarea className={textareaClass} name="comments" required />
                    </Field>
                    <button className="inline-flex h-10 items-center rounded-md border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                      Reject registration
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {vendors.length === 0 ? (
        <EmptyState title="No vendors" description="Create approved vendors before assigning RFQs." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-5 py-3">Vendor</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">GST / PAN</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">RFQs</th>
                <th className="px-5 py-3">Quotes</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3">
                    <Link href={`/vendors/${vendor.id}`} className="font-semibold text-zinc-950 hover:underline">
                      {vendor.companyName}
                    </Link>
                    <div className="text-xs text-zinc-500">
                      {vendor.primaryContactName ?? vendor.contactPerson} / {vendor.primaryContactEmail ?? vendor.email}
                    </div>
                  </td>
                  <td className="px-5 py-3">{vendor.category} / {formatStatus(vendor.vendorType)}</td>
                  <td className="px-5 py-3">{vendor.gstNumber ?? "-"} / {vendor.pan ?? "-"}</td>
                  <td className="px-5 py-3">{vendor.pastRating.toString()}</td>
                  <td className="px-5 py-3">{vendor._count.rfqs}</td>
                  <td className="px-5 py-3">{vendor._count.quotations}</td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone(vendor.approvedStatus)}>{formatStatus(vendor.approvedStatus)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
