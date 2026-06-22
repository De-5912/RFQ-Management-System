import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import { companyRoles } from "@/lib/permissions";

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser(companyRoles());
  return (
    <AppShell user={user} mode="company">
      {children}
    </AppShell>
  );
}
