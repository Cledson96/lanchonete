import { getDashboardMetrics } from "@/lib/services/order-admin-service";

export default async function DashboardHomePage() {
  const metrics = await getDashboardMetrics();

  return (
    <main className="space-y-6">
      <section className="panel rounded-[2rem] border-white/10 bg-white/7 p-6 text-white">
        <p className="eyebrow mb-3 text-white/60">Operacao ao vivo</p>
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
            className="panel rounded-[1.5rem] border-white/10 bg-white/7 p-5 text-white"
          >
            <p className="text-sm text-white/64">{metric.label}</p>
            <p className="mt-4 text-4xl font-semibold">{metric.value}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
