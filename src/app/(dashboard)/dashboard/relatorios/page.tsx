import { formatMoney } from "@/lib/utils";
import { getOperationsReport } from "@/lib/services/dashboard-report-service";

type ReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type RankingRow = {
  label: string;
  value: string;
  detail?: string;
  amount?: string;
  percent?: number;
};

const periodOptions = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semana atual" },
  { value: "month", label: "Mes atual" },
  { value: "custom", label: "Personalizado" },
];

const paymentOptions = [
  { value: "all", label: "Todos" },
  { value: "pix", label: "Pix" },
  { value: "cartao_credito", label: "Cartao de credito" },
  { value: "cartao_debito", label: "Cartao de debito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "outro", label: "Outro" },
];

const amountModeOptions = [
  { value: "total", label: "Com frete" },
  { value: "subtotal", label: "Sem frete" },
];

function readParam(
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function humanize(value?: string | null) {
  if (!value) return "Nao informado";

  const labels: Record<string, string> = {
    pix: "Pix",
    cartao_credito: "Cartao de credito",
    cartao_debito: "Cartao de debito",
    dinheiro: "Dinheiro",
    outro: "Outro",
    delivery: "Entrega",
    retirada: "Retirada",
    local: "Local",
    entregue: "Entregue",
    fechado: "Fechado",
    cancelado: "Cancelado",
    novo: "Novo",
    em_preparo: "Em preparo",
    pronto: "Pronto",
    saiu_para_entrega: "Saiu para entrega",
  };

  return labels[value] || value.replaceAll("_", " ");
}

function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "orange" | "green" | "red";
}) {
  const toneClass = {
    default: "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)]",
    orange:
      "border-[var(--brand-orange)]/25 bg-[var(--brand-orange)]/7 text-[var(--brand-orange-dark)]",
    green:
      "border-[var(--brand-green)]/25 bg-[var(--brand-green)]/7 text-[var(--brand-green-dark)]",
    red: "border-red-200 bg-red-50 text-red-700",
  }[tone];

  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-medium text-[var(--muted)]">{hint}</p>
    </article>
  );
}

