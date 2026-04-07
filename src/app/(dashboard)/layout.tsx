import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";

const nav = [
  { href: "/dashboard", label: "Resumo" },
  { href: "/dashboard/pedidos", label: "Pedidos" },
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
    <div className="min-h-screen bg-[#1b120e] text-white">
      <div className="shell grid gap-6 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="panel rounded-[2rem] border-white/10 bg-white/7 p-5 text-white">
          <p className="eyebrow mb-4 text-white/60">Dashboard</p>
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/8 px-4 py-4">
            <p className="text-sm text-white/56">Admin ativo</p>
            <p className="mt-2 font-medium">{session.email}</p>
          </div>
          <nav className="space-y-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                className="block rounded-2xl px-4 py-3 text-sm text-white/82 transition hover:bg-white/10"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action="/api/auth/admin/logout" className="mt-5" method="post">
            <button
              className="w-full rounded-2xl border border-white/10 px-4 py-3 text-left text-sm text-white/82 transition hover:bg-white/10"
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
