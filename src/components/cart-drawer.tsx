"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-store";

export function CartDrawer() {
  const { state, removeItem, updateQuantity, clearCart, closeCart, totalPrice } =
    useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [state.isOpen, closeCart]);

  const displayTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalPrice);

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          state.isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        aria-label="Carrinho de compras"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col bg-[#FFFAF3] shadow-[−24px_0_80px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out ${
          state.isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8d5b0] px-5 py-4">
          <div className="flex items-center gap-2">
            <svg
              aria-hidden="true"
              className="h-5 w-5 text-[#D5672E]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h2 className="text-lg font-bold text-[#1B2D20]">Seu carrinho</h2>
            {state.items.length > 0 && (
              <span className="rounded-full bg-[#D5672E] px-2 py-0.5 text-xs font-bold text-white">
                {state.items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            aria-label="Fechar carrinho"
            className="flex cursor-pointer items-center justify-center rounded-full p-2 text-[#5a6a5e] transition hover:bg-[#f0e8d8] hover:text-[#1B2D20]"
            onClick={closeCart}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
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

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0e8d8]">
                <svg
                  aria-hidden="true"
                  className="h-10 w-10 text-[#b5a080]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-[#1B2D20]">
                  Carrinho vazio
                </p>
                <p className="mt-1 text-sm text-[#5a6a5e]">
                  Adicione itens do cardápio para começar.
                </p>
              </div>
              <button
                className="cursor-pointer rounded-full bg-[#D5672E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#b85526]"
                onClick={closeCart}
                type="button"
              >
                Ver cardápio
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {state.items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-[1.2rem] border border-[#e8d5b0] bg-white p-3"
                >
                  {/* Thumb */}
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[0.8rem] bg-[#f5e9d0]">
                    <Image
                      alt={item.name}
                      className="object-cover"
                      fill
                      sizes="64px"
                      src={item.imageUrl || "/landing/menu-item-placeholder.svg"}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="text-sm font-semibold leading-snug text-[#1B2D20]">
                      {item.name}
                    </p>
                    <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#2D7D3D]">
                      {item.categoryName}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <p className="menu-price text-base font-bold text-[#D5672E]">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.price * item.quantity)}
                      </p>
                      {/* Qty controls */}
                      <div className="flex items-center gap-1 rounded-full border border-[#e8d5b0] bg-[#f5f0e8] p-0.5">
                        <button
                          aria-label="Diminuir quantidade"
                          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-[#5a6a5e] transition hover:bg-[#e8d5b0] hover:text-[#1B2D20]"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          type="button"
                        >
                          <svg
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M5 12h14"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <span className="min-w-[1.4rem] text-center text-sm font-bold text-[#1B2D20]">
                          {item.quantity}
                        </span>
                        <button
                          aria-label="Aumentar quantidade"
                          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-[#5a6a5e] transition hover:bg-[#e8d5b0] hover:text-[#1B2D20]"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          type="button"
                        >
                          <svg
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M12 5v14m-7-7h14"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Remove */}
                  <button
                    aria-label={`Remover ${item.name}`}
                    className="flex h-7 w-7 cursor-pointer shrink-0 items-center justify-center self-start rounded-full text-[#b5a080] transition hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeItem(item.id)}
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
                        d="M18 6L6 18M6 6l12 12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="border-t border-[#e8d5b0] bg-[#FFFAF3] px-5 py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-[#5a6a5e]">Total</span>
              <span className="menu-price text-2xl font-bold text-[#1B2D20]">
                {displayTotal}
              </span>
            </div>
            <Link
              className="block w-full rounded-full bg-[#D5672E] py-3.5 text-center font-semibold text-white transition hover:bg-[#b85526]"
              href="/pedido"
              onClick={closeCart}
            >
              Finalizar pedido
            </Link>
            <button
              className="mt-2 w-full cursor-pointer rounded-full border border-[#e8d5b0] py-2.5 text-sm text-[#5a6a5e] transition hover:border-red-300 hover:text-red-600"
              onClick={clearCart}
              type="button"
            >
              Limpar carrinho
            </button>
          </div>
        )}
      </div>
    </>
  );
}
