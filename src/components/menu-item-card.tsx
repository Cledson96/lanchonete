"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { MenuItemDetailDialog } from "@/components/menu-item-detail-dialog";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";
import { useCart } from "@/lib/cart-store";

type MenuItemCardProps = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  categoryName: string;
};

export function MenuItemCard({
  id,
  name,
  description,
  price,
  compareAtPrice,
  imageUrl,
  categoryName,
}: MenuItemCardProps) {
  const { addItem, openCart } = useCart();
  const [added, setAdded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleAdd = useCallback(() => {
    addItem({ id, name, price, imageUrl, categoryName });
    openCart();
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  }, [addItem, openCart, id, name, price, imageUrl, categoryName]);

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

  const handleAddFromDetails = useCallback(() => {
    setDetailsOpen(false);
    handleAdd();
  }, [handleAdd]);

  return (
    <>
      <article className="menu-card group flex h-full flex-col overflow-hidden rounded-[1.65rem] border border-[#ead9c4] bg-white shadow-[0_16px_34px_rgba(77,66,46,0.08)] transition duration-300 hover:-translate-y-1">
        <button
          aria-label={`Ver detalhes de ${name}`}
          className="relative h-48 cursor-pointer overflow-hidden bg-[#fff0df] text-left"
          onClick={() => setDetailsOpen(true)}
          type="button"
        >
          <Image
            alt={name}
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            src={resolveMenuItemImage(imageUrl)}
          />
          <span className="absolute left-4 top-4 rounded-full bg-[#eef5e8] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#567b35]">
            {categoryName}
          </span>
          {displayCompare ? (
            <span className="absolute right-4 top-4 rounded-full bg-[#dc7325] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white">
              Oferta
            </span>
          ) : null}
        </button>

        <div className="flex flex-1 flex-col p-5">
          <div className="min-h-[9.25rem]">
            <button
              className="cursor-pointer text-left"
              onClick={() => setDetailsOpen(true)}
              type="button"
            >
              <h3 className="text-[1.35rem] font-display font-semibold leading-tight text-[#2b2013] transition hover:text-[#567b35]">
                {name}
              </h3>
            </button>

            <div className="mt-3 rounded-[1.2rem] bg-[#fbf5ec] px-3.5 py-3">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#a06f42]">
                Ingredientes
              </p>
              <p className="mt-2 line-clamp-3 text-[0.95rem] leading-6 text-[#6f5f4b]">
                {displayDescription}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <p className="menu-price text-[2rem] font-bold leading-none text-[#db7324]">
                {displayPrice}
              </p>
              {displayCompare ? (
                <p className="mt-1 text-sm text-[#b69b87] line-through">{displayCompare}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex gap-2.5">
            <button
              className="flex-1 cursor-pointer rounded-[1rem] border border-[#d9ceb8] bg-white px-4 py-3.5 text-sm font-bold text-[#5f5443] transition hover:bg-[#f7efdf]"
              onClick={() => setDetailsOpen(true)}
              type="button"
            >
              Ver item
            </button>
            <button
              aria-label={`Adicionar ${name} ao carrinho`}
              className={`flex-[1.2] cursor-pointer rounded-[1rem] px-4 py-3.5 text-sm font-bold text-white transition duration-200 active:scale-[0.98] ${
                added ? "bg-[#6da141]" : "bg-[#567b35] hover:bg-[#47652b]"
              }`}
              onClick={handleAdd}
              type="button"
            >
              {added ? "Adicionado" : `Adicionar - ${displayPrice}`}
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
        name={name}
        onAdd={handleAddFromDetails}
        onClose={() => setDetailsOpen(false)}
        open={detailsOpen}
        priceLabel={displayPrice}
      />
    </>
  );
}
