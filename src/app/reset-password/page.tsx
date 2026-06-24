import Link from "next/link";
import { resetPasswordAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass, PageHeader } from "@/components/ui";
import { getBranding } from "@/lib/branding";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token = "", error } = await searchParams;
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
        <PageHeader title="Reset Password" description="Enter a new password using the reset token generated for this account." />
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Reset token is missing, expired, or the password is too short.
          </div>
        ) : null}
        <form action={resetPasswordAction} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <Field label="Reset token">
            <input className={inputClass} name="token" defaultValue={token} required />
          </Field>
          <Field label="New password" hint="Use at least 8 characters.">
            <input className={inputClass} type="password" name="password" required />
          </Field>
          <SubmitButton>Reset password</SubmitButton>
        </form>
      </div>
    </main>
  );
}
