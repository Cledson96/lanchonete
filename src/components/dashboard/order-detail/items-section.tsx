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
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Itens do pedido</p>
        <span className="rounded-full bg-[var(--brand-green)]/12 px-2 py-0.5 text-[0.65rem] font-bold text-[var(--brand-green-dark)]">
          {totalItems} {totalItems === 1 ? "item" : "itens"}
        </span>
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
                    <p className="text-sm font-semibold leading-tight">{item.menuItem?.name || "Item"}</p>
                    <p className="mt-0.5 text-[0.7rem] text-[var(--muted)]">
                      Unitário {formatMoney(toNumber(item.unitPrice))}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-bold">{formatMoney(toNumber(item.subtotalAmount))}</p>
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
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Operação por unidade</p>
                    <p className="mt-1 text-[0.75rem] text-[var(--muted)]">
                      {itemSummary.length ? itemSummary.join(" • ") : "Nenhuma unidade operacional registrada."}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[0.7rem] font-semibold text-[var(--foreground)]">
                    {item.operationalSummary.readyOrDeliveredUnits}/{item.operationalSummary.activeUnits} pronto(s)
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {(item.units || []).map((unit) => {
                    const unitActions = getUnitActions(unit.status, order.type);

                    return (
                      <div key={unit.id} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-[var(--background)] px-2 py-0.5 text-[0.7rem] font-bold text-[var(--foreground)]">
                              Unidade {unit.sequence}
                            </span>
                            <span className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold ${unitStatusStyle[unit.status]}`}>
                              {humanizeUnitStatus(unit.status)}
                            </span>
                          </div>
                          <p className="text-[0.65rem] text-[var(--muted)]">
                            {unit.deliveredAt
                              ? `Entregue ${formatTime(unit.deliveredAt)}`
                              : unit.readyAt
                                ? `Pronto ${formatTime(unit.readyAt)}`
                                : unit.startedAt
                                  ? `Iniciado ${formatTime(unit.startedAt)}`
                                  : "Aguardando"}
                          </p>
                        </div>

                        {unitActions.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {unitActions.map((action) => (
                              <button
                                key={`${unit.id}-${action.toStatus}`}
                                className="rounded-full border border-[var(--line)] bg-[var(--background)] px-3 py-1.5 text-[0.75rem] font-semibold text-[var(--foreground)] transition hover:border-[var(--brand-orange)]/40 hover:bg-[var(--brand-orange)]/5 disabled:cursor-not-allowed disabled:opacity-55"
                                disabled={pendingUnitId === unit.id || pendingStatus !== null}
                                onClick={() => void onUnitTransition({
                                  orderId: order.id,
                                  itemId: item.id,
                                  unitId: unit.id,
                                  toStatus: action.toStatus,
                                })}
                                type="button"
                              >
                                {pendingUnitId === unit.id ? "Atualizando…" : action.label}
                              </button>
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
