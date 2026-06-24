import { createVendorAction } from "@/app/actions/vendors";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass, PageHeader, selectClass, textareaClass } from "@/components/ui";
import { requirePermission } from "@/lib/auth";

export default async function NewVendorPage() {
  await requirePermission("manage_vendors");

  return (
    <div className="space-y-6">
      <PageHeader title="Create Vendor Master Record" description="Add local vendor master data, contacts, commercial details, and documents for RFQ participation." />
      <form action={createVendorAction} encType="multipart/form-data" className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Vendor code">
            <input className={inputClass} name="vendorCode" placeholder="Auto-generated if blank" />
          </Field>
          <Field label="Company name">
            <input className={inputClass} name="companyName" required />
          </Field>
          <Field label="Vendor type">
            <select className={selectClass} name="vendorType" defaultValue="REGULAR_VENDOR">
              <option value="REGULAR_VENDOR">Regular Vendor</option>
              <option value="OEM">OEM</option>
              <option value="AUTHORIZED_VENDOR">Authorized Vendor</option>
              <option value="CUSTOMIZED_VENDOR">Customized Vendor</option>
            </select>
          </Field>
          <Field label="Primary contact name">
            <input className={inputClass} name="primaryContactName" required />
          </Field>
          <Field label="Primary designation">
            <input className={inputClass} name="primaryContactDesignation" />
          </Field>
          <Field label="Primary mobile">
            <input className={inputClass} name="primaryContactMobile" required />
          </Field>
          <Field label="Primary email">
            <input className={inputClass} type="email" name="primaryContactEmail" required />
          </Field>
          <Field label="Secondary contact name">
            <input className={inputClass} name="secondaryContactName" />
          </Field>
          <Field label="Secondary designation">
            <input className={inputClass} name="secondaryContactDesignation" />
          </Field>
          <Field label="Secondary mobile">
            <input className={inputClass} name="secondaryContactMobile" />
          </Field>
          <Field label="Secondary email">
            <input className={inputClass} type="email" name="secondaryContactEmail" />
          </Field>
          <Field label="GST number">
            <input className={inputClass} name="gstNumber" />
          </Field>
          <Field label="PAN">
            <input className={inputClass} name="pan" />
          </Field>
          <Field label="Business category">
            <input className={inputClass} name="businessCategory" required />
          </Field>
          <Field label="Product category">
            <input className={inputClass} name="productCategory" />
          </Field>
          <Field label="Service category">
            <input className={inputClass} name="serviceCategory" />
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
          <Field label="City">
            <input className={inputClass} name="city" />
          </Field>
          <Field label="State">
            <input className={inputClass} name="state" />
          </Field>
          <Field label="Country">
            <input className={inputClass} name="country" defaultValue="India" />
          </Field>
          <Field label="PIN code">
            <input className={inputClass} name="pinCode" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Address">
              <textarea className={textareaClass} name="address" required />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Bank details">
              <textarea className={textareaClass} name="bankDetails" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Lead time history">
              <textarea className={textareaClass} name="leadTimeHistory" />
            </Field>
          </div>
          <Field label="GST certificate">
            <input className="block w-full text-sm" type="file" name="gstCertificate" />
          </Field>
          <Field label="PAN copy">
            <input className="block w-full text-sm" type="file" name="panCopy" />
          </Field>
          <Field label="Registration documents">
            <input className="block w-full text-sm" type="file" name="registrationDocuments" />
          </Field>
          <Field label="Other supporting documents">
            <input className="block w-full text-sm" type="file" name="supportingDocuments" />
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <SubmitButton>Create vendor</SubmitButton>
        </div>
      </form>
    </div>
  );
}
