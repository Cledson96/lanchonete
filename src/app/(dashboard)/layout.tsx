import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";

const nav = [
  { href: "/dashboard", label: "Metricas" },
  { href: "/dashboard/operacao", label: "Operacao" },
  { href: "/dashboard/pedidos", label: "Arquivo" },
  { href: "/dashboard/comandas", label: "Comandas" },
  { href: "/dashboard/cardapio", label: "Cardapio" },
  { href: "/dashboard/whatsapp", label: "WhatsApp" },
];

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
      <div className="shell grid gap-6 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="panel shadow-sm transition hover:shadow-md hover:border-[var(--brand-orange)]/30 rounded-[2rem] border-[var(--line)] bg-[var(--surface)] p-5 text-[var(--foreground)]">
          <p className="eyebrow mb-4 text-[var(--muted)]">Dashboard</p>
          <div className="mb-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 overflow-hidden">
            <p className="text-sm text-[var(--muted)]">Admin ativo</p>
            <p className="mt-2 font-medium truncate" title={session.email}>{session.email}</p>
          </div>
          <nav className="space-y-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                className="block rounded-2xl px-4 py-3 text-sm text-[var(--muted)] transition hover:bg-[var(--brand-orange)]/10 hover:text-[var(--brand-orange-dark)]"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action="/api/auth/admin/logout" className="mt-5" method="post">
            <button
              className="w-full rounded-2xl border border-[var(--line)] px-4 py-3 text-left text-sm text-[var(--muted)] transition hover:bg-[var(--brand-orange)]/10 hover:text-[var(--brand-orange-dark)]"
              type="submit"
            >
              Sair do dashboard
            </button>
          </form>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
