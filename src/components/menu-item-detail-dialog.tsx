"use client";

import Image from "next/image";
import { useEffect } from "react";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";

type MenuItemDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
  added: boolean;
  name: string;
  categoryName: string;
  description?: string | null;
  imageUrl?: string | null;
  priceLabel: string;
  compareAtPriceLabel?: string | null;
};

export function MenuItemDetailDialog({
  open,
  onClose,
  onAdd,
  added,
  name,
  categoryName,
  description,
  imageUrl,
  priceLabel,
  compareAtPriceLabel,
}: MenuItemDetailDialogProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label="Fechar detalhes do item"
        className="absolute inset-0 cursor-pointer bg-[#1c130b]/62 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div className="absolute inset-x-3 top-1/2 mx-auto w-[min(100%,38rem)] -translate-y-1/2 overflow-hidden rounded-[2rem] border border-[#e8d9c4] bg-[#fffaf4] shadow-[0_30px_80px_rgba(23,15,8,0.28)] sm:inset-x-0">
        <div className="relative h-64 bg-[#173223] sm:h-80">
          <Image
            alt={name}
            className="object-cover"
            fill
            sizes="(max-width: 768px) 100vw, 608px"
            src={resolveMenuItemImage(imageUrl)}
          />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/45 to-transparent" />
          <button
            aria-label="Fechar detalhes"
            className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/92 text-[#35261a] transition hover:bg-white"
            onClick={onClose}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-[#eef5e8] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#567b35]">
                {categoryName}
              </span>
              <h2 className="mt-3 text-[2rem] font-black leading-tight text-[#2a1d14]">
                {name}
              </h2>
            </div>

            <div className="text-right">
              <p className="menu-price text-[2.2rem] font-bold leading-none text-[#db7324]">
                {priceLabel}
              </p>
              {compareAtPriceLabel ? (
                <p className="mt-2 text-sm text-[#aa8f7b] line-through">
                  {compareAtPriceLabel}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-[#ead9c4] bg-white px-4 py-4 sm:px-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#a06f42]">
              Ingredientes
            </p>
            <p className="mt-3 text-[1rem] leading-7 text-[#5d5142]">
              {description || "Ingredientes sob consulta no atendimento."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="cursor-pointer rounded-full border border-[#dfceb8] bg-white px-5 py-3.5 text-sm font-bold text-[#5d5142] transition hover:bg-[#f7efdf]"
              onClick={onClose}
              type="button"
            >
              Continuar olhando
            </button>
            <button
              className={`cursor-pointer rounded-full px-5 py-3.5 text-sm font-bold text-white transition ${
                added ? "bg-[#6da141]" : "bg-[#567b35] hover:bg-[#47652b]"
              }`}
              onClick={onAdd}
              type="button"
            >
              {added ? "Adicionado ao carrinho" : `Adicionar - ${priceLabel}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
