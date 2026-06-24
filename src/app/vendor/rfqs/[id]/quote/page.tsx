import { submitQuotationAction } from "@/app/actions/rfqs";
import { Field, inputClass, PageHeader, selectClass, textareaClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatStatus, isPast } from "@/lib/format";
import { paymentTermOptions } from "@/lib/master-data";
import { prisma } from "@/lib/prisma";
import { vendorRfqWhere } from "@/lib/rfq-access";
import { lockExpiredQuotations } from "@/lib/quotation-locks";

export default async function QuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(["VENDOR"]);
  const { id } = await params;
  await lockExpiredQuotations(id);
  const rfq = await prisma.rFQ.findFirst({
    where: { ...vendorRfqWhere(user), id },
    include: {
      items: { orderBy: { lineNumber: "asc" } },
      quotations: {
        where: { vendorId: user.vendorId ?? "__none__" },
        include: { items: true },
      },
    },
  });

  if (!rfq) return <PageHeader title="RFQ not found" />;

  const quote = rfq.quotations[0];
  const locked = isPast(rfq.deadline) || quote?.status === "LOCKED";
  if (locked) {
    return (
      <div className="space-y-6">
        <PageHeader title={`Quote locked: ${rfq.rfqNumber}`} description="The RFQ deadline has passed. Quotations can no longer be edited." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${quote ? "Edit" : "Submit"} quotation`}
        description={`${rfq.rfqNumber} / item-wise quoting. Current validation allows extra lines; mandatory complete-item rules can be tightened later.`}
      />
      <form action={submitQuotationAction} className="space-y-6">
        <input type="hidden" name="rfqId" value={rfq.id} />
        {quote ? <input type="hidden" name="quotationId" value={quote.id} /> : null}

        <section className="overflow-x-auto rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">RFQ item</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Unit price</th>
                <th className="px-3 py-2">Tax amount</th>
                <th className="px-3 py-2">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rfq.items.map((item, index) => {
                const existing = quote?.items.find((quoteItem) => quoteItem.rfqItemId === item.id);
                return (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      <input type="hidden" name={`rfqItemId-${index}`} value={item.id} />
                      <input className={inputClass} name={`quoteDescription-${index}`} defaultValue={existing?.description ?? item.description} required />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inputClass} type="number" step="0.001" name={`quoteQuantity-${index}`} defaultValue={existing?.quantity.toString() ?? item.quantity.toString()} required />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inputClass} type="number" step="0.01" min="0" name={`quoteUnitPrice-${index}`} defaultValue={existing?.unitPrice.toString() ?? ""} required />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inputClass} type="number" step="0.01" min="0" name={`quoteTaxAmount-${index}`} defaultValue={existing?.taxAmount.toString() ?? "0"} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inputClass} name={`quoteRemarks-${index}`} defaultValue={existing?.remarks ?? ""} />
                    </td>
                  </tr>
                );
              })}
              {[0, 1].map((extra) => {
                const index = rfq.items.length + extra;
                const existing = quote?.items.filter((item) => !item.rfqItemId)[extra];
                return (
                  <tr key={`extra-${extra}`}>
                    <td className="px-3 py-2">
                      <input className={inputClass} name={`quoteDescription-${index}`} defaultValue={existing?.description ?? ""} placeholder="Optional extra item" />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inputClass} type="number" step="0.001" name={`quoteQuantity-${index}`} defaultValue={existing?.quantity.toString() ?? ""} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inputClass} type="number" step="0.01" min="0" name={`quoteUnitPrice-${index}`} defaultValue={existing?.unitPrice.toString() ?? ""} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inputClass} type="number" step="0.01" min="0" name={`quoteTaxAmount-${index}`} defaultValue={existing?.taxAmount.toString() ?? "0"} />
                    </td>
                    <td className="px-3 py-2">
                      <input className={inputClass} name={`quoteRemarks-${index}`} defaultValue={existing?.remarks ?? ""} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Availability">
              <select className={selectClass} name="availability" defaultValue={quote?.availability ?? "AVAILABLE"}>
                <option value="AVAILABLE">Available</option>
                <option value="PARTIALLY_AVAILABLE">Partially Available</option>
                <option value="NOT_AVAILABLE">Not Available</option>
              </select>
            </Field>
            <Field label="Quantity offered">
              <input className={inputClass} type="number" step="0.001" min="0" name="quantityOffered" defaultValue={quote?.quantityOffered?.toString() ?? ""} />
            </Field>
            <Field label="Freight/transport cost">
              <input className={inputClass} type="number" step="0.01" min="0" name="freightCost" defaultValue={quote?.freightCost.toString() ?? "0"} />
            </Field>
            <Field label="Packing cost">
              <input className={inputClass} type="number" step="0.01" min="0" name="packingCost" defaultValue={quote?.packingCost.toString() ?? "0"} />
            </Field>
            <Field label="Discount">
              <input className={inputClass} type="number" step="0.01" min="0" name="discount" defaultValue={quote?.discount.toString() ?? "0"} />
            </Field>
            <Field label="Lead time days">
              <input className={inputClass} type="number" min="0" name="leadTimeDays" defaultValue={quote?.leadTimeDays ?? ""} />
            </Field>
            <Field label="Payment terms">
              <select className={selectClass} name="paymentTerms" defaultValue={quote?.paymentTerms ?? paymentTermOptions[3]}>
                {paymentTermOptions.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Warranty">
              <input className={inputClass} name="warranty" defaultValue={quote?.warranty ?? ""} />
            </Field>
            <Field label="GST">
              <input className={inputClass} type="number" step="0.01" min="0" name="taxTotal" defaultValue={quote?.taxTotal.toString() ?? "0"} />
            </Field>
            <Field label="Tax code">
              <input className={inputClass} name="taxCode" defaultValue={quote?.taxCode ?? ""} />
            </Field>
            <Field label="HSN">
              <input className={inputClass} name="hsn" defaultValue={quote?.hsn ?? ""} />
            </Field>
            <Field label="HSC">
              <input className={inputClass} name="hsc" defaultValue={quote?.hsc ?? ""} />
            </Field>
            <Field label="Import duty">
              <input className={inputClass} type="number" step="0.01" min="0" name="importDuty" defaultValue={quote?.importDuty.toString() ?? "0"} />
            </Field>
            <Field label="Retention">
              <input className={inputClass} name="retention" defaultValue={quote?.retention ?? ""} />
            </Field>
            <Field label="Bank guarantee">
              <input className={inputClass} name="bankGuarantee" defaultValue={quote?.bankGuarantee ?? ""} />
            </Field>
            <Field label="Validity date">
              <input className={inputClass} type="date" name="validityDate" defaultValue={quote?.validityDate?.toISOString().slice(0, 10) ?? ""} />
            </Field>
            <Field label="Technical compliance">
              <select className={selectClass} name="technicalCompliance" defaultValue={quote?.technicalCompliance ?? "NOT_APPLICABLE"}>
                <option value="COMPLIANT">{formatStatus("COMPLIANT")}</option>
                <option value="PARTIAL">{formatStatus("PARTIAL")}</option>
                <option value="NON_COMPLIANT">{formatStatus("NON_COMPLIANT")}</option>
                <option value="NOT_APPLICABLE">{formatStatus("NOT_APPLICABLE")}</option>
              </select>
            </Field>
            <Field label="Quotation attachment">
              <input className="block w-full rounded-md border border-zinc-300 bg-white text-sm text-zinc-700 file:mr-4 file:h-10 file:border-0 file:bg-zinc-950 file:px-4 file:text-sm file:font-semibold file:text-white" type="file" name="attachment" />
            </Field>
            <Field label="Supporting documents">
              <input className="block w-full rounded-md border border-zinc-300 bg-white text-sm text-zinc-700 file:mr-4 file:h-10 file:border-0 file:bg-zinc-950 file:px-4 file:text-sm file:font-semibold file:text-white" type="file" name="supportingAttachment" />
            </Field>
            <div className="md:col-span-3">
              <Field label="Other commercial terms">
                <textarea className={textareaClass} name="otherCommercialTerms" defaultValue={quote?.otherCommercialTerms ?? ""} />
              </Field>
            </div>
            <div className="md:col-span-3">
              <Field label="Remarks">
                <textarea className={textareaClass} name="remarks" defaultValue={quote?.remarks ?? ""} />
              </Field>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="submit"
              name="intent"
              value="draft"
              className="inline-flex h-10 items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Save Draft
            </button>
            <button
              type="submit"
              name="intent"
              value="submit"
              className="inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Submit Quote
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
