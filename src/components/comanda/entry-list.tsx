import Image from "next/image";
import { formatMoney } from "@/lib/utils";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";
import type { ComandaDetail } from "@/lib/comanda-ui";

function describeEntrySummary(summary: ComandaDetail["entries"][number]["operationalSummary"]) {
  if (summary.isFullyDelivered) return "Todos entregues";
  if (summary.isFullyReady) return "Todos prontos";
  if (summary.isPartiallyDelivered) return "Entrega parcial";
  if (summary.isPartiallyReady) return "Parcial pronto";
  if (summary.preparingUnits > 0) return "Em preparo";
  return "Aguardando preparo";
}

type Props = {
  entries: ComandaDetail["entries"];
  emptyLabel?: string;
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(iso));
}

export function ComandaEntryList({
  entries,
  emptyLabel = "Nenhum item lançado ainda.",
}: Props) {
  if (!entries.length) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--background)] px-4 py-6 text-center text-sm text-[var(--muted)]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
      {entries.map((entry, idx) => {
        const extras = entry.selectedOptions;
        const modifiedIngredients = (entry.ingredientCustomizations || []).filter((ing) => ing.quantity !== 1);

        return (
          <article
            className={`flex gap-3 p-3 ${idx > 0 ? "border-t border-[var(--line)]" : ""}`}
            key={entry.id}
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--background)]">
              <Image
                alt={entry.menuItem.name}
                className="object-cover"
                fill
                sizes="56px"
                src={resolveMenuItemImage(entry.menuItem.imageUrl)}
              />
              <span className="absolute right-1 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-orange)] px-1 text-[0.65rem] font-bold text-white">
                {entry.quantity}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">{entry.menuItem.name}</p>
                  <p className="mt-0.5 text-[0.7rem] text-[var(--muted)]">
                    {formatTime(entry.createdAt)} · Unitário {formatMoney(entry.unitPrice)}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="inline-flex rounded-md bg-[var(--background)] px-1.5 py-0.5 text-[0.65rem] font-semibold text-[var(--muted)]">
                      {describeEntrySummary(entry.operationalSummary)}
                    </span>
                    <span className="inline-flex rounded-md bg-[var(--brand-green)]/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-[var(--brand-green-dark)]">
                      {entry.operationalSummary.readyOrDeliveredUnits}/{entry.operationalSummary.activeUnits} prontos
                    </span>
                    {entry.operationalSummary.deliveredUnits > 0 ? (
                      <span className="inline-flex rounded-md bg-emerald-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-emerald-700">
                        {entry.operationalSummary.deliveredUnits} entregue(s)
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="shrink-0 text-sm font-bold">{formatMoney(entry.subtotalAmount)}</p>
              </div>

              {(extras.length > 0 || modifiedIngredients.length > 0) ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {extras.map((opt) => (
                    <span
                      className="inline-flex items-center gap-1 rounded-md bg-[var(--brand-green)]/10 px-1.5 py-0.5 text-[0.65rem] font-medium text-[var(--brand-green-dark)]"
                      key={`${entry.id}-${opt.optionItem.id}`}
                    >
                      + {opt.quantity > 1 ? `${opt.quantity}× ` : ""}{opt.optionItem.name}
                      {Number(opt.unitPriceDelta) > 0 ? (
                        <span className="text-[var(--muted)]">({formatMoney(opt.unitPriceDelta)})</span>
                      ) : null}
                    </span>
                  ))}
                  {modifiedIngredients.map((ing) => (
                    <span
                      className={`inline-flex rounded-md px-1.5 py-0.5 text-[0.65rem] font-medium ${
                        ing.quantity === 0
                          ? "bg-red-50 text-red-600 line-through"
                          : "bg-sky-50 text-sky-700"
                      }`}
                      key={`${entry.id}-ing-${ing.ingredient.id}`}
                    >
                      {ing.quantity === 0 ? `sem ${ing.ingredient.name}` : `${ing.quantity}× ${ing.ingredient.name}`}
                    </span>
                  ))}
                </div>
              ) : null}

              {entry.notes ? (
                <p className="mt-1.5 rounded-md bg-amber-50 px-2 py-1 text-[0.7rem] leading-4 text-amber-800">
                  <span className="font-semibold">Obs:</span> {entry.notes}
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-1">
                {entry.units.map((unit) => (
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                      unit.status === "novo"
                        ? "bg-amber-100 text-amber-700"
                        : unit.status === "em_preparo"
                          ? "bg-[var(--brand-orange)]/15 text-[var(--brand-orange-dark)]"
                          : unit.status === "pronto"
                            ? "bg-[var(--brand-green)]/15 text-[var(--brand-green-dark)]"
                            : unit.status === "entregue"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                    }`}
                    key={unit.id}
                  >
                    #{unit.sequence} · {unit.status.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