function BarRow({ row, max }: { row: RankingRow; max: number }) {
  const width = max > 0 ? Math.max(4, ((row.percent ?? 0) / max) * 100) : 0;

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">
            {row.label}
          </p>
          {row.detail ? (
            <p className="mt-0.5 text-xs text-[var(--muted)]">{row.detail}</p>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-[var(--foreground)]">{row.value}</p>
          {row.amount ? (
            <p className="mt-0.5 text-xs font-medium text-[var(--muted)]">
              {row.amount}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--background-strong)]">
        <div
          className="h-full rounded-full bg-[var(--brand-orange)] transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-5 text-sm text-[var(--muted)]">
      {label}
    </p>
  );
}

export default async function DashboardReportsPage({
  searchParams,
}: ReportsPageProps) {
  const params = await searchParams;
  const report = await getOperationsReport({
    period: readParam(params, "period"),
    from: readParam(params, "from"),
    to: readParam(params, "to"),
    paymentMethod: readParam(params, "paymentMethod"),
    amountMode: readParam(params, "amountMode"),
  });

  const paymentMax = Math.max(
    ...report.paymentBreakdown.map((item) => item.selectedAmount),
    0,
  );
  const menuMax = Math.max(...report.topMenuItems.map((item) => item.quantity), 0);
  const ingredientMax = Math.max(
    ...report.topIngredients.map((item) => item.quantity),
    0,
  );
  const removedMax = Math.max(
    ...report.removedIngredients.map((item) => item.removals),
    0,
  );

  return (
    <main className="space-y-6 text-[var(--foreground)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="eyebrow text-[var(--muted)]">Leitura financeira</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Relatorios da operacao
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Pedidos finalizados no periodo, com ganhos por pagamento, produtos
            vendidos e uso de ingredientes.
          </p>
        </div>
        <p className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--muted)]">
          {report.filters.label}
        </p>
      </div>

      <form
        className="panel grid gap-3 rounded-2xl bg-[var(--surface)] p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr_1.2fr_1.2fr_auto]"
        method="get"
      >
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Periodo
          </span>
          <select
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-medium"
            defaultValue={report.filters.period}
            name="period"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            De
          </span>
          <input
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-medium"
            defaultValue={report.filters.fromInput}
            name="from"
            type="date"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Ate
          </span>
          <input
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-medium"
            defaultValue={report.filters.toInput}
            name="to"
            type="date"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Pagamento
          </span>
          <select
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-medium"
            defaultValue={report.filters.paymentMethod}
            name="paymentMethod"
          >
            {paymentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Ganhos
          </span>
          <select
            className="h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-medium"
            defaultValue={report.filters.amountMode}
            name="amountMode"
          >
            {amountModeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          className="h-11 self-end rounded-xl bg-[var(--brand-orange)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
          type="submit"
        >
          Aplicar
        </button>
      </form>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard
          hint={
            report.filters.amountMode === "subtotal"
              ? "Sem valor de frete"
              : "Inclui frete cobrado"
          }
          label="Ganhos no filtro"
          tone="orange"
          value={formatMoney(report.summary.selectedRevenue)}
        />
        <KpiCard
          hint="Pedidos entregues ou fechados"
          label="Finalizados"
          value={formatCount(report.summary.completedOrders)}
        />
        <KpiCard
          hint="Com frete"
          label="Faturamento total"
          value={formatMoney(report.summary.totalRevenue)}
        />
        <KpiCard
          hint="Sem frete"
          label="Produtos"
          tone="green"
          value={formatMoney(report.summary.subtotalRevenue)}
        />
        <KpiCard
          hint="Media por pedido"
          label="Ticket medio"
          value={formatMoney(report.summary.averageTicket)}
        />
        <KpiCard
          hint="Nao entram nos ganhos"
          label="Cancelados"
          tone={report.summary.cancelledOrders ? "red" : "default"}
          value={formatCount(report.summary.cancelledOrders)}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="panel rounded-2xl bg-[var(--surface)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-[var(--muted)]">Financeiro</p>
              <h2 className="mt-1 text-base font-semibold tracking-tight">
                Ganhos por forma de pagamento
              </h2>
            </div>
            <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {formatMoney(report.summary.deliveryFeeRevenue)} frete
            </span>
          </div>

          <div className="space-y-3">
            {report.paymentBreakdown.length ? (
              report.paymentBreakdown.map((item) => (
                <BarRow
                  key={item.label}
                  max={paymentMax}
                  row={{
                    label: item.label,
                    value: formatMoney(item.selectedAmount),
                    detail: `${formatCount(item.orderCount)} pedidos • ticket ${formatMoney(item.averageTicket)}`,
                    amount: `${formatMoney(item.subtotalAmount)} sem frete`,
                    percent: item.selectedAmount,
                  }}
                />
              ))
            ) : (
              <EmptyState label="Nenhum ganho finalizado nesse periodo." />
            )}
          </div>
        </article>

        <article className="panel rounded-2xl bg-[var(--surface)] p-5 shadow-sm">
          <div className="mb-4">
            <p className="eyebrow text-[var(--muted)]">Cardapio</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight">
              Lanches mais vendidos
            </h2>
          </div>

          <div className="space-y-3">
            {report.topMenuItems.length ? (
              report.topMenuItems.map((item) => (
                <BarRow
                  key={item.menuItemId}
                  max={menuMax}
                  row={{
                    label: item.name,
                    value: `${formatCount(item.quantity)} un.`,
                    detail: `${formatPercent(item.participation)} dos itens vendidos`,
                    amount: formatMoney(item.revenue),
                    percent: item.quantity,
                  }}
                />
              ))
            ) : (
              <EmptyState label="Nenhum lanche vendido nesse periodo." />
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="panel rounded-2xl bg-[var(--surface)] p-5 shadow-sm">
          <div className="mb-4">
            <p className="eyebrow text-[var(--muted)]">Ingredientes</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight">
              Mais usados
            </h2>
          </div>

          <div className="space-y-3">
            {report.topIngredients.length ? (
              report.topIngredients.map((item) => (
                <BarRow
                  key={item.ingredientId}
                  max={ingredientMax}
                  row={{
                    label: item.name,
                    value: `${formatCount(item.quantity)} uso(s)`,
                    percent: item.quantity,
                  }}
                />
              ))
            ) : (
              <EmptyState label="Nenhum ingrediente registrado nos itens vendidos." />
            )}
          </div>
        </article>

        <article className="panel rounded-2xl bg-[var(--surface)] p-5 shadow-sm">
          <div className="mb-4">
            <p className="eyebrow text-[var(--muted)]">Ajustes</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight">
              Ingredientes mais removidos
            </h2>
          </div>

          <div className="space-y-3">
            {report.removedIngredients.length ? (
              report.removedIngredients.map((item) => (
                <BarRow
                  key={item.ingredientId}
                  max={removedMax}
                  row={{
                    label: item.name,
                    value: `${formatCount(item.removals)} remocao(oes)`,
                    percent: item.removals,
                  }}
                />
              ))
            ) : (
              <EmptyState label="Nenhuma remocao de ingrediente nesse periodo." />
            )}
          </div>
        </article>
      </section>

      <section className="panel rounded-2xl bg-[var(--surface)] p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow text-[var(--muted)]">Pedidos</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight">
              Ultimos finalizados do periodo
            </h2>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {formatCount(report.summary.itemUnitsSold)} itens vendidos
          </span>
        </div>

        {report.recentOrders.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                  <th className="border-b border-[var(--line)] px-3 py-3 font-semibold">
                    Pedido
                  </th>
                  <th className="border-b border-[var(--line)] px-3 py-3 font-semibold">
                    Cliente
                  </th>
                  <th className="border-b border-[var(--line)] px-3 py-3 font-semibold">
                    Status
                  </th>
                  <th className="border-b border-[var(--line)] px-3 py-3 font-semibold">
                    Pagamento
                  </th>
                  <th className="border-b border-[var(--line)] px-3 py-3 text-right font-semibold">
                    Subtotal
                  </th>
                  <th className="border-b border-[var(--line)] px-3 py-3 text-right font-semibold">
                    Frete
                  </th>
                  <th className="border-b border-[var(--line)] px-3 py-3 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.recentOrders.map((order) => (
                  <tr key={order.id} className="align-top">
                    <td className="border-b border-[var(--line)] px-3 py-3">
                      <p className="font-semibold">{order.code.slice(0, 10)}</p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {formatDateTime(order.createdAt)} • {humanize(order.type)}
                      </p>
                    </td>
                    <td className="border-b border-[var(--line)] px-3 py-3">
                      {order.customerName || order.customerPhone || "Cliente"}
                    </td>
                    <td className="border-b border-[var(--line)] px-3 py-3">
                      {humanize(order.status)}
                    </td>
                    <td className="border-b border-[var(--line)] px-3 py-3">
                      {humanize(order.paymentMethod)}
                    </td>
                    <td className="border-b border-[var(--line)] px-3 py-3 text-right font-medium">
                      {formatMoney(order.subtotalAmount)}
                    </td>
                    <td className="border-b border-[var(--line)] px-3 py-3 text-right font-medium">
                      {formatMoney(order.deliveryFeeAmount)}
                    </td>
                    <td className="border-b border-[var(--line)] px-3 py-3 text-right font-bold">
                      {formatMoney(order.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState label="Nenhum pedido finalizado nesse periodo." />
        )}
      </section>
    </main>
  );
}
