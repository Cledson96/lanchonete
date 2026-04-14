import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { getDashboardMetrics } from "@/lib/services/order-admin-service";

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export default async function DashboardHomePage() {
  const metrics = await getDashboardMetrics();

  const summaryCards = [
    { label: "Novos agora", value: metrics.newOrders, tone: "text-amber-700 bg-amber-50 border-amber-200" },
    { label: "Em preparo", value: metrics.preparingOrders, tone: "text-[var(--brand-green-dark)] bg-[var(--brand-green)]/10 border-[var(--brand-green)]/20" },
    { label: "Comandas abertas", value: metrics.openCommandas, tone: "text-[var(--brand-orange-dark)] bg-[var(--brand-orange)]/10 border-[var(--brand-orange)]/20" },
    { label: "Concluidos hoje", value: metrics.completedToday, tone: "text-[var(--brand-green-dark)] bg-[var(--brand-green)]/10 border-[var(--brand-green)]/20" },
    { label: "Cancelados hoje", value: metrics.cancelledToday, tone: "text-red-700 bg-red-50 border-red-200" },
  ];

  return (
    <main className="space-y-6 text-[var(--foreground)]">
      <section className="panel rounded-[2rem] bg-[var(--surface)] p-6 shadow-sm transition hover:border-[var(--brand-orange)]/30 hover:shadow-md">
        <p className="eyebrow mb-3 text-[var(--muted)]">Leitura gerencial</p>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Metricas do atendimento</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Veja o que esta acontecendo agora na operacao e acompanhe volume, conclusoes,
              cancelamentos e faturamento do dia sem atrapalhar a fila da cozinha.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-[var(--brand-orange)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
              href="/dashboard/operacao"
            >
              Ir para operacao
            </Link>
            <Link
              className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
              href="/dashboard/comandas"
            >
              Ver comandas
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((metric) => (
          <article
            key={metric.label}
            className={`rounded-[1.7rem] border px-5 py-5 shadow-[0_10px_24px_rgba(45,24,11,0.04)] ${metric.tone}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">{metric.label}</p>
            <p className="mt-3 text-4xl font-bold tracking-tight">{metric.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <article className="panel rounded-[2rem] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-[var(--muted)]">Financeiro do dia</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Faturamento concluido</h2>
            </div>
            <p className="text-4xl font-bold tracking-tight text-[var(--brand-orange-dark)]">
              {formatMoney(metrics.revenueToday)}
            </p>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Soma dos pedidos finalizados hoje. Use a operacao para acompanhar pedidos em tempo real; esta tela fica como leitura de resultado.
          </p>
        </article>

        <article className="panel rounded-[2rem] bg-[var(--surface)] p-6 shadow-sm">
          <p className="eyebrow text-[var(--muted)]">Rotas rapidas</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { href: "/dashboard/operacao", label: "Operacao", text: "Novos, em preparo, prontos e saindo em um so fluxo." },
              { href: "/dashboard/comandas", label: "Comandas", text: "Comandas abertas e fechamento de contas." },
              { href: "/dashboard/pedidos", label: "Arquivo", text: "Consultar pedidos concluidos e cancelados." },
            ].map((item) => (
              <Link
                key={item.href}
                className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4 transition hover:border-[var(--brand-orange)]/30 hover:bg-[var(--background-strong)]"
                href={item.href}
              >
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.text}</p>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel rounded-[2rem] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-[var(--muted)]">Hoje por canal</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Origem dos pedidos</h2>
            </div>
            <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              pedidos do dia
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {metrics.channelBreakdown.length ? (
              metrics.channelBreakdown.map((item) => (
                <div key={item.channel} className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold capitalize">{item.channel}</p>
                    <p className="text-sm font-semibold">{item._count._all} pedidos</p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Volume bruto: {formatMoney(item._sum.totalAmount)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4 text-sm text-[var(--muted)]">
                Nenhum pedido registrado hoje por canal.
              </div>
            )}
          </div>
        </article>

        <article className="panel rounded-[2rem] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow text-[var(--muted)]">Hoje por tipo</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Entrega x retirada</h2>
            </div>
            <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              leitura operacional
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {metrics.typeBreakdown.length ? (
              metrics.typeBreakdown.map((item) => (
                <div key={item.type} className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold capitalize">{formatLabel(item.type)}</p>
                    <p className="text-sm font-semibold">{item._count._all} pedidos</p>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Volume bruto: {formatMoney(item._sum.totalAmount)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4 text-sm text-[var(--muted)]">
                Nenhum pedido registrado hoje por tipo.
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
