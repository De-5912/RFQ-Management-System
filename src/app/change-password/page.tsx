import Link from "next/link";
import { changePasswordAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ changed?: string; error?: string }>;
}) {
  const user = await requireUser();
  const { changed, error } = await searchParams;

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-950">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="truncate font-semibold">{user.name}</div>
            <div className="truncate text-xs text-zinc-500">{user.email}</div>
          </div>
          <Link
            href={user.category === "VENDOR" ? "/vendor/dashboard" : "/dashboard"}
            className="text-sm font-semibold text-zinc-700 hover:text-zinc-950"
          >
            Back
          </Link>
        </div>
        <PageHeader title="Change Password" description="Update your current login password." />
        {changed ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Password changed successfully.
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Check your current password and use a new password with at least 8 characters.
          </div>
        ) : null}
        <form action={changePasswordAction} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <Field label="Current password">
            <input className={inputClass} type="password" name="currentPassword" required />
          </Field>
          <Field label="New password">
            <input className={inputClass} type="password" name="newPassword" required />
          </Field>
          <SubmitButton>Change password</SubmitButton>
        </form>
      </div>
    </main>
  );
}
