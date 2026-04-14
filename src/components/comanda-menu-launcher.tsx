"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/utils";
import type { PublicMenuCategory } from "@/lib/comanda-ui";
import { ComandaMenuItemDialog } from "@/components/comanda-menu-item-dialog";

type MenuItem = PublicMenuCategory["menuItems"][number];

type Props = {
  categories: PublicMenuCategory[];
  disabled?: boolean;
  disabledMessage?: string;
  onAddItem: (input: {
    menuItemId: string;
    quantity: number;
    notes?: string;
    optionItemIds: string[];
  }) => Promise<void>;
};

export function ComandaMenuLauncher({
  categories,
  disabled = false,
  disabledMessage,
  onAddItem,
}: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [launching, setLaunching] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogVersion, setDialogVersion] = useState(0);

  const activeCategory = useMemo(() => {
    return categories.find((category) => category.id === activeCategoryId) || categories[0] || null;
  }, [activeCategoryId, categories]);

  async function handleAdd(input: { quantity: number; notes?: string; optionItemIds: string[] }) {
    if (!selectedItem) {
      return;
    }

    try {
      setLaunching(true);
      setDialogError(null);
      await onAddItem({
        menuItemId: selectedItem.id,
        quantity: input.quantity,
        notes: input.notes,
        optionItemIds: input.optionItemIds,
      });
      setSelectedItem(null);
      setSelectedCategoryName("");
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : "Nao foi possivel lancar o item.");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const active = category.id === activeCategory?.id;
          return (
            <button
              className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${active
                ? "border-[var(--brand-orange)]/25 bg-[var(--brand-orange)] text-white"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--brand-orange)]/20 hover:bg-[var(--surface)]"
              }`}
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              type="button"
            >
              {category.name}
            </button>
          );
        })}
      </div>

      {disabled && disabledMessage ? (
        <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {disabledMessage}
        </div>
      ) : null}

      {activeCategory ? (
        <div className="grid gap-3 md:grid-cols-2">
          {activeCategory.menuItems.map((item) => (
            <article
              className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 transition hover:border-[var(--brand-orange)]/22 hover:shadow-sm"
              key={item.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {activeCategory.name}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-[var(--foreground)]">
                    {item.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                    {item.description || "Sem ingredientes detalhados por enquanto."}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-[var(--brand-orange-dark)]">{formatMoney(item.price)}</p>
                  {item.optionGroups.length ? (
                    <p className="mt-1 text-xs text-[var(--brand-green-dark)]">+ complementos</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  {item.optionGroups.length ? `${item.optionGroups.length} grupos de adicionais` : "Item simples"}
                </p>
                <button
                  className="rounded-full bg-[var(--brand-green)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-green-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={disabled}
                  onClick={() => {
                    setDialogError(null);
                    setDialogVersion((current) => current + 1);
                    setSelectedItem(item);
                    setSelectedCategoryName(activeCategory.name);
                  }}
                  type="button"
                >
                  Lancar item
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.4rem] border border-dashed border-[var(--line)] px-4 py-6 text-sm text-[var(--muted)]">
          Nenhuma categoria ativa disponivel para esta comanda.
        </div>
      )}

      <ComandaMenuItemDialog
        categoryName={selectedCategoryName}
        error={dialogError}
        item={selectedItem}
        key={`${selectedItem?.id ?? "empty"}-${dialogVersion}`}
        loading={launching}
        onClose={() => {
          if (!launching) {
            setSelectedItem(null);
            setSelectedCategoryName("");
            setDialogError(null);
          }
        }}
        onSubmit={handleAdd}
        open={Boolean(selectedItem)}
      />
    </section>
  );
}
