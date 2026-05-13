import { formatMoney } from "@/lib/utils";
import {
  describeReadyState,
  formatPhone,
  humanizePaymentMethod,
  toNumber,
} from "./helpers";
import { InfoIcon, MapPinIcon, PhoneIcon } from "./icons";
import type { DashboardOrderDetail } from "./types";

export function CustomerSection({ order }: { order: DashboardOrderDetail }) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-white p-4">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Cliente</p>
      <p className="mt-1 text-base font-semibold">{order.customerName || "Sem nome"}</p>
      {order.customerPhone ? (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
          <PhoneIcon />
          {formatPhone(order.customerPhone)}
        </p>
      ) : null}
    </section>
  );
}

export function ComandaSection({ order }: { order: DashboardOrderDetail }) {
  if (!order.comanda) return null;

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-violet-700">Comanda vinculada</p>
          <p className="mt-1 text-base font-semibold text-violet-950">
            {order.comanda.name?.trim() || `Comanda ${order.comanda.code?.slice(0, 8) || "—"}`}
          </p>
        </div>
        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[0.7rem] font-semibold text-violet-700">
          {order.comanda.entries?.length || 0} lançamento(s)
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-violet-700/80">Código</p>
          <p className="mt-0.5 font-semibold text-violet-950">{order.comanda.code?.slice(0, 8) || "—"}</p>
        </div>
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-violet-700/80">Total da comanda</p>
          <p className="mt-0.5 font-semibold text-violet-950">{formatMoney(toNumber(order.comanda.totalAmount))}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[0.7rem] font-semibold text-violet-700">
          {describeReadyState(order.comanda.operationalSummary || order.operationalSummary)}
        </span>
        {order.comanda.operationalSummary?.isPartiallyDelivered ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-700">
            Entrega parcial
          </span>
        ) : null}
      </div>
      {order.comanda.notes ? (
        <p className="mt-3 text-sm leading-5 text-violet-900">
          <span className="font-semibold">Obs. da comanda:</span> {order.comanda.notes}
        </p>
      ) : null}
    </section>
  );
}

export function OperationalSummarySection({ order }: { order: DashboardOrderDetail }) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Andamento dos itens</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{describeReadyState(order.operationalSummary)}</p>
        </div>
        <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--foreground)]">
          {order.operationalSummary.readyOrDeliveredUnits}/{order.operationalSummary.activeUnits} pronto(s)
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryMetric label="Novos" tone="text-amber-700" value={order.operationalSummary.pendingUnits} />
        <SummaryMetric label="Em preparo" tone="text-[var(--brand-orange-dark)]" value={order.operationalSummary.preparingUnits} />
        <SummaryMetric label="Prontos" tone="text-[var(--brand-green-dark)]" value={order.operationalSummary.readyUnits} />
        <SummaryMetric label="Entregues" tone="text-emerald-700" value={order.operationalSummary.deliveredUnits} />
      </div>
    </section>
  );
}

function SummaryMetric({ label, tone, value }: { label: string; tone: string; value: number }) {
  return (
    <div className="rounded-lg bg-[var(--background)] px-3 py-2">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone}`}>{value}</p>
    </div>
  );
}

export function FinancialSummarySection({ order }: { order: DashboardOrderDetail }) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-white p-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Subtotal</p>
          <p className="mt-0.5 text-sm font-semibold">{formatMoney(toNumber(order.subtotalAmount))}</p>
        </div>
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Frete</p>
          <p className="mt-0.5 text-sm font-semibold">{formatMoney(toNumber(order.deliveryFeeAmount))}</p>
        </div>
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Pagamento</p>
          <p className="mt-0.5 truncate text-sm font-semibold">{humanizePaymentMethod(order.paymentMethod)}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3">
        <p className="text-sm font-semibold text-[var(--muted)]">Total</p>
        <p className="text-xl font-bold text-[var(--brand-orange-dark)]">{formatMoney(toNumber(order.totalAmount))}</p>
      </div>
    </section>
  );
}

export function DeliveryAddressSection({ order }: { order: DashboardOrderDetail }) {
  if (!order.deliveryAddress) return null;

  return (
    <section className="rounded-xl border border-[var(--line)] bg-white p-4">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]">
          <MapPinIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Endereço de entrega</p>
          <p className="mt-1 text-sm leading-5 text-[var(--foreground)]">
            {order.deliveryAddress.street}, {order.deliveryAddress.number}
            {order.deliveryAddress.complement ? ` • ${order.deliveryAddress.complement}` : ""}
          </p>
          <p className="text-xs leading-5 text-[var(--muted)]">
            {order.deliveryAddress.neighborhood} • {order.deliveryAddress.city}/{order.deliveryAddress.state}
            {order.deliveryAddress.zipCode ? ` • CEP ${order.deliveryAddress.zipCode}` : ""}
          </p>
          {order.deliveryAddress.reference ? (
            <p className="mt-1 text-xs italic text-[var(--muted)]">Referência: {order.deliveryAddress.reference}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function CustomerNotesSection({ order }: { order: DashboardOrderDetail }) {
  if (!order.notes) return null;

  return (
    <section className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <span className="mt-0.5 shrink-0 text-amber-600">
        <InfoIcon />
      </span>
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em]">Observação do cliente</p>
        <p className="mt-1 text-sm leading-5">{order.notes}</p>
      </div>
    </section>
  );
}
