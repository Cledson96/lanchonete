"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";
import { useCart } from "@/lib/cart-store";

export function CartDrawer() {
  const {
    state,
    removeItem,
    updateQuantity,
    updateNotes,
    clearCart,
    closeCart,
    totalPrice,
  } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

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

  function startEditing(itemId: string, currentNotes?: string | null) {
    setEditingItemId(itemId);
    setDraftNotes((prev) => ({
      ...prev,
      [itemId]: currentNotes ?? "",
    }));
  }

  function saveNotes(itemId: string) {
    updateNotes(itemId, draftNotes[itemId] ?? "");
    setEditingItemId(null);
  }

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-[var(--foreground)]/40 backdrop-blur-md transition-opacity duration-300 ${
          state.isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        aria-label="Carrinho de compras"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col bg-[var(--background)] shadow-2xl transition-transform duration-300 ease-out ${
          state.isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5 bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--brand-orange)]/10 p-2 rounded-full">
              <svg
                aria-hidden="true"
                className="h-5 w-5 text-[var(--brand-orange-dark)]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-[1.15rem] font-bold text-[var(--foreground)] tracking-tight">Seu carrinho</h2>
            {state.items.length > 0 && (
              <span className="rounded-full bg-[var(--brand-orange)] px-2.5 py-0.5 text-xs font-black text-white shadow-sm">
                {state.items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            aria-label="Fechar carrinho"
            className="flex cursor-pointer items-center justify-center rounded-full p-2.5 text-[var(--muted)] transition-colors hover:bg-[var(--brand-orange)]/10 hover:text-[var(--brand-orange-dark)]"
            onClick={closeCart}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-[var(--brand-orange)]/20">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--brand-orange)]/10 ring-8 ring-[var(--brand-orange)]/5">
                <svg
                  aria-hidden="true"
                  className="h-12 w-12 text-[var(--brand-orange)]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-[1.2rem] font-bold text-[var(--foreground)]">
                  Carrinho vazio
                </p>
                <p className="text-[0.95rem] text-[var(--muted)]">
                  Que tal adicionar um burger artesanal?
                </p>
              </div>
              <button
                className="mt-2 cursor-pointer rounded-full bg-[var(--brand-orange)] px-8 py-3.5 text-[0.95rem] font-bold text-white shadow-[0_4px_14px_rgba(242,122,34,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[var(--brand-orange-dark)] hover:shadow-[0_6px_20px_rgba(242,122,34,0.4)] active:translate-y-0"
                onClick={closeCart}
                type="button"
              >
                Ver cardápio
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {state.items.map((item) => (
                <li
                  key={item.id}
                  className="relative flex gap-4 rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Thumb */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1rem] bg-[var(--background-strong)] border border-[var(--brand-orange)]/10">
                    <Image
                      alt={item.name}
                      className="object-cover"
                      fill
                      sizes="80px"
                      src={resolveMenuItemImage(item.imageUrl)}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="pr-2">
                      <p className="text-[0.95rem] font-bold leading-snug text-[var(--foreground)]">
                        {item.name}
                      </p>
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--brand-green-dark)] mt-0.5">
                        {item.categoryName}
                      </p>
                    </div>

                    {editingItemId === item.id ? (
                      <div className="mt-2 rounded-2xl border border-[var(--brand-orange)]/30 bg-[var(--brand-orange)]/5 p-3.5 shadow-inner">
                        <label
                          className="block text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--brand-orange-dark)]"
                          htmlFor={`cart-notes-${item.id}`}
                        >
                          Anotações do Chef
                        </label>
                        <textarea
                          className="mt-2.5 min-h-[5rem] w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--brand-orange)] focus:ring-2 focus:ring-[var(--brand-orange)]/20"
                          id={`cart-notes-${item.id}`}
                          maxLength={180}
                          onChange={(event) =>
                            setDraftNotes((prev) => ({
                              ...prev,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder="Ex.: sem tomate, tirar cebola..."
                          value={draftNotes[item.id] ?? ""}
                        />
                        <div className="mt-3 flex gap-2">
                          <button
                            className="cursor-pointer rounded-full bg-[var(--brand-green)] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--brand-green-dark)] hover:-translate-y-0.5"
                            onClick={() => saveNotes(item.id)}
                            type="button"
                          >
                            Salvar
                          </button>
                          <button
                            className="cursor-pointer rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-bold text-[var(--muted)] transition hover:bg-[var(--background-strong)] hover:text-[var(--foreground)]"
                            onClick={() => setEditingItemId(null)}
                            type="button"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : item.notes ? (
                      <button
                        className="mt-1 flex flex-col items-start cursor-pointer rounded-xl bg-[var(--brand-orange)]/10 px-3.5 py-2.5 text-left text-sm text-[var(--foreground)] border border-[var(--brand-orange)]/20 transition hover:bg-[var(--brand-orange)]/15 group"
                        onClick={() => startEditing(item.id, item.notes)}
                        type="button"
                      >
                        <span className="flex w-full items-center justify-between">
                          <span className="block text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[var(--brand-orange-dark)]">
                            Anotações do Chef
                          </span>
                          <svg className="w-3.5 h-3.5 text-[var(--brand-orange-dark)] opacity-40 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </span>
                        <span className="mt-1.5 block leading-snug font-medium italic">&ldquo;{item.notes}&rdquo;</span>
                      </button>
                    ) : (
                      <button
                        className="mt-1 flex w-fit items-center gap-1.5 cursor-pointer text-left text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)] transition hover:text-[var(--brand-orange-dark)]"
                        onClick={() => startEditing(item.id, item.notes)}
                        type="button"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Adicionar observação
                      </button>
                    )}
                    <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                      <p className="menu-price text-[1.1rem] font-black tracking-tight text-[var(--brand-orange-dark)]">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(item.price * item.quantity)}
                      </p>
                      {/* Qty controls */}
                      <div className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--background-strong)] p-1 shadow-sm">
                        <button
                          aria-label="Diminuir quantidade"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white text-[var(--foreground)] shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition hover:bg-[var(--brand-orange)] hover:text-white active:scale-95"
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
                            strokeWidth={3}
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M5 12h14"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <span className="min-w-[1.5rem] text-center text-[0.95rem] font-black text-[var(--foreground)]">
                          {item.quantity}
                        </span>
                        <button
                          aria-label="Aumentar quantidade"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white text-[var(--foreground)] shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition hover:bg-[var(--brand-green)] hover:text-white active:scale-95"
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
                            strokeWidth={3}
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
                  <div className="absolute -top-2.5 -right-2.5">
                    <button
                      aria-label={`Remover ${item.name}`}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white border border-[var(--line)] text-[var(--muted)] shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 hover:scale-110"
                      onClick={() => removeItem(item.id)}
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
                          d="M18 6L6 18M6 6l12 12"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="relative border-t border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="mb-5 flex items-end justify-between">
              <span className="text-[0.95rem] font-bold text-[var(--muted)] uppercase tracking-wider">Total do pedido</span>
              <span className="menu-price text-[1.75rem] font-black tracking-tight text-[var(--foreground)] drop-shadow-sm">
                {displayTotal}
              </span>
            </div>
            <Link
              className="group relative flex w-full cursor-pointer items-center justify-center gap-2 rounded-full overflow-hidden bg-[var(--brand-green)] py-4 text-[1.05rem] font-black text-white shadow-[0_8px_24px_rgba(140,198,63,0.35)] transition-all duration-300 hover:bg-[var(--brand-green-dark)] hover:shadow-[0_12px_32px_rgba(140,198,63,0.45)] hover:-translate-y-1 active:translate-y-0"
              href="/pedido"
              onClick={closeCart}
            >
              <div className="absolute inset-0 w-1/2 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-[250%] transition-transform duration-1000 ease-in-out" />
              Finalizar pedido
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
            <button
              className="mt-4 w-full cursor-pointer rounded-full border-2 border-transparent py-2.5 text-[0.85rem] font-bold text-[var(--muted)] transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600"
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
