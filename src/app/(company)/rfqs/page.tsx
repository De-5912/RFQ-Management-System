import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, ButtonLink, EmptyState, PageHeader, statusTone } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDate, formatStatus } from "@/lib/format";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { companyRfqWhere } from "@/lib/rfq-access";

export default async function RFQListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const { q } = await searchParams;
  const canPrepareRfqs = can(user.role, "manage_rfqs");
  const where = {
    ...companyRfqWhere(user),
    ...(q
      ? {
          OR: [
            { rfqNumber: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { department: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const rfqs = await prisma.rFQ.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { vendors: true, quotations: true, finalVendor: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="RFQ Workspace"
        description="Track each RFQ from preparation through vendor assignment, quotation receipt, comparison, approval, PO update, and closure."
        actions={
          canPrepareRfqs ? (
          <ButtonLink href="/rfqs/new">
            <Plus className="h-4 w-4" />
            Prepare RFQ
          </ButtonLink>
          ) : null
        }
      />

      <form className="flex max-w-xl gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search RFQ number, department, description"
          className="h-10 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm"
        />
        <button className="rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800">
          Search
        </button>
      </form>

      {rfqs.length === 0 ? (
        <EmptyState
          title="No RFQs found"
          description="Adjust your search filters or prepare a new RFQ if your role allows it."
          action={
            canPrepareRfqs ? (
              <ButtonLink href="/rfqs/new">Prepare RFQ</ButtonLink>
            ) : null
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-5 py-3">RFQ</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Deadline</th>
                <th className="px-5 py-3">Assigned vendors</th>
                <th className="px-5 py-3">Vendor quotes</th>
                <th className="px-5 py-3">Final vendor</th>
                <th className="px-5 py-3">Workflow status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rfqs.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3">
                    <Link href={`/rfqs/${rfq.id}`} className="font-semibold text-zinc-950 hover:underline">
                      {rfq.rfqNumber}
                    </Link>
                    <div className="line-clamp-1 text-xs text-zinc-500">{rfq.description}</div>
                  </td>
                  <td className="px-5 py-3">{rfq.department}</td>
                  <td className="px-5 py-3">{formatDate(rfq.deadline)}</td>
                  <td className="px-5 py-3">{rfq.vendors.length}</td>
                  <td className="px-5 py-3">{rfq.quotations.length}</td>
                  <td className="px-5 py-3">{rfq.finalVendor?.companyName ?? "-"}</td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone(rfq.status)}>{formatStatus(rfq.status)}</Badge>
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
