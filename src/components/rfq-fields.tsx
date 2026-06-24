import { RFQ, RFQItem } from "@prisma/client";
import { Field, inputClass, selectClass, textareaClass } from "@/components/ui";
import { fallbackDepartments, fallbackItemServices } from "@/lib/master-data";

type RFQWithItems = RFQ & { items: RFQItem[] };

function dateValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function dateTimeValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 16);
}

export function RFQFields({
  rfq,
  departments = fallbackDepartments,
  itemServices = fallbackItemServices,
}: {
  rfq?: RFQWithItems | null;
  departments?: string[];
  itemServices?: string[];
}) {
  const rows = Array.from({ length: Math.max(6, rfq?.items.length ?? 0) });

  return (
    <div className="space-y-6">
      {rfq ? <input type="hidden" name="rfqId" value={rfq.id} /> : null}
      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-950">RFQ Request Details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="RFQ date">
            <input
              className={inputClass}
              type="date"
              name="rfqDate"
              defaultValue={dateValue(rfq?.rfqDate) || dateValue(new Date())}
              required
            />
          </Field>
          <Field label="Submission deadline">
            <input
              className={inputClass}
              type="datetime-local"
              name="deadline"
              defaultValue={dateTimeValue(rfq?.deadline)}
              required
            />
          </Field>
          <Field label="Department">
            <select className={selectClass} name="department" defaultValue={rfq?.department ?? departments[0]} required>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Requester name">
            <input
              className={inputClass}
              name="requesterName"
              defaultValue={rfq?.requesterName ?? ""}
              required
            />
          </Field>
          <Field label="Required delivery date">
            <input
              className={inputClass}
              type="date"
              name="requiredDeliveryDate"
              defaultValue={dateValue(rfq?.requiredDeliveryDate)}
            />
          </Field>
          <Field label="Delivery location">
            <input
              className={inputClass}
              name="deliveryLocation"
              defaultValue={rfq?.deliveryLocation ?? ""}
              required
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Item/service description">
              <input
                className={inputClass}
                list="item-service-options"
                name="description"
                defaultValue={rfq?.description ?? ""}
                required
              />
              <datalist id="item-service-options">
                {itemServices.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </Field>
          </div>
          <Field label="RFQ category">
            <select className={selectClass} name="rfqType" defaultValue={rfq?.rfqType ?? "NORMAL"}>
              <option value="NORMAL">Normal RFQ - 3 to 10 vendors</option>
              <option value="SPECIAL">Special RFQ - OEM / authorized / customized vendor</option>
            </select>
          </Field>
          <Field label="Preferred make/brand">
            <input
              className={inputClass}
              name="preferredMake"
              defaultValue={rfq?.preferredMake ?? ""}
            />
          </Field>
          <Field label="Payment terms">
            <input
              className={inputClass}
              name="paymentTerms"
              defaultValue={rfq?.paymentTerms ?? ""}
            />
          </Field>
          <Field label="Warranty requirement">
            <input
              className={inputClass}
              name="warrantyRequirement"
              defaultValue={rfq?.warrantyRequirement ?? ""}
            />
          </Field>
          <Field label="Taxes">
            <input className={inputClass} name="taxes" defaultValue={rfq?.taxes ?? ""} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Special vendor justification">
              <textarea
                className={textareaClass}
                name="specialVendorJustification"
                defaultValue={rfq?.specialVendorJustification ?? ""}
                placeholder="Required when a single OEM, authorized, or customized vendor is used."
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Technical specification">
              <textarea
                className={textareaClass}
                name="technicalSpecification"
                defaultValue={rfq?.technicalSpecification ?? ""}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Remarks">
              <textarea className={textareaClass} name="remarks" defaultValue={rfq?.remarks ?? ""} />
            </Field>
          </div>
          <Field label="Attachment">
            <input
              className="block w-full rounded-md border border-zinc-300 bg-white text-sm text-zinc-700 file:mr-4 file:h-10 file:border-0 file:bg-zinc-950 file:px-4 file:text-sm file:font-semibold file:text-white"
              type="file"
              name="attachment"
            />
          </Field>
          <Field label="Initial status">
            <select className={selectClass} name="status" defaultValue={rfq?.status ?? "RFQ_PREPARED"} disabled>
              <option value="RFQ_PREPARED">RFQ approval pending</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-zinc-950">RFQ Item Lines</h2>
          <span className="text-xs text-zinc-500">Fill one or more item/service rows</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Part/model</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">UOM</th>
                <th className="px-3 py-2">Specification</th>
                <th className="px-3 py-2">Preferred make</th>
                <th className="px-3 py-2">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((_, index) => {
                const item = rfq?.items[index];
                return (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <input
                        className={inputClass}
                        name={`itemDescription-${index}`}
                        defaultValue={item?.description ?? ""}
                        required={index === 0}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className={inputClass}
                        name={`itemPartNumber-${index}`}
                        defaultValue={item?.partNumber ?? ""}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className={inputClass}
                        type="number"
                        min="0"
                        step="0.001"
                        name={`itemQuantity-${index}`}
                        defaultValue={item?.quantity?.toString() ?? ""}
                        required={index === 0}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className={inputClass}
                        name={`itemUom-${index}`}
                        defaultValue={item?.uom ?? ""}
                        required={index === 0}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className={inputClass}
                        name={`itemTechnicalSpecification-${index}`}
                        defaultValue={item?.technicalSpecification ?? ""}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className={inputClass}
                        name={`itemPreferredMake-${index}`}
                        defaultValue={item?.preferredMake ?? ""}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className={inputClass}
                        name={`itemRemarks-${index}`}
                        defaultValue={item?.remarks ?? ""}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
