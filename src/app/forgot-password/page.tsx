import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass, PageHeader, selectClass } from "@/components/ui";
import { getBranding } from "@/lib/branding";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string }>;
}) {
  const { requested } = await searchParams;
  const branding = getBranding();

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-950">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="font-semibold">{branding.companyName}</div>
          <Link href="/login" className="text-sm font-semibold text-zinc-700 hover:text-zinc-950">
            Login
          </Link>
        </div>
        <PageHeader
          title="Forgot Password"
          description="Choose the correct account type. Employee and vendor reset workflows are tracked independently."
        />
        {requested ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            If the account exists, a reset token has been generated for local testing.
          </div>
        ) : null}
        <form action={requestPasswordResetAction} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <Field label="Account type">
            <select className={selectClass} name="audience" defaultValue="COMPANY_EMPLOYEE">
              <option value="COMPANY_EMPLOYEE">Company Employee</option>
              <option value="VENDOR">Vendor</option>
            </select>
          </Field>
          <Field label="Email address">
            <input className={inputClass} type="email" name="email" required />
          </Field>
          <SubmitButton>Generate reset link</SubmitButton>
        </form>
      </div>
    </main>
  );
}
