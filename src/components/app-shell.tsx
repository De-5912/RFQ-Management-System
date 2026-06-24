import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  FileClock,
  KeyRound,
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
import { getBranding } from "@/lib/branding";
import { formatRole } from "@/lib/format";
import { can, Permission } from "@/lib/permissions";
import { ToastFromSearch } from "@/components/toast-from-search";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  anyPermissions?: Permission[];
};

const companyNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/rfqs",
    label: "Create / Track RFQs",
    icon: ClipboardList,
    anyPermissions: ["create_rfqs", "manage_rfqs", "view_comparison"],
  },
  {
    href: "/vendors",
    label: "Vendor Master",
    icon: Store,
    anyPermissions: ["manage_vendors", "verify_vendors"],
  },
  {
    href: "/approvals",
    label: "Workflow Approvals",
    icon: ShieldCheck,
    anyPermissions: ["approve_rfqs", "approve_comparison", "approve_vendor_selection"],
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    anyPermissions: ["download_reports"],
  },
  {
    href: "/audit-logs",
    label: "Audit Trail",
    icon: ScrollText,
    anyPermissions: ["view_audit_logs"],
  },
  {
    href: "/settings/users",
    label: "Users & Roles",
    icon: Users,
    anyPermissions: ["manage_users"],
  },
];

const vendorNav: NavItem[] = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/rfqs", label: "Pending RFQs", icon: FileClock },
  { href: "/vendor/quotations", label: "Submitted Quotes", icon: ClipboardList },
  { href: "/vendor/profile", label: "Profile", icon: Settings },
];

function visibleNavItems(user: CurrentUser, mode: "company" | "vendor") {
  const nav = mode === "vendor" ? vendorNav : companyNav;

  return nav.filter((item) => {
    if (!item.anyPermissions) return true;
    return item.anyPermissions.some((permission) => can(user.role, permission));
  });
}

export function AppShell({
  user,
  mode,
  children,
}: {
  user: CurrentUser;
  mode: "company" | "vendor";
  children: React.ReactNode;
}) {
  const nav = visibleNavItems(user, mode);
  const branding = getBranding();

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <ToastFromSearch />
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-zinc-200 bg-white lg:block">
        <div className="border-b border-zinc-200 px-6 py-5">
          <div className="flex items-center gap-3">
            {branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logoUrl}
                alt={`${branding.companyName} logo`}
                className="h-10 w-10 rounded-md object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-950 text-sm font-bold text-white">
                {branding.initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold">{branding.companyName}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                {mode === "vendor" ? "Vendor Portal" : "Company Portal"}
              </div>
            </div>
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
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-xs font-bold text-white lg:hidden">
                {branding.initials}
              </div>
              <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-950">
                {user.name}
              </div>
              <div className="truncate text-xs text-zinc-500">
                {formatRole(user.role)}
                {user.vendor?.companyName ? ` / ${user.vendor.companyName}` : ""}
              </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
            <Link
              href="/change-password"
              className="hidden h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:inline-flex"
            >
              <KeyRound className="h-4 w-4" />
              Password
            </Link>
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
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
