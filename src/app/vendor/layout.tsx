import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser(["VENDOR"]);
  return (
    <AppShell user={user} mode="vendor">
      {children}
    </AppShell>
  );
}
