"use client";

import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Typography } from "@/components/ui/typography";
import type { PublicMenuCategory } from "@/lib/contracts/menu";
import { formatMoney } from "@/lib/utils";
import { ComandaMenuItemDialog } from "@/components/comanda/menu-item-dialog";

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
    ingredientCustomizations: Record<string, number>;
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

  async function handleAdd(input: { quantity: number; notes?: string; optionItemIds: string[]; ingredientCustomizations: Record<string, number> }) {
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
        ingredientCustomizations: input.ingredientCustomizations,
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
            <Button
              className={`${active
                ? "border-[var(--brand-orange)]/25 bg-[var(--brand-orange)] text-white"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--brand-orange)]/20 hover:bg-[var(--surface)]"
              }`}
              key={category.id}
              onClick={() => setActiveCategoryId(category.id)}
              variant="unstyled"
            >
              {category.name}
            </Button>
          );
        })}
      </div>

      {disabled && disabledMessage ? (
        <Alert className="rounded-[1.4rem] px-4 py-3 text-sm font-normal" tone="warning">{disabledMessage}</Alert>
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
                  <Typography tone="muted" variant="caption-sm">
                    {activeCategory.name}
                  </Typography>
                  <Typography className="mt-2" variant="title-md">
                    {item.name}
                  </Typography>
                  <Typography className="mt-2 line-clamp-2 leading-6" tone="muted" variant="body-sm">
                    {item.description || "Sem ingredientes detalhados por enquanto."}
                  </Typography>
                </div>
                <div className="text-right">
                  <Typography tone="orange" variant="title-md">{formatMoney(item.price)}</Typography>
                  {item.optionGroups.length ? (
                    <Typography className="mt-1" tone="green" variant="caption">+ complementos</Typography>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
                <Typography tone="muted" variant="caption-sm">
                  {item.optionGroups.length ? `${item.optionGroups.length} grupos de adicionais` : "Item simples"}
                </Typography>
                <Button
                  disabled={disabled}
                  onClick={() => {
                    setDialogError(null);
                    setDialogVersion((current) => current + 1);
                    setSelectedItem(item);
                    setSelectedCategoryName(activeCategory.name);
                  }}
                  size="sm"
                  variant="success"
                >
                  Lancar item
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState className="rounded-[1.4rem] px-4 py-6 text-left">
          Nenhuma categoria ativa disponivel para esta comanda.
        </EmptyState>
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
