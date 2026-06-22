import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { CurrentUser } from "@/lib/auth";
import { formatRole } from "@/lib/format";
import { ToastFromSearch } from "@/components/toast-from-search";

const companyNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rfqs", label: "RFQs", icon: ClipboardList },
  { href: "/vendors", label: "Vendors", icon: Store },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/settings/users", label: "Users", icon: Users },
];

const vendorNav = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/rfqs", label: "Assigned RFQs", icon: FileClock },
  { href: "/vendor/quotations", label: "Quotations", icon: ClipboardList },
  { href: "/vendor/profile", label: "Profile", icon: Settings },
];

export function AppShell({
  user,
  mode,
  children,
}: {
  user: CurrentUser;
  mode: "company" | "vendor";
  children: React.ReactNode;
}) {
  const nav = mode === "vendor" ? vendorNav : companyNav;

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <ToastFromSearch />
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-zinc-200 bg-white lg:block">
        <div className="border-b border-zinc-200 px-6 py-5">
          <div className="text-lg font-semibold">RFQ Management</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            {mode === "vendor" ? "Vendor Portal" : "Company Portal"}
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-950">
                {user.name}
              </div>
              <div className="truncate text-xs text-zinc-500">
                {formatRole(user.role)}
                {user.vendor?.companyName ? ` / ${user.vendor.companyName}` : ""}
              </div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
