import {
  approveComparisonAction,
  generateComparisonAction,
  rejectComparisonAction,
  selectFinalVendorAction,
} from "@/app/actions/rfqs";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge, Field, PageHeader, statusTone, textareaClass } from "@/components/ui";
import { requirePermission } from "@/lib/auth";
import { formatDate, formatMoney, formatStatus } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { rankQuotations } from "@/lib/comparison";
import { lockExpiredQuotations } from "@/lib/quotation-locks";
import { can } from "@/lib/permissions";

export default async function ComparisonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requirePermission("view_comparison");
  const { id } = await params;
  const { error } = await searchParams;
  await lockExpiredQuotations(id);

  const rfq = await prisma.rFQ.findUnique({
    where: { id },
    include: {
      quotations: {
        include: { vendor: true, items: true },
        where: {
          status: { in: ["SUBMITTED", "LOCKED"] },
          submittedAt: { not: null },
        },
      },
      finalVendor: true,
      comparisonApprovals: { include: { approver: true }, orderBy: { stage: "asc" } },
    },
  });

  if (!rfq) return <PageHeader title="RFQ not found" />;

  const eligibleQuotations = rfq.quotations.filter(
    (quote) => quote.submittedAt && quote.submittedAt.getTime() <= rfq.deadline.getTime(),
  );
  const ranked = rankQuotations(
    eligibleQuotations.map((quote) => ({
      id: quote.id,
      vendorName: quote.vendor.companyName,
      vendorId: quote.vendorId,
      baseTotal: quote.baseTotal,
      taxTotal: quote.taxTotal,
      freightCost: quote.freightCost,
      packingCost: quote.packingCost,
      discount: quote.discount,
      leadTimeDays: quote.leadTimeDays,
      paymentTerms: quote.paymentTerms,
      warranty: quote.warranty,
      technicalCompliance: quote.technicalCompliance,
      pastRating: quote.vendor.pastRating,
      remarks: quote.remarks,
      submittedAt: quote.submittedAt,
      status: quote.status,
    })),
  );
  const now = new Date();
  const canGenerate = can(user.role, "generate_comparison") && rfq.deadline <= now;
  const canApproveComparison = can(user.role, "approve_comparison");
  const comparisonExempt = rfq.rfqType === "SPECIAL";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Evaluation sheet: ${rfq.rfqNumber}`}
        description="Commercial rank uses base quote only. Evaluation also shows lead time, technical compliance, and vendor performance; final selection remains a manual approved decision."
        actions={
          <>
            {canGenerate ? (
              <form action={generateComparisonAction}>
                <input type="hidden" name="rfqId" value={rfq.id} />
                <ConfirmSubmitButton message="Generate comparison for eligible submitted quotations?">
                  Generate Comparison
                </ConfirmSubmitButton>
              </form>
            ) : null}
          </>
        }
      />
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error === "deadline"
            ? "Comparison can be generated only after the RFQ deadline."
            : error === "comments"
              ? "Reviewer comments are required when rejecting a comparison."
              : "Final vendor selection requires approved comparison workflow."}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Badge tone={statusTone(rfq.comparisonStatus)}>
          Comparison: {formatStatus(rfq.comparisonStatus)}
        </Badge>
        <Badge tone={comparisonExempt ? "amber" : "blue"}>
          {comparisonExempt ? "Special RFQ - comparison exempt" : "Normal RFQ"}
        </Badge>
      </div>

      {canApproveComparison && rfq.comparisonStatus === "PENDING_APPROVAL" ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-zinc-950">Comparison approval</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <form action={approveComparisonAction} className="space-y-3">
              <input type="hidden" name="rfqId" value={rfq.id} />
              <Field label="Approval comments">
                <textarea className={textareaClass} name="comments" />
              </Field>
              <button className="inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
                Approve current stage
              </button>
            </form>
            <form action={rejectComparisonAction} className="space-y-3">
              <input type="hidden" name="rfqId" value={rfq.id} />
              <Field label="Rejection comments">
                <textarea className={textareaClass} name="comments" required />
              </Field>
              <button className="inline-flex h-10 items-center rounded-md border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                Reject and return to buyer
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[1300px] text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Evaluation score</th>
              <th className="px-4 py-3">Base quote</th>
              <th className="px-4 py-3">Tax</th>
              <th className="px-4 py-3">Freight</th>
              <th className="px-4 py-3">Packing</th>
              <th className="px-4 py-3">Lead time</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Warranty</th>
              <th className="px-4 py-3">Technical</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {ranked.map((quote) => (
              <tr key={quote.id} className={quote.isLowest ? "bg-emerald-50/70" : ""}>
                <td className="px-4 py-3">
                  <Badge tone={quote.isLowest ? "green" : "neutral"}>
                    {comparisonExempt ? "Exempt" : quote.rankLabel}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-semibold text-zinc-950">{quote.vendorName}</td>
                <td className="px-4 py-3">{quote.evaluationScore}</td>
                <td className="px-4 py-3 font-semibold text-zinc-950">{formatMoney(quote.baseTotal)}</td>
                <td className="px-4 py-3">{formatMoney(quote.taxTotal)}</td>
                <td className="px-4 py-3">{formatMoney(quote.freightCost)}</td>
                <td className="px-4 py-3">{formatMoney(quote.packingCost)}</td>
                <td className="px-4 py-3">{quote.leadTimeDays ?? "-"} days</td>
                <td className="px-4 py-3">{quote.paymentTerms ?? "-"}</td>
                <td className="px-4 py-3">{quote.warranty ?? "-"}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(quote.technicalCompliance)}>{formatStatus(quote.technicalCompliance)}</Badge>
                </td>
                <td className="px-4 py-3">{quote.pastRating?.toString() ?? "-"}</td>
                <td className="px-4 py-3">{formatDate(quote.submittedAt)}</td>
                <td className="px-4 py-3">
                  {rfq.comparisonStatus === "APPROVED" ? (
                    <form action={selectFinalVendorAction}>
                    <input type="hidden" name="rfqId" value={rfq.id} />
                    <input type="hidden" name="vendorId" value={quote.vendorId} />
                    <ConfirmSubmitButton
                      message={`Select ${quote.vendorName} as final vendor and log outcome emails?`}
                      className="inline-flex h-9 items-center rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Select
                    </ConfirmSubmitButton>
                    </form>
                  ) : (
                    <span className="text-xs text-zinc-500">Awaiting approval</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ranked.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No submitted quotations are available for comparison yet.
        </div>
      ) : null}

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="font-semibold text-zinc-950">Comparison approval stages</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {rfq.comparisonApprovals.map((approval) => (
            <div key={approval.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
              <div>
                <div className="font-medium text-zinc-950">{formatStatus(approval.stage)}</div>
                <div className="text-xs text-zinc-500">
                  {approval.approver?.name ?? approval.approverRoleKey ?? "Pending"} / {approval.comments ?? "No comments"}
                </div>
              </div>
              <Badge tone={statusTone(approval.status)}>{formatStatus(approval.status)}</Badge>
            </div>
          ))}
          {rfq.comparisonApprovals.length === 0 ? (
            <div className="px-5 py-6 text-sm text-zinc-500">No comparison approval decisions recorded yet.</div>
          ) : null}
        </div>
      </section>

      {rfq.finalVendor ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Current final vendor selection: <span className="font-semibold">{rfq.finalVendor.companyName}</span>.
        </div>
      ) : null}
    </div>
  );
}
