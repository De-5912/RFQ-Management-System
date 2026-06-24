import Link from "next/link";
import { createVendorRegistrationAction } from "@/app/actions/vendors";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass, PageHeader, textareaClass } from "@/components/ui";
import { getBranding } from "@/lib/branding";

export default async function VendorRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const branding = getBranding();

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="font-semibold">{branding.companyName}</div>
          <Link href="/login" className="text-sm font-semibold text-zinc-700 hover:text-zinc-950">
            Back to login
          </Link>
        </div>
        <PageHeader
          title="Create Vendor Account"
          description="Submit company and contact details for manual verification. Login access is created only after company approval."
        />
        {submitted ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            Registration submitted. Status: Pending Verification.
          </div>
        ) : null}
        <form
          action={createVendorRegistrationAction}
          encType="multipart/form-data"
          className="space-y-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <section className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 text-sm font-semibold text-zinc-950">Company Information</div>
            <Field label="Company name">
              <input className={inputClass} name="companyName" required />
            </Field>
            <Field label="PIN code">
              <input className={inputClass} name="pinCode" required />
            </Field>
            <div className="md:col-span-2">
              <Field label="Address">
                <textarea className={textareaClass} name="address" required />
              </Field>
            </div>
            <Field label="City">
              <input className={inputClass} name="city" required />
            </Field>
            <Field label="State">
              <input className={inputClass} name="state" required />
            </Field>
            <Field label="Country">
              <input className={inputClass} name="country" defaultValue="India" required />
            </Field>
            <Field label="Business category">
              <input className={inputClass} name="businessCategory" />
            </Field>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 text-sm font-semibold text-zinc-950">Primary Contact</div>
            <Field label="Name">
              <input className={inputClass} name="primaryContactName" required />
            </Field>
            <Field label="Designation">
              <input className={inputClass} name="primaryContactDesignation" />
            </Field>
            <Field label="Mobile number">
              <input className={inputClass} name="primaryContactMobile" required />
            </Field>
            <Field label="Email">
              <input className={inputClass} type="email" name="primaryContactEmail" required />
            </Field>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 text-sm font-semibold text-zinc-950">Secondary Contact</div>
            <Field label="Name">
              <input className={inputClass} name="secondaryContactName" />
            </Field>
            <Field label="Designation">
              <input className={inputClass} name="secondaryContactDesignation" />
            </Field>
            <Field label="Mobile number">
              <input className={inputClass} name="secondaryContactMobile" />
            </Field>
            <Field label="Email">
              <input className={inputClass} type="email" name="secondaryContactEmail" />
            </Field>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 text-sm font-semibold text-zinc-950">Business Information</div>
            <Field label="GST number">
              <input className={inputClass} name="gstNumber" />
            </Field>
            <Field label="PAN number">
              <input className={inputClass} name="pan" />
            </Field>
            <Field label="Product category">
              <input className={inputClass} name="productCategory" />
            </Field>
            <Field label="Service category">
              <input className={inputClass} name="serviceCategory" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Bank details">
                <textarea className={textareaClass} name="bankDetails" />
              </Field>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-3 text-sm font-semibold text-zinc-950">Documents</div>
            <Field label="GST certificate">
              <input className="block w-full text-sm" type="file" name="gstCertificate" />
            </Field>
            <Field label="PAN copy">
              <input className="block w-full text-sm" type="file" name="panCopy" />
            </Field>
            <Field label="Supporting documents">
              <input className="block w-full text-sm" type="file" name="supportingDocuments" multiple />
            </Field>
          </section>

          <div className="flex justify-end">
            <SubmitButton>Submit for verification</SubmitButton>
          </div>
        </form>
      </div>
    </main>
  );
}
