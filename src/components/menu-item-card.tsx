"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { MenuItemDetailDialog } from "@/components/menu-item-detail-dialog";
import { formatMenuWeekdays } from "@/lib/menu-item-availability";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";
import { useCart } from "@/lib/cart-store";

type OptionGroupForCard = {
  id: string;
  name: string;
  description?: string | null;
  minSelections: number;
  maxSelections?: number | null;
  isRequired: boolean;
  options: Array<{
    id: string;
    name: string;
    description?: string | null;
    priceDelta: number;
  }>;
};

type IngredientForCard = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

type MenuItemCardProps = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  categoryName: string;
  categoryAvailability?: {
    availableFrom?: string | null;
    availableUntil?: string | null;
  };
  availableWeekdays?: string[];
  optionGroups?: OptionGroupForCard[];
  ingredients?: IngredientForCard[];
};

export function MenuItemCard({
  id,
  name,
  description,
  price,
  compareAtPrice,
  imageUrl,
  categoryName,
  categoryAvailability,
  availableWeekdays = [],
  optionGroups = [],
  ingredients = [],
}: MenuItemCardProps) {
  const { addItem, openCart } = useCart();
  const [added, setAdded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsVersion, setDetailsVersion] = useState(0);

  const openDetails = useCallback(() => {
    setDetailsVersion((current) => current + 1);
    setDetailsOpen(true);
  }, []);

  const handleAdd = useCallback(
    (notes?: string, quantity = 1, selectedOptions?: Record<string, string[]>, ingredientCustomizations?: Record<string, number>) => {
      const optionItemIds = selectedOptions
        ? Object.values(selectedOptions).flat()
        : [];

      let optionDelta = 0;
      const optionNames: string[] = [];
      if (selectedOptions) {
        for (const group of optionGroups) {
          const selected = selectedOptions[group.id] || [];
          for (const optionId of selected) {
            const option = group.options.find((o) => o.id === optionId);
            if (option) {
              optionDelta += option.priceDelta;
              optionNames.push(option.name);
            }
          }
        }
      }

      let ingredientDelta = 0;
      const ingredientNames: Record<string, string> = {};
      if (ingredientCustomizations && ingredients.length > 0) {
        for (const ing of ingredients) {
          ingredientNames[ing.id] = ing.name;
          const currentQty = Math.max(0, Math.min(ingredientCustomizations[ing.id] ?? ing.quantity, ing.quantity));
          const extraQty = currentQty - ing.quantity;

          if (extraQty > 0) {
            ingredientDelta += extraQty * ing.price;
          }
        }
      }

      addItem({
        menuItemId: id,
        name,
        price: price + ingredientDelta,
        imageUrl,
        categoryName,
        categoryAvailability,
        notes,
        quantity,
        optionItemIds,
        optionNames,
        optionDelta,
        ingredientCustomizations: ingredientCustomizations && ingredients.length > 0 ? ingredientCustomizations : undefined,
        ingredientNames: Object.keys(ingredientNames).length > 0 ? ingredientNames : undefined,
      });
      openCart();
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1300);
    },
    [addItem, openCart, id, name, price, imageUrl, categoryName, categoryAvailability, optionGroups, ingredients],
  );

  const displayPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);

  const displayCompare = compareAtPrice
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(compareAtPrice)
    : null;

  const displayDescription =
    description?.trim() || "Ingredientes sob consulta no atendimento.";

  const handleAddFromDetails = useCallback(
    (notes?: string, quantity = 1, selectedOptions?: Record<string, string[]>, ingredientCustomizations?: Record<string, number>) => {
      setDetailsOpen(false);
      handleAdd(notes, quantity, selectedOptions, ingredientCustomizations);
    },
    [handleAdd],
  );

  const hasIngredients = ingredients.length > 0;
  const hasOptions = optionGroups.length > 0;
  const weekdaysLabel = formatMenuWeekdays(availableWeekdays);

  return (
    <>
      <article className="menu-card group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lg)]"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <button
          aria-label={`Ver detalhes de ${name}`}
          className="relative h-52 cursor-pointer overflow-hidden bg-[var(--cream)] text-left"
          onClick={openDetails}
          type="button"
        >
          <Image
            alt={name}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            src={resolveMenuItemImage(imageUrl)}
          />

          <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />

          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[var(--green-rich)] shadow-[var(--shadow-sm)] backdrop-blur-sm">
            {categoryName}
          </span>

          {displayCompare ? (
            <span className="absolute right-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white shadow-[var(--shadow-sm)]">
              Oferta
            </span>
          ) : null}

          {weekdaysLabel !== "todos os dias" ? (
            <span className="absolute left-3 bottom-3 rounded-full bg-black/75 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white shadow-[var(--shadow-sm)] backdrop-blur-sm">
              {weekdaysLabel}
            </span>
          ) : null}

          {hasOptions || hasIngredients ? (
            <span className="absolute bottom-3 right-3 rounded-full bg-[var(--brand-orange)]/90 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white shadow-[var(--shadow-sm)] backdrop-blur-sm">
              +Adicionais
            </span>
          ) : null}
        </button>

        <div className="flex flex-1 flex-col p-4 pt-3.5">
          <button
            className="cursor-pointer text-left"
            onClick={openDetails}
            type="button"
          >
            <h3 className="text-[1.15rem] font-display font-bold leading-snug text-[var(--foreground)] transition-colors duration-200 hover:text-[var(--green-rich)]">
              {name}
            </h3>
          </button>

          <p className="mt-2 line-clamp-2 text-[0.85rem] leading-relaxed text-[var(--muted)]">
            {displayDescription}
          </p>

          <div className="flex-1" />

          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="menu-price text-[1.65rem] font-bold leading-none text-[var(--accent)]">
                {displayPrice}
              </p>
              {displayCompare ? (
                <p className="mt-0.5 text-xs text-[var(--muted)] line-through">{displayCompare}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-5">
            <button
              aria-label={`Ver detalhes e adicionar ${name} ao pedido`}
              className="w-full cursor-pointer rounded-[var(--radius-sm)] bg-[var(--green-rich)] px-4 py-3 text-[0.85rem] font-bold text-white shadow-sm transition-all duration-200 hover:bg-[var(--green-deep)] active:scale-[0.97]"
              onClick={openDetails}
              type="button"
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Adicionar ao pedido
              </span>
            </button>
          </div>
        </div>
      </article>

      <MenuItemDetailDialog
        added={added}
        categoryName={categoryName}
        compareAtPriceLabel={displayCompare}
        description={displayDescription}
        imageUrl={imageUrl}
        ingredients={ingredients}
        key={`${id}-${detailsVersion}`}
        name={name}
        onAdd={handleAddFromDetails}
        onClose={() => setDetailsOpen(false)}
        open={detailsOpen}
        optionGroups={optionGroups}
        price={price}
        priceLabel={displayPrice}
      />
    </>
  );
}
