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
import type { DashboardOrderDetail, DashboardOrderDetailSheetProps } from "./types";

export function OrderItemsSection({
  order,
  totalItems,
  pendingStatus,
  pendingUnitId,
  onUnitTransition,
}: {
  order: DashboardOrderDetail;
  totalItems: number;
  pendingStatus: DashboardOrderDetailSheetProps["pendingStatus"];
  pendingUnitId: string | null;
  onUnitTransition: DashboardOrderDetailSheetProps["onUnitTransition"];
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <Typography tone="muted" variant="eyebrow">Itens do pedido</Typography>
        <Badge className="px-2 py-0.5 text-[0.65rem] font-bold" tone="success">
          {totalItems} {totalItems === 1 ? "item" : "itens"}
        </Badge>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
        {order.items.map((item, index) => {
          const extras = (item.selectedOptions || []).filter((option) => option.optionItem.name);
          const modifiedIngredients = (item.ingredientCustomizations || []).filter((ingredient) => ingredient.quantity !== 1);
          const itemSummary = describeOperationalSummary(item.operationalSummary);

          return (
            <article key={item.id} className={`p-4 ${index > 0 ? "border-t border-[var(--line)]" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--brand-orange)]/10 text-xs font-bold text-[var(--brand-orange-dark)]">
                    {item.quantity}×
                  </span>
                  <div className="min-w-0">
                    <Typography variant="title-sm">{item.menuItem?.name || "Item"}</Typography>
                    <Typography className="mt-0.5" tone="muted" variant="caption">
                      Unitário {formatMoney(toNumber(item.unitPrice))}
                    </Typography>
                  </div>
                </div>
                <Typography as="p" className="shrink-0" variant="title-sm">{formatMoney(toNumber(item.subtotalAmount))}</Typography>
              </div>

              {extras.length ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {extras.map((option, optionIndex) => (
                    <span
                      key={`${item.id}-opt-${optionIndex}`}
                      className="inline-flex items-center gap-1 rounded-md bg-[var(--brand-green)]/10 px-2 py-0.5 text-[0.7rem] font-medium text-[var(--brand-green-dark)]"
                    >
                      + {option.quantity > 1 ? `${option.quantity}× ` : ""}{option.optionItem.name}
                      {toNumber(option.unitPriceDelta) > 0 ? (
                        <span className="text-[var(--muted)]">({formatMoney(toNumber(option.unitPriceDelta))})</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              ) : null}

              {modifiedIngredients.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {modifiedIngredients.map((ingredient, ingredientIndex) => (
                    <span
                      key={`${item.id}-ing-${ingredientIndex}`}
                      className={`inline-flex rounded-md px-2 py-0.5 text-[0.7rem] font-medium ${
                        ingredient.quantity === 0 ? "bg-red-50 text-red-600 line-through" : "bg-sky-50 text-sky-700"
                      }`}
                    >
                      {ingredient.quantity === 0
                        ? `sem ${ingredient.ingredient.name}`
                        : `${ingredient.quantity}× ${ingredient.ingredient.name}`}
                    </span>
                  ))}
                </div>
              ) : null}

              {item.notes ? (
                <div className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-[0.7rem] text-amber-800">
                  <span className="shrink-0 font-bold">Obs:</span>
                  <span className="leading-4">{item.notes}</span>
                </div>
              ) : null}

              <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--background)]/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                     <Typography tone="muted" variant="overline">Operação por unidade</Typography>
                     <Typography className="mt-1" tone="muted" variant="caption">
                       {itemSummary.length ? itemSummary.join(" • ") : "Nenhuma unidade operacional registrada."}
                     </Typography>
                   </div>
                   <Badge className="bg-white px-2 py-0.5 text-[0.7rem]">
                     {item.operationalSummary.readyOrDeliveredUnits}/{item.operationalSummary.activeUnits} pronto(s)
                   </Badge>
                 </div>

                <div className="mt-3 space-y-2">
                  {(item.units || []).map((unit) => {
                    const unitActions = getUnitActions(unit.status, order.type);

                    return (
                      <div key={unit.id} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                             <Badge className="rounded-md bg-[var(--background)] px-2 py-0.5 text-[0.7rem]" shape="square">
                               Unidade {unit.sequence}
                             </Badge>
                             <Badge className={`border px-2 py-0.5 text-[0.65rem] ${unitStatusStyle[unit.status]}`}>
                               {humanizeUnitStatus(unit.status)}
                             </Badge>
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
                           <div className="mt-2 flex flex-wrap gap-2">
                             {unitActions.map((action) => (
                               <Button
                                 key={`${unit.id}-${action.toStatus}`}
                                 className="hover:border-[var(--brand-orange)]/40 hover:bg-[var(--brand-orange)]/5"
                                 disabled={pendingUnitId === unit.id || pendingStatus !== null}
                                 onClick={() => void onUnitTransition({
                                   orderId: order.id,
                                  itemId: item.id,
                                   unitId: unit.id,
                                   toStatus: action.toStatus,
                                 })}
                                 size="xs"
                                 variant="secondary"
                               >
                                 {pendingUnitId === unit.id ? "Atualizando…" : action.label}
                               </Button>
                             ))}
                           </div>
                         ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
