import Image from "next/image";
import { formatMoney } from "@/lib/utils";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";
import type { ComandaDetail } from "@/lib/comanda-ui";

type Props = {
  entries: ComandaDetail["entries"];
  emptyLabel?: string;
};

export function ComandaEntryList({
  entries,
  emptyLabel = "Nenhum item lancado ainda.",
}: Props) {
  if (!entries.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] bg-[var(--background)] px-5 py-8 text-sm text-[var(--muted)]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <article
          className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4"
          key={entry.id}
        >
          <div className="flex gap-4">
            <div className="relative hidden h-[4.5rem] w-[4.5rem] overflow-hidden rounded-[1.1rem] bg-[var(--surface)] sm:block">
              <Image
                alt={entry.menuItem.name}
                className="object-cover"
                fill
                sizes="72px"
                src={resolveMenuItemImage(entry.menuItem.imageUrl)}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {entry.quantity}x item lancado
                  </p>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight text-[var(--foreground)]">
                    {entry.menuItem.name}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[var(--muted)]">Unitario {formatMoney(entry.unitPrice)}</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--brand-orange-dark)]">
                    {formatMoney(entry.subtotalAmount)}
                  </p>
                </div>
              </div>

              {entry.selectedOptions.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.selectedOptions.map((option) => (
                    <span
                      className="rounded-full border border-[var(--brand-green)]/20 bg-[var(--brand-green)]/8 px-3 py-1 text-xs font-medium text-[var(--brand-green-dark)]"
                      key={`${entry.id}-${option.optionItem.id}`}
                    >
                      {option.optionItem.name}
                      {Number(option.unitPriceDelta) > 0 ? ` +${formatMoney(option.unitPriceDelta)}` : ""}
                    </span>
                  ))}
                </div>
              ) : null}

              {entry.ingredientCustomizations && entry.ingredientCustomizations.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {entry.ingredientCustomizations
                    .filter((ing) => ing.quantity !== 1)
                    .map((ing) => (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${ing.quantity === 0 ? "border border-red-200 bg-red-50 text-red-600 line-through" : "border border-[var(--brand-orange)]/20 bg-[var(--brand-orange)]/8 text-[var(--brand-orange-dark)]"}`}
                        key={`${entry.id}-ing-${ing.ingredient.id}`}
                      >
                        {ing.quantity === 0 ? `Sem ${ing.ingredient.name}` : `${ing.quantity}x ${ing.ingredient.name}`}
                      </span>
                    ))}
                </div>
              ) : null}

              {entry.notes ? (
                <div className="mt-3 rounded-[1.1rem] border border-[var(--brand-orange)]/12 bg-[var(--surface)] px-3 py-3 text-sm text-[var(--muted)]">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--brand-orange-dark)]">
                    Observacao do item
                  </p>
                  <p className="mt-1 leading-6">{entry.notes}</p>
                </div>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
