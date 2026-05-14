import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { formatMoney } from "@/lib/utils";
import {
  describeOperationalSummary,
  formatTime,
  getUnitActions,
  humanizeUnitStatus,
  toNumber,
} from "./helpers";
import { unitStatusStyle } from "./styles";
import type { DashboardOrderDetail, DashboardOrderDetailSheetProps, KitchenItemDetailTarget } from "./types";

export function KitchenItemDetailSection({
  order,
  target,
  pendingStatus,
  pendingUnitId,
  onUnitTransition,
}: {
  order: DashboardOrderDetail;
  target: KitchenItemDetailTarget;
  pendingStatus: DashboardOrderDetailSheetProps["pendingStatus"];
  pendingUnitId: string | null;
  onUnitTransition: DashboardOrderDetailSheetProps["onUnitTransition"];
}) {
  const item = order.items.find((current) => current.id === target.itemId);
  const unit = item?.units.find((current) => current.id === target.unitId);

  if (!item || !unit) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <Typography variant="title-sm">Item não encontrado</Typography>
        <Typography className="mt-1 leading-5" variant="body-sm">
          O item selecionado não está mais disponível neste pedido. Abra os dados do pedido abaixo para conferir o estado atual.
        </Typography>
      </section>
    );
  }

  const extras = (item.selectedOptions || []).filter((option) => option.optionItem.name);
  const modifiedIngredients = (item.ingredientCustomizations || []).filter((ingredient) => ingredient.quantity !== 1);
  const itemSummary = describeOperationalSummary(item.operationalSummary);
  const unitActions = getUnitActions(unit.status, order.type, "kitchen");

  return (
    <section className="rounded-2xl border border-[var(--brand-orange)]/25 bg-white p-4 shadow-[0_8px_24px_rgba(45,24,11,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography tone="muted" variant="eyebrow">Item selecionado</Typography>
          <Typography className="mt-1 leading-6" variant="title-md">{item.menuItem?.name || "Item"}</Typography>
          <Typography className="mt-1" tone="muted" variant="caption">
            Unidade {unit.sequence} de {item.quantity} • Unitário {formatMoney(toNumber(item.unitPrice))}
          </Typography>
        </div>
        <Badge className={`shrink-0 border px-2 py-0.5 text-[0.7rem] ${unitStatusStyle[unit.status]}`}>
          {humanizeUnitStatus(unit.status)}
        </Badge>
      </div>

      <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--background)]/70 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Typography tone="muted" variant="overline">Andamento deste item</Typography>
            <Typography className="mt-1" tone="muted" variant="caption">
              {itemSummary.length ? itemSummary.join(" • ") : "Nenhuma unidade operacional registrada."}
            </Typography>
          </div>
          <Typography tone="muted" variant="eyebrow">
            {unit.deliveredAt
              ? `Entregue ${formatTime(unit.deliveredAt)}`
              : unit.readyAt
                ? `Pronto ${formatTime(unit.readyAt)}`
                : unit.startedAt
                  ? `Iniciado ${formatTime(unit.startedAt)}`
                  : "Aguardando"}
          </Typography>
        </div>

        {unitActions.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {unitActions.map((action) => (
              <Button
                key={`${unit.id}-${action.toStatus}`}
                className="hover:border-[var(--brand-orange)]/40 hover:bg-[var(--brand-orange)]/5"
                disabled={pendingUnitId === unit.id || pendingStatus !== null}
                onClick={() => void onUnitTransition({
                  orderId: order.id,
                  itemId: item.id,
                  unitId: unit.id,
                  source: "kitchen",
                  toStatus: action.toStatus,
                })}
                size="sm"
                variant="secondary"
              >
                {pendingUnitId === unit.id ? "Atualizando..." : action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {extras.length ? (
        <div className="mt-3">
          <Typography tone="muted" variant="overline">Adicionais</Typography>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {extras.map((option, optionIndex) => (
              <span
                key={`${item.id}-focus-opt-${optionIndex}`}
                className="inline-flex items-center gap-1 rounded-md bg-[var(--brand-green)]/10 px-2 py-0.5 text-[0.7rem] font-medium text-[var(--brand-green-dark)]"
              >
                + {option.quantity > 1 ? `${option.quantity}x ` : ""}{option.optionItem.name}
                {toNumber(option.unitPriceDelta) > 0 ? (
                  <span className="text-[var(--muted)]">({formatMoney(toNumber(option.unitPriceDelta))})</span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {modifiedIngredients.length ? (
        <div className="mt-3">
          <Typography tone="muted" variant="overline">Ingredientes</Typography>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {modifiedIngredients.map((ingredient, ingredientIndex) => (
              <span
                key={`${item.id}-focus-ing-${ingredientIndex}`}
                className={`inline-flex rounded-md px-2 py-0.5 text-[0.7rem] font-medium ${
                  ingredient.quantity === 0 ? "bg-red-50 text-red-600 line-through" : "bg-sky-50 text-sky-700"
                }`}
              >
                {ingredient.quantity === 0
                  ? `sem ${ingredient.ingredient.name}`
                  : `${ingredient.quantity}x ${ingredient.ingredient.name}`}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {item.notes || order.notes ? (
        <div className="mt-3 space-y-2">
          {item.notes ? (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <span className="font-semibold">Obs. do item:</span> {item.notes}
            </div>
          ) : null}
          {order.notes ? (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <span className="font-semibold">Obs. do pedido:</span> {order.notes}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
