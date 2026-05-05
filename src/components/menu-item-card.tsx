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
      <article
        className="menu-card group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-orange)]/25 hover:shadow-[var(--shadow-md)]"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        {/* Imagem */}
        <button
          aria-label={`Ver detalhes de ${name}`}
          className="relative h-48 cursor-pointer overflow-hidden bg-[var(--cream)] text-left"
          onClick={openDetails}
          type="button"
        >
          <Image
            alt={name}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            src={resolveMenuItemImage(imageUrl)}
          />

          <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Badges — só os que adicionam valor real */}
          {displayCompare ? (
            <span className="absolute left-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-white shadow-sm">
              Oferta
            </span>
          ) : null}

          {weekdaysLabel !== "todos os dias" ? (
            <span className="absolute bottom-2.5 left-3 rounded-full bg-black/70 px-2.5 py-0.5 text-[0.6rem] font-semibold text-white backdrop-blur-sm">
              {weekdaysLabel}
            </span>
          ) : null}

          {(hasOptions || hasIngredients) && weekdaysLabel === "todos os dias" ? (
            <span className="absolute bottom-3 right-3 rounded-full bg-white/92 px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.06em] text-[var(--brand-orange-dark)] shadow-sm backdrop-blur-sm">
              + opções
            </span>
          ) : null}
        </button>

        {/* Conteúdo */}
        <div className="flex flex-1 flex-col p-4">
          <button className="cursor-pointer text-left" onClick={openDetails} type="button">
            <h3 className="line-clamp-2 text-[1rem] font-extrabold leading-snug text-[var(--foreground)] transition-colors duration-150 group-hover:text-[var(--brand-orange-dark)]">
              {name}
            </h3>
          </button>

          {description?.trim() ? (
            <p className="mt-1.5 line-clamp-2 text-[0.78rem] leading-relaxed text-[var(--muted)]">
              {description}
            </p>
          ) : null}

          <div className="flex-1" />

          {/* Preço + botão */}
          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              {displayCompare ? (
                <p className="text-[0.7rem] text-[var(--muted)] line-through leading-none mb-0.5">{displayCompare}</p>
              ) : null}
              <p className="menu-price text-[1.28rem] font-extrabold leading-none text-[var(--accent)]">
                {displayPrice}
              </p>
            </div>

            <button
              aria-label={`Adicionar ${name} ao pedido`}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--brand-orange)] px-4 py-2.5 text-[0.8rem] font-extrabold text-white shadow-[0_8px_18px_rgba(234,106,28,0.22)] transition-all duration-200 hover:bg-[var(--brand-orange-dark)] active:scale-[0.96]"
              onClick={openDetails}
              type="button"
            >
              <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.8} viewBox="0 0 24 24">
                <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Adicionar
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
