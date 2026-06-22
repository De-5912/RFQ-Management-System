import { createVendorAction } from "@/app/actions/vendors";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass, PageHeader, selectClass, textareaClass } from "@/components/ui";
import { requirePermission } from "@/lib/auth";

export default async function NewVendorPage() {
  await requirePermission("manage_vendors");

  return (
    <div className="space-y-6">
      <PageHeader title="Create Vendor" description="Add local vendor master data for RFQ assignment and quotation comparison." />
      <form action={createVendorAction} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Company name">
            <input className={inputClass} name="companyName" required />
          </Field>
          <Field label="Contact person">
            <input className={inputClass} name="contactPerson" required />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" name="email" required />
          </Field>
          <Field label="Phone">
            <input className={inputClass} name="phone" required />
          </Field>
          <Field label="GST number">
            <input className={inputClass} name="gstNumber" />
          </Field>
          <Field label="PAN">
            <input className={inputClass} name="pan" />
          </Field>
          <Field label="Category">
            <input className={inputClass} name="category" required />
          </Field>
          <Field label="Approved status">
            <select className={selectClass} name="approvedStatus" defaultValue="PENDING">
              <option value="APPROVED">Approved</option>
              <option value="CONDITIONAL">Conditional</option>
              <option value="PENDING">Pending</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </Field>
          <Field label="Past rating">
            <input className={inputClass} type="number" min="0" max="5" step="0.1" name="pastRating" defaultValue="0" />
          </Field>
          <Field label="Payment terms">
            <input className={inputClass} name="paymentTerms" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Address">
              <textarea className={textareaClass} name="address" required />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Lead time history">
              <textarea className={textareaClass} name="leadTimeHistory" />
            </Field>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <SubmitButton>Create vendor</SubmitButton>
        </div>
      </form>
    </div>
  );
}
