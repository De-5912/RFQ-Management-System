import { submitApprovalAction } from "@/app/actions/rfqs";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge, Field, PageHeader, statusTone, textareaClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { formatDate, formatStatus } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function ApprovalsPage() {
  const user = await requireUser();
  const approvals = await prisma.approval.findMany({
    orderBy: { createdAt: "desc" },
    include: { rfq: true, approver: true, selectedVendor: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Approvals" description="HOD approval queue for final vendor selections." />
      <div className="space-y-4">
        {approvals.map((approval) => (
          <section key={approval.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-zinc-950">{approval.rfq.rfqNumber}</h2>
                  <Badge tone={statusTone(approval.status)}>{formatStatus(approval.status)}</Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{approval.rfq.description}</p>
                <div className="mt-2 text-sm text-zinc-500">
                  Selected vendor: {approval.selectedVendor?.companyName ?? "-"} / created {formatDate(approval.createdAt)}
                </div>
              </div>
              {can(user.role, "approve_vendor_selection") && approval.status === "PENDING" ? (
                <form action={submitApprovalAction} className="w-full max-w-md space-y-3">
                  <input type="hidden" name="approvalId" value={approval.id} />
                  <Field label="Comments">
                    <textarea className={textareaClass} name="comments" defaultValue={approval.comments ?? ""} />
                  </Field>
                  <div className="flex gap-2">
                    <button type="submit" name="status" value="APPROVED" className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">
                      Approve
                    </button>
                    <ConfirmSubmitButton
                      message="Reject this vendor selection?"
                      name="status"
                      value="REJECTED"
                      className="h-10 rounded-md border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Reject
                    </ConfirmSubmitButton>
                  </div>
                </form>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
