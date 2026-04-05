"use client";

import { useCart } from "@/lib/cart-store";

export function CartButton() {
  const { openCart, totalItems } = useCart();

  return (
    <button
      aria-label={`Abrir carrinho${totalItems > 0 ? ` (${totalItems} itens)` : ""}`}
      className="relative flex cursor-pointer items-center gap-2 rounded-full bg-[#D5672E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b85526] active:scale-95"
      onClick={openCart}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        viewBox="0 0 24 24"
      >
        <path
          d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="hidden sm:inline">Carrinho</span>
      {totalItems > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#D5672E]">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
}
