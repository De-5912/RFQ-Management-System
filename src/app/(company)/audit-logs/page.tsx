import { PageHeader } from "@/components/ui";
import { requirePermission } from "@/lib/auth";
import { formatDateTime, formatRole } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function AuditLogsPage() {
  await requirePermission("view_audit_logs");
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail"
        description="Immutable action trail for logins, RFQs, quotations, approvals, emails, attachments, and report downloads."
      />
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">Target</th>
              <th className="px-5 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-5 py-3">{formatDateTime(log.createdAt)}</td>
                <td className="px-5 py-3">{log.user?.name ?? "System"}</td>
                <td className="px-5 py-3">{log.userRole ? formatRole(log.userRole) : "-"}</td>
                <td className="px-5 py-3 font-medium text-zinc-950">{log.action}</td>
                <td className="px-5 py-3">{log.entityType}</td>
                <td className="px-5 py-3">{log.details ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
