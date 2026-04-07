import { getDashboardMetrics } from "@/lib/services/order-admin-service";

export default async function DashboardHomePage() {
  const metrics = await getDashboardMetrics();

  return (
    <main className="space-y-6">
      <section className="panel shadow-sm transition hover:shadow-md hover:border-[var(--brand-orange)]/30 rounded-[2rem] border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--foreground)]">
        <p className="eyebrow mb-3 text-[var(--muted)]">Operacao ao vivo</p>
        <h1 className="text-4xl font-semibold tracking-tight">
          O balcao da lanchonete em um lugar so.
        </h1>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pedidos novos", value: metrics.newOrders },
          { label: "Em preparo", value: metrics.preparingOrders },
          { label: "Saindo para entrega", value: metrics.dispatchingOrders },
          { label: "Comandas abertas", value: metrics.openCommandas },
        ].map((metric) => (
          <article
            key={metric.label}
            className="group relative overflow-hidden panel shadow-sm transition-all hover:shadow-[0_8px_30px_rgba(140,198,63,0.15)] hover:border-[var(--brand-green)]/30 rounded-[1.5rem] bg-[var(--surface)] p-6 text-[var(--foreground)] hover:-translate-y-1"
          >
            <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-[var(--brand-green)] to-[var(--brand-green-dark)] opacity-0 transition-opacity group-hover:opacity-100" />
            <p className="text-[0.82rem] font-semibold uppercase tracking-wider text-[var(--muted)]">{metric.label}</p>
            <p className="mt-3 text-5xl font-bold tracking-tight text-[var(--brand-green-dark)]">{metric.value}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
