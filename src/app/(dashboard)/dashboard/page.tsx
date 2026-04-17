import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { getDashboardMetrics } from "@/lib/services/order-admin-service";

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function BellIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FireIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CurrencyIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="h-6 w-6">
      <path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function DashboardHomePage() {
  const metrics = await getDashboardMetrics();

  const kpis = [
    {
      label: "Novos agora",
      value: metrics.newOrders,
      icon: <BellIcon />,
      urgent: metrics.newOrders > 0,
      iconBg: "bg-amber-100 text-amber-700",
      valueCls: metrics.newOrders > 0 ? "text-amber-700" : "text-[var(--foreground)]",
      cardCls: metrics.newOrders > 0
        ? "border-amber-200 bg-amber-50"
        : "border-[var(--line)] bg-[var(--surface)]",
    },
    {
      label: "Em preparo",
      value: metrics.preparingOrders,
      icon: <FireIcon />,
      urgent: false,
      iconBg: "bg-[var(--brand-green)]/15 text-[var(--brand-green-dark)]",
      valueCls: "text-[var(--brand-green-dark)]",
      cardCls: "border-[var(--brand-green)]/20 bg-[var(--brand-green)]/5",
    },
    {
      label: "Saiu p/ entrega",
      value: metrics.dispatchingOrders,
      icon: <TruckIcon />,
      urgent: false,
      iconBg: "bg-sky-100 text-sky-700",
      valueCls: "text-sky-700",
      cardCls: "border-sky-200 bg-sky-50",
    },
    {
      label: "Comandas abertas",
      value: metrics.openCommandas,
      icon: <ClipboardIcon />,
      urgent: false,
      iconBg: "bg-[var(--brand-orange)]/15 text-[var(--brand-orange-dark)]",
      valueCls: "text-[var(--brand-orange-dark)]",
      cardCls: "border-[var(--brand-orange)]/20 bg-[var(--brand-orange)]/5",
    },
    {
      label: "Concluídos hoje",
      value: metrics.completedToday,
      icon: <CheckIcon />,
      urgent: false,
      iconBg: "bg-emerald-100 text-emerald-700",
      valueCls: "text-emerald-700",
      cardCls: "border-emerald-200 bg-emerald-50",
    },
    {
      label: "Cancelados hoje",
      value: metrics.cancelledToday,
      icon: <XCircleIcon />,
      urgent: metrics.cancelledToday > 0,
      iconBg: "bg-red-100 text-red-600",
      valueCls: metrics.cancelledToday > 0 ? "text-red-600" : "text-[var(--foreground)]",
      cardCls: metrics.cancelledToday > 0
        ? "border-red-200 bg-red-50"
        : "border-[var(--line)] bg-[var(--surface)]",
    },
  ];

  return (
    <main className="space-y-6 text-[var(--foreground)]">

      {/* ─── Cabeçalho ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow text-[var(--muted)]">Leitura gerencial</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Métricas de atendimento</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-full bg-[var(--brand-orange)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
            href="/dashboard/operacao"
          >
            Ir para operação
          </Link>
          <Link
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background-strong)]"
            href="/dashboard/comandas"
          >
            Ver comandas
          </Link>
        </div>
      </div>

      {/* ─── KPI Grid ─── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <article
            key={kpi.label}
            className={`relative rounded-2xl border p-4 shadow-[0_2px_12px_rgba(45,24,11,0.05)] transition hover:shadow-[0_4px_20px_rgba(45,24,11,0.08)] ${kpi.cardCls}`}
          >
            {kpi.urgent && (
              <span className="absolute right-3 top-3 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
            )}
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${kpi.iconBg}`}>
              {kpi.icon}
            </span>
            <p className="mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {kpi.label}
            </p>
            <p className={`mt-1 text-3xl font-bold tracking-tight ${kpi.valueCls}`}>
              {kpi.value}
            </p>
          </article>
        ))}
      </div>

      {/* ─── Faturamento destaque ─── */}
      <article className="flex flex-col gap-4 rounded-2xl border border-[var(--brand-orange)]/20 bg-gradient-to-r from-[var(--brand-orange)]/8 to-[var(--brand-orange)]/4 p-5 shadow-[0_2px_12px_rgba(45,24,11,0.05)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-orange)]/15 text-[var(--brand-orange-dark)]">
            <CurrencyIcon />
          </span>
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Financeiro do dia</p>
            <p className="text-sm font-medium text-[var(--foreground)]">Soma dos pedidos finalizados hoje</p>
          </div>
        </div>
        <p className="text-4xl font-bold tracking-tight text-[var(--brand-orange-dark)]">
          {formatMoney(metrics.revenueToday)}
        </p>
      </article>

      {/* ─── Breakdown por canal e tipo ─── */}
      {(() => {
        const channelTotal = metrics.channelBreakdown.reduce((s, i) => s + i._count._all, 0);
        const typeTotal = metrics.typeBreakdown.reduce((s, i) => s + i._count._all, 0);

        const channelColors = [
          { bar: "bg-[var(--brand-orange)]", text: "text-[var(--brand-orange-dark)]" },
          { bar: "bg-[var(--brand-green)]", text: "text-[var(--brand-green-dark)]" },
          { bar: "bg-sky-400", text: "text-sky-700" },
          { bar: "bg-violet-400", text: "text-violet-700" },
        ];
        const typeColors = [
          { bar: "bg-[var(--brand-green)]", text: "text-[var(--brand-green-dark)]" },
          { bar: "bg-sky-400", text: "text-sky-700" },
          { bar: "bg-amber-400", text: "text-amber-700" },
        ];

        return (
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Canal */}
            <article className="panel rounded-2xl bg-[var(--surface)] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow text-[var(--muted)]">Hoje por canal</p>
                  <h2 className="mt-1 text-base font-semibold tracking-tight">Origem dos pedidos</h2>
                </div>
                <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {channelTotal} total
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {metrics.channelBreakdown.length ? (
                  metrics.channelBreakdown.map((item, idx) => {
                    const pct = channelTotal > 0 ? Math.round((item._count._all / channelTotal) * 100) : 0;
                    const color = channelColors[idx % channelColors.length];
                    return (
                      <div key={item.channel}>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <p className="text-sm font-medium capitalize">{item.channel}</p>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-semibold ${color.text}`}>{pct}%</span>
                            <span className="text-sm font-semibold">{item._count._all} pedidos</span>
                            <span className="w-16 text-right text-xs text-[var(--muted)]">{formatMoney(item._sum.totalAmount)}</span>
                          </div>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--background-strong)]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-4 text-sm text-[var(--muted)]">
                    Nenhum pedido registrado hoje.
                  </p>
                )}
              </div>
            </article>

            {/* Tipo */}
            <article className="panel rounded-2xl bg-[var(--surface)] p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow text-[var(--muted)]">Hoje por tipo</p>
                  <h2 className="mt-1 text-base font-semibold tracking-tight">Entrega × retirada</h2>
                </div>
                <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {typeTotal} total
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {metrics.typeBreakdown.length ? (
                  metrics.typeBreakdown.map((item, idx) => {
                    const pct = typeTotal > 0 ? Math.round((item._count._all / typeTotal) * 100) : 0;
                    const color = typeColors[idx % typeColors.length];
                    return (
                      <div key={item.type}>
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <p className="text-sm font-medium capitalize">{formatLabel(item.type)}</p>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-semibold ${color.text}`}>{pct}%</span>
                            <span className="text-sm font-semibold">{item._count._all} pedidos</span>
                            <span className="w-16 text-right text-xs text-[var(--muted)]">{formatMoney(item._sum.totalAmount)}</span>
                          </div>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--background-strong)]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-4 text-sm text-[var(--muted)]">
                    Nenhum pedido registrado hoje.
                  </p>
                )}
              </div>
            </article>
          </div>
        );
      })()}
    </main>
  );
}
