import Link from "next/link";
import { FileText, Mail, Pencil, Scale, Send, Store } from "lucide-react";
import {
  approveRFQForReleaseAction,
  changeRFQStatusAction,
  updatePOStatusAction,
} from "@/app/actions/rfqs";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge, ButtonLink, Field, inputClass, PageHeader, selectClass, statusTone } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { editableStatuses } from "@/lib/permissions";
import { formatDate, formatDateTime, formatMoney, formatStatus } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { companyRfqWhere } from "@/lib/rfq-access";

export default async function RFQDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const rfq = await prisma.rFQ.findFirst({
    where: { ...companyRfqWhere(user), id },
    include: {
      items: { orderBy: { lineNumber: "asc" } },
      vendors: { include: { vendor: true }, orderBy: { assignedAt: "asc" } },
      quotations: { include: { vendor: true }, orderBy: { submittedAt: "desc" } },
      attachments: { orderBy: { createdAt: "desc" } },
      approvals: { include: { approver: true, selectedVendor: true }, orderBy: { createdAt: "desc" } },
      emailLogs: { include: { vendor: true }, orderBy: { sentAt: "desc" } },
      finalVendor: true,
      createdBy: true,
    },
  });

  if (!rfq) {
    return <PageHeader title="RFQ not found" description="You may not have access to this RFQ." />;
  }

  const canManageRfqs = can(user.role, "manage_rfqs");
  const canAssignVendors = can(user.role, "assign_vendors");
  const canApproveRFQ = can(user.role, "approve_rfqs");
  const canCompare = can(user.role, "view_comparison");
  const canUpdatePo = can(user.role, "update_po_status");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${rfq.rfqNumber}`}
        description={rfq.description}
        actions={
          <>
            {canManageRfqs ? (
            <ButtonLink href={`/rfqs/${rfq.id}/edit`} variant="secondary">
              <Pencil className="h-4 w-4" />
              Edit RFQ
            </ButtonLink>
            ) : null}
            {canAssignVendors && rfq.rfqApprovalStatus === "APPROVED" ? (
            <ButtonLink href={`/rfqs/${rfq.id}/vendors`} variant="secondary">
              <Store className="h-4 w-4" />
              Release to Vendors
            </ButtonLink>
            ) : null}
            {canCompare ? (
            <ButtonLink href={`/rfqs/${rfq.id}/comparison`}>
              <Scale className="h-4 w-4" />
              Compare Quotes
            </ButtonLink>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={statusTone(rfq.status)}>{formatStatus(rfq.status)}</Badge>
            <Badge tone={statusTone(rfq.rfqApprovalStatus)}>
              Release approval: {formatStatus(rfq.rfqApprovalStatus)}
            </Badge>
            <span className="text-sm text-zinc-500">Created by {rfq.createdBy.name}</span>
          </div>
          <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-500">Department</dt>
              <dd className="mt-1 text-zinc-950">{rfq.department}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Requester</dt>
              <dd className="mt-1 text-zinc-950">{rfq.requesterName}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">RFQ category</dt>
              <dd className="mt-1 text-zinc-950">{formatStatus(rfq.rfqType)}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">RFQ date</dt>
              <dd className="mt-1 text-zinc-950">{formatDate(rfq.rfqDate)}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Deadline</dt>
              <dd className="mt-1 text-zinc-950">{formatDateTime(rfq.deadline)}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Required delivery</dt>
              <dd className="mt-1 text-zinc-950">{formatDate(rfq.requiredDeliveryDate)}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Delivery location</dt>
              <dd className="mt-1 text-zinc-950">{rfq.deliveryLocation}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Payment terms</dt>
              <dd className="mt-1 text-zinc-950">{rfq.paymentTerms ?? "-"}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Warranty</dt>
              <dd className="mt-1 text-zinc-950">{rfq.warrantyRequirement ?? "-"}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">SAP reference</dt>
              <dd className="mt-1 text-zinc-950">{rfq.sapReferenceNumber ?? "-"}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Integration status</dt>
              <dd className="mt-1 text-zinc-950">{formatStatus(rfq.integrationStatus)}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-medium text-zinc-500">Special vendor justification</dt>
              <dd className="mt-1 whitespace-pre-wrap text-zinc-950">{rfq.specialVendorJustification ?? "-"}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="font-medium text-zinc-500">Technical specification</dt>
              <dd className="mt-1 whitespace-pre-wrap text-zinc-950">{rfq.technicalSpecification ?? "-"}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-4">
          {canApproveRFQ && rfq.rfqApprovalStatus === "PENDING" ? (
            <form action={approveRFQForReleaseAction} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <input type="hidden" name="rfqId" value={rfq.id} />
              <div className="text-sm font-semibold text-zinc-950">RFQ release approval</div>
              <p className="mt-1 text-sm text-zinc-600">
                Approval allows buyer users to release this RFQ to selected vendors.
              </p>
              <div className="mt-4">
                <ConfirmSubmitButton message="Approve this RFQ for vendor release?">
                  Approve RFQ release
                </ConfirmSubmitButton>
              </div>
            </form>
          ) : null}

          {canManageRfqs ? (
          <form action={changeRFQStatusAction} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <input type="hidden" name="rfqId" value={rfq.id} />
            <Field label="RFQ workflow status">
              <select className={selectClass} name="status" defaultValue={rfq.status}>
                {editableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="mt-4">
              <ConfirmSubmitButton message="Change RFQ status?">Save workflow status</ConfirmSubmitButton>
            </div>
          </form>
          ) : null}

          {canUpdatePo ? (
            <form action={updatePOStatusAction} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <input type="hidden" name="rfqId" value={rfq.id} />
              <Field label="SAP PO number">
                <input className={inputClass} name="poNumber" defaultValue={rfq.poNumber ?? ""} />
              </Field>
              <div className="mt-4">
                <Field label="SAP reference number">
                  <input className={inputClass} name="sapReferenceNumber" defaultValue={rfq.sapReferenceNumber ?? ""} />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Integration status">
                  <select className={selectClass} name="integrationStatus" defaultValue={rfq.integrationStatus}>
                    <option value="NOT_READY">Not ready</option>
                    <option value="PENDING">Pending</option>
                    <option value="SENT">Sent</option>
                    <option value="FAILED">Failed</option>
                    <option value="SYNCED">Synced</option>
                  </select>
                </Field>
              </div>
              <div className="mt-4">
                <ConfirmSubmitButton message="Update SAP readiness fields for this RFQ?">
                  Save SAP readiness
                </ConfirmSubmitButton>
              </div>
            </form>
          ) : null}
        </section>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="font-semibold text-zinc-950">Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-5 py-3">Line</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Part/model</th>
                <th className="px-5 py-3">Qty</th>
                <th className="px-5 py-3">UOM</th>
                <th className="px-5 py-3">Specification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rfq.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-3">{item.lineNumber}</td>
                  <td className="px-5 py-3 font-medium text-zinc-950">{item.description}</td>
                  <td className="px-5 py-3">{item.partNumber ?? "-"}</td>
                  <td className="px-5 py-3">{item.quantity.toString()}</td>
                  <td className="px-5 py-3">{item.uom}</td>
                  <td className="px-5 py-3">{item.technicalSpecification ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
            <h2 className="font-semibold text-zinc-950">Assigned Vendors</h2>
            {canAssignVendors ? (
            <Link href={`/rfqs/${rfq.id}/vendors`} className="text-sm font-semibold text-zinc-700 hover:text-zinc-950">
              Assign / email
            </Link>
            ) : null}
          </div>
          <div className="divide-y divide-zinc-100">
            {rfq.vendors.map(({ vendor, emailSentAt }) => (
              <div key={vendor.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <div className="font-medium text-zinc-950">{vendor.companyName}</div>
                  <div className="text-xs text-zinc-500">{vendor.email}</div>
                </div>
                <Badge tone={emailSentAt ? "green" : "amber"}>
                  {emailSentAt ? "Email logged" : "Pending email"}
                </Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="font-semibold text-zinc-950">Vendor quotation status</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {rfq.quotations.map((quote) => (
              <div key={quote.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <div className="font-medium text-zinc-950">{quote.vendor.companyName}</div>
                  <div className="text-xs text-zinc-500">
                    {canCompare
                      ? `Base quote ${formatMoney(quote.baseTotal)} / lead time ${quote.leadTimeDays ?? "-"} days`
                      : `Submitted ${formatDateTime(quote.submittedAt)}`}
                  </div>
                </div>
                <Badge tone={statusTone(quote.status)}>{formatStatus(quote.status)}</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-zinc-950">
            <FileText className="h-4 w-4" />
            Attachments
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            {rfq.attachments.length ? (
              rfq.attachments.map((file) => (
                <Link key={file.id} href={`/api/attachments/${file.id}`} className="block text-zinc-700 hover:underline">
                  {file.fileName}
                </Link>
              ))
            ) : (
              <p className="text-zinc-500">No attachments uploaded.</p>
            )}
          </div>
        </section>
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-zinc-950">
            <Mail className="h-4 w-4" />
            Email log
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            {rfq.emailLogs.slice(0, 5).map((email) => (
              <div key={email.id}>
                <span className="font-medium">{email.vendor.companyName}</span>
                <span className="text-zinc-500"> / {formatStatus(email.status)}</span>
              </div>
            ))}
            {rfq.emailLogs.length === 0 ? <p className="text-zinc-500">No RFQ email logged yet.</p> : null}
          </div>
        </section>
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-zinc-950">
            <Send className="h-4 w-4" />
            Approval
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            {rfq.approvals.map((approval) => (
              <div key={approval.id}>
                <div className="font-medium">{approval.approver.name}</div>
                <div className="text-zinc-500">
                  {approval.selectedVendor?.companyName ?? "-"} / {formatStatus(approval.status)}
                </div>
              </div>
            ))}
            {rfq.approvals.length === 0 ? <p className="text-zinc-500">No approval request yet.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
