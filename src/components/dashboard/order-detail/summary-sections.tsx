import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
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
      <Typography tone="muted" variant="eyebrow">Cliente</Typography>
      <Typography className="mt-1" variant="title-md">{order.customerName || "Sem nome"}</Typography>
      {order.customerPhone ? (
        <Typography as="p" className="mt-1 flex items-center gap-1.5" tone="muted" variant="body-sm">
          <PhoneIcon />
          {formatPhone(order.customerPhone)}
        </Typography>
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
          <Typography className="text-violet-700" variant="eyebrow">Comanda vinculada</Typography>
          <Typography className="mt-1 text-violet-950" variant="title-md">
            {order.comanda.name?.trim() || `Comanda ${order.comanda.code?.slice(0, 8) || "—"}`}
          </Typography>
        </div>
        <Badge tone="violet">
          {order.comanda.entries?.length || 0} lançamento(s)
        </Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <Typography className="text-violet-700/80" variant="overline">Código</Typography>
          <Typography className="mt-0.5 text-violet-950" variant="title-sm">{order.comanda.code?.slice(0, 8) || "—"}</Typography>
        </div>
        <div>
          <Typography className="text-violet-700/80" variant="overline">Total da comanda</Typography>
          <Typography className="mt-0.5 text-violet-950" variant="title-sm">{formatMoney(toNumber(order.comanda.totalAmount))}</Typography>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone="violet">
          {describeReadyState(order.comanda.operationalSummary || order.operationalSummary)}
        </Badge>
        {order.comanda.operationalSummary?.isPartiallyDelivered ? (
          <Badge className="bg-emerald-100 text-emerald-700">
            Entrega parcial
          </Badge>
        ) : null}
      </div>
      {order.comanda.notes ? (
        <Typography className="mt-3 leading-5 text-violet-900" variant="body-sm">
          <span className="font-semibold">Obs. da comanda:</span> {order.comanda.notes}
        </Typography>
      ) : null}
    </section>
  );
}

export function OperationalSummarySection({ order }: { order: DashboardOrderDetail }) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Typography tone="muted" variant="eyebrow">Andamento dos itens</Typography>
          <Typography className="mt-1" tone="muted" variant="body-sm">{describeReadyState(order.operationalSummary)}</Typography>
        </div>
        <Badge>
          {order.operationalSummary.readyOrDeliveredUnits}/{order.operationalSummary.activeUnits} pronto(s)
        </Badge>
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
      <Typography tone="muted" variant="overline">{label}</Typography>
      <Typography className={`mt-1 ${tone}`} variant="metric">{value}</Typography>
    </div>
  );
}

export function FinancialSummarySection({ order }: { order: DashboardOrderDetail }) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-white p-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Typography tone="muted" variant="overline">Subtotal</Typography>
          <Typography className="mt-0.5" variant="title-sm">{formatMoney(toNumber(order.subtotalAmount))}</Typography>
        </div>
        <div>
          <Typography tone="muted" variant="overline">Frete</Typography>
          <Typography className="mt-0.5" variant="title-sm">{formatMoney(toNumber(order.deliveryFeeAmount))}</Typography>
        </div>
        <div>
          <Typography tone="muted" variant="overline">Pagamento</Typography>
          <Typography className="mt-0.5 truncate" variant="title-sm">{humanizePaymentMethod(order.paymentMethod)}</Typography>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3">
        <Typography tone="muted" variant="title-sm">Total</Typography>
        <Typography tone="orange" variant="title-lg">{formatMoney(toNumber(order.totalAmount))}</Typography>
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
          <Typography tone="muted" variant="eyebrow">Endereço de entrega</Typography>
          <Typography className="mt-1 leading-5" variant="body-sm">
            {order.deliveryAddress.street}, {order.deliveryAddress.number}
            {order.deliveryAddress.complement ? ` • ${order.deliveryAddress.complement}` : ""}
          </Typography>
          <Typography className="leading-5" tone="muted" variant="caption-sm">
            {order.deliveryAddress.neighborhood} • {order.deliveryAddress.city}/{order.deliveryAddress.state}
            {order.deliveryAddress.zipCode ? ` • CEP ${order.deliveryAddress.zipCode}` : ""}
          </Typography>
          {order.deliveryAddress.reference ? (
            <Typography className="mt-1 italic" tone="muted" variant="caption-sm">Referência: {order.deliveryAddress.reference}</Typography>
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
        <Typography variant="eyebrow">Observação do cliente</Typography>
        <Typography className="mt-1 leading-5" variant="body-sm">{order.notes}</Typography>
      </div>
    </section>
  );
}
