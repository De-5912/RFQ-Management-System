import { Role } from "@prisma/client";
import { createUserAction } from "@/app/actions/users";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Field, inputClass, PageHeader, selectClass } from "@/components/ui";
import { requirePermission } from "@/lib/auth";
import { formatRole } from "@/lib/format";
import { roleDefinitions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const roles = roleDefinitions.map((role) => role.key as Role);

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("manage_users");
  const { error } = await searchParams;
  const [users, vendors] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, include: { vendor: true } }),
    prisma.vendor.findMany({ where: { deletedAt: null }, orderBy: { companyName: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Create local users and assign procurement roles. Permission rules remain centralized for later workflow tuning."
      />
      {error === "company-domain" ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Employee email does not match the configured company email domain.
        </div>
      ) : null}
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-zinc-950">Create user</h2>
        <form action={createUserAction} className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Name">
            <input className={inputClass} name="name" required />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" name="email" required />
          </Field>
          <Field label="Password">
            <input className={inputClass} name="password" defaultValue="Password@123" required />
          </Field>
          <Field label="Role">
            <select className={selectClass} name="role" defaultValue="DEPARTMENT_REQUESTER">
              {roles.map((role) => (
                <option key={role} value={role}>{formatRole(role)}</option>
              ))}
            </select>
          </Field>
          <Field label="Department">
            <input className={inputClass} name="department" />
          </Field>
          <Field label="Designation">
            <input className={inputClass} name="designation" />
          </Field>
          <Field label="Vendor link">
            <select className={selectClass} name="vendorId" defaultValue="">
              <option value="">None</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>{vendor.companyName}</option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-3">
            <SubmitButton>Create user</SubmitButton>
          </div>
        </form>
      </section>

      <section className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Vendor</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-5 py-3">
                  <div className="font-semibold text-zinc-950">{user.name}</div>
                  <div className="text-xs text-zinc-500">{user.email}</div>
                </td>
                <td className="px-5 py-3">{formatRole(user.role)}</td>
                <td className="px-5 py-3">{user.category === "VENDOR" ? "Vendor" : "Company Employee"}</td>
                <td className="px-5 py-3">{user.department ?? "-"}</td>
                <td className="px-5 py-3">{user.vendor?.companyName ?? "-"}</td>
                <td className="px-5 py-3">
                  <Badge tone={user.isActive ? "green" : "red"}>{user.isActive ? "Active" : "Inactive"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
