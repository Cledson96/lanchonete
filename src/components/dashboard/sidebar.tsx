"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/logo";
import { DashboardNav } from "./nav";

const STORAGE_KEY = "dashboard-sidebar-collapsed";

type DashboardSidebarProps = {
  email: string;
};

function LogoutIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      {collapsed ? (
        <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M15.75 19.5l-7.5-7.5 7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function DashboardSidebar({ email }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <aside className={`w-full shrink-0 transition-[width] duration-200 lg:sticky lg:top-5 lg:self-start ${collapsed ? "lg:w-[5rem]" : "lg:w-64"}`}>
      <div className={`rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition-all ${collapsed ? "lg:px-3" : ""}`}>
        <div className={`mb-4 flex items-center gap-2 ${collapsed ? "lg:justify-center" : "justify-between"}`}>
          <Link className={`min-w-0 overflow-hidden ${collapsed ? "lg:w-[42px]" : ""}`} href="/dashboard" title="Dashboard">
            <BrandLogo compact theme="light" />
          </Link>

          <button
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            aria-pressed={collapsed}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--background)] text-[var(--muted)] transition hover:bg-[var(--background-strong)] hover:text-[var(--foreground)] lg:inline-flex"
            onClick={toggleCollapsed}
            type="button"
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        </div>

        <div className={`mb-4 rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-3 ${collapsed ? "lg:hidden" : ""}`}>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Admin ativo</p>
          <p className="mt-1 truncate text-sm font-medium" title={email}>
            {email}
          </p>
        </div>

        <DashboardNav collapsed={collapsed} />

        <div className="mt-4 border-t border-[var(--line)] pt-4">
          <form action="/api/auth/admin/logout" method="post">
            <button
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition-all hover:bg-red-50 hover:text-red-600 ${collapsed ? "lg:justify-center lg:px-2" : ""}`}
              title="Sair do dashboard"
              type="submit"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--background-strong)] transition-colors group-hover:bg-red-100 group-hover:text-red-600">
                <LogoutIcon />
              </span>
              <span className={collapsed ? "lg:hidden" : ""}>Sair do dashboard</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
