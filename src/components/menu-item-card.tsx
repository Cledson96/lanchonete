"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
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

  return (
    <article className="menu-card group flex h-full flex-col overflow-hidden rounded-[1.65rem] border border-[#f0ddca] bg-white orange-glow transition duration-300 hover:-translate-y-1.5">
      <div className="relative h-48 overflow-hidden bg-[#fff0df]">
        <Image
          alt={name}
          className="object-cover transition duration-500 group-hover:scale-[1.06]"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          src={resolveMenuItemImage(imageUrl)}
        />
        <div className="absolute inset-x-0 bottom-0 h-18 bg-gradient-to-t from-black/18 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-[#fff5eb] px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-[#e96118]">
          {categoryName}
        </span>
        {displayCompare ? (
          <span className="absolute right-4 top-4 rounded-full bg-[#1f6e46] px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-white">
            Oferta
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="min-h-[7.5rem]">
          <h3 className="text-[1.35rem] font-display font-semibold leading-tight text-[#28170d]">
            {name}
          </h3>
          <p className="mt-3 line-clamp-3 text-[0.98rem] leading-7 text-[#6f5a4a]">
            {description || "Item tradicional da casa, preparado na hora para sair bonito e saboroso."}
          </p>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="menu-price text-[2rem] font-bold leading-none text-[#ef6216]">
              {displayPrice}
            </p>
            {displayCompare ? (
              <p className="mt-1 text-sm text-[#b69b87] line-through">{displayCompare}</p>
            ) : null}
          </div>
          <span className="rounded-full bg-[#fff2e7] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#9e6d4b]">
            Pedido rapido
          </span>
        </div>

        <button
          aria-label={`Adicionar ${name} ao carrinho`}
          className={`mt-5 w-full cursor-pointer rounded-[1rem] px-5 py-3.5 text-sm font-bold text-white transition duration-200 active:scale-[0.98] ${
            added ? "bg-[#1f6e46]" : "bg-[#f26b21] hover:bg-[#cf500d]"
          }`}
          onClick={handleAdd}
          type="button"
        >
          {added ? "Adicionado ao carrinho" : `Adicionar - ${displayPrice}`}
        </button>
      </div>
    </article>
  );
}
