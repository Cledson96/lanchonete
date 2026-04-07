"use client";

import { useCart } from "@/lib/cart-store";

export function CartButton() {
  const { openCart, totalItems } = useCart();

  return (
    <button
      aria-label={`Abrir carrinho${totalItems > 0 ? ` (${totalItems} itens)` : ""}`}
      className="relative flex cursor-pointer items-center gap-2 rounded-full bg-[var(--accent)] px-3.5 py-2 text-[0.82rem] font-semibold text-white transition-all duration-200 hover:bg-[var(--accent-strong)] active:scale-95"
      onClick={openCart}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="hidden sm:inline">Carrinho</span>
      {totalItems > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[0.65rem] font-bold text-[var(--accent)]">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
}
