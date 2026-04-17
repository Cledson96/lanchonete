import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";
import { BrandLogo } from "@/components/brand-logo";
import { DashboardNav } from "@/components/dashboard-nav";

function LogoutIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/dashboard/login");
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="shell grid gap-6 py-6 lg:grid-cols-[240px_minmax(0,1fr)]">

        {/* ─── Sidebar ─── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">

            {/* Logo */}
            <div className="mb-4 px-1">
              <Link href="/dashboard">
                <BrandLogo compact theme="light" />
              </Link>
            </div>

            <div className="mb-4 rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Admin ativo</p>
              <p className="mt-1 truncate text-sm font-medium" title={session.email}>
                {session.email}
              </p>
            </div>

            {/* Nav */}
            <DashboardNav />

            {/* Sair */}
            <div className="mt-4 border-t border-[var(--line)] pt-4">
              <form action="/api/auth/admin/logout" method="post">
                <button
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition-all hover:bg-red-50 hover:text-red-600"
                  type="submit"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--background-strong)] transition-colors group-hover:bg-red-100 group-hover:text-red-600">
                    <LogoutIcon />
                  </span>
                  Sair do dashboard
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* ─── Conteúdo ─── */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
