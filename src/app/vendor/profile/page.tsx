import { Badge, PageHeader, statusTone } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatStatus } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function VendorProfilePage() {
  const user = await requireUser(["VENDOR"]);
  const vendor = user.vendorId
    ? await prisma.vendor.findUnique({ where: { id: user.vendorId } })
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Vendor Profile" description="Read-only local vendor master data. Changes are handled by company-side admin users." />
      {vendor ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-950">{vendor.companyName}</h2>
            <Badge tone={statusTone(vendor.approvedStatus)}>{formatStatus(vendor.approvedStatus)}</Badge>
          </div>
          <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
            <div><dt className="font-medium text-zinc-500">Contact</dt><dd>{vendor.contactPerson}</dd></div>
            <div><dt className="font-medium text-zinc-500">Email</dt><dd>{vendor.email}</dd></div>
            <div><dt className="font-medium text-zinc-500">Phone</dt><dd>{vendor.phone}</dd></div>
            <div><dt className="font-medium text-zinc-500">Category</dt><dd>{vendor.category}</dd></div>
            <div><dt className="font-medium text-zinc-500">GST</dt><dd>{vendor.gstNumber ?? "-"}</dd></div>
            <div><dt className="font-medium text-zinc-500">PAN</dt><dd>{vendor.pan ?? "-"}</dd></div>
            <div><dt className="font-medium text-zinc-500">Payment terms</dt><dd>{vendor.paymentTerms ?? "-"}</dd></div>
            <div><dt className="font-medium text-zinc-500">Rating</dt><dd>{vendor.pastRating.toString()}</dd></div>
            <div className="md:col-span-2"><dt className="font-medium text-zinc-500">Address</dt><dd>{vendor.address}</dd></div>
            <div className="md:col-span-2"><dt className="font-medium text-zinc-500">Lead time history</dt><dd>{vendor.leadTimeHistory ?? "-"}</dd></div>
          </dl>
        </section>
      ) : (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-500">
          Your account is not linked to a vendor master record.
        </section>
      )}
    </div>
  );
}
