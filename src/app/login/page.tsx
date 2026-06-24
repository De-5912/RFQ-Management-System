import { redirect } from "next/navigation";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getBranding } from "@/lib/branding";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; passwordReset?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.category === "VENDOR" ? "/vendor/dashboard" : "/dashboard");

  const params = await searchParams;
  const branding = getBranding();

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-7 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-950">{branding.companyName}</h1>
            <p className="text-sm text-zinc-500">Company and vendor portal</p>
          </div>
        </div>

        {params.error ? (
          <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Invalid email or password.
          </div>
        ) : null}
        {params.passwordReset ? (
          <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Password reset complete. Sign in with your new password.
          </div>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4">
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              name="email"
              defaultValue="admin@rfq.local"
              required
            />
          </Field>
          <Field label="Password">
            <input
              className={inputClass}
              type="password"
              name="password"
              defaultValue="Password@123"
              required
            />
          </Field>
          <SubmitButton>Sign in</SubmitButton>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/forgot-password" className="font-semibold text-zinc-700 hover:text-zinc-950">
            Forgot password?
          </Link>
          <Link href="/vendor/register" className="font-semibold text-zinc-700 hover:text-zinc-950">
            Create Vendor Account
          </Link>
        </div>

        <div className="mt-6 rounded-md bg-zinc-50 p-3 text-xs leading-5 text-zinc-600">
          Seed users share password <span className="font-semibold">Password@123</span>.
          Try admin@rfq.local, purchase.executive@rfq.local, hod@rfq.local,
          finance@rfq.local, vendor.alpha@rfq.local.
        </div>
      </div>
    </main>
  );
}
