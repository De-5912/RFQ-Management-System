import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, ButtonLink, EmptyState, PageHeader, statusTone } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatStatus } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function VendorsPage() {
  const user = await requireUser();
  const vendors = await prisma.vendor.findMany({
    where: { deletedAt: null },
    orderBy: { companyName: "asc" },
    include: { _count: { select: { rfqs: true, quotations: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Master"
        description="Maintain local vendor records used for RFQ assignment, email dispatch, and quotation comparison."
        actions={
          can(user.role, "manage_vendors") ? (
            <ButtonLink href="/vendors/new">
              <Plus className="h-4 w-4" />
              New vendor
            </ButtonLink>
          ) : null
        }
      />
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
                    <div className="text-xs text-zinc-500">{vendor.contactPerson} / {vendor.email}</div>
                  </td>
                  <td className="px-5 py-3">{vendor.category}</td>
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
