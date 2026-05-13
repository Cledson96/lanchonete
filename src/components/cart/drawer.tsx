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
                  className="flex gap-3 rounded-2xl border border-[var(--line)] bg-white p-3 shadow-sm"
                >
                  {/* Thumb */}
                  <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-[var(--cream)]">
                    <Image
                      alt={item.name}
                      className="object-cover"
                      fill
                      sizes="72px"
                      src={resolveMenuItemImage(item.imageUrl)}
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {/* Nome + remover */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[0.9rem] font-bold leading-snug text-[var(--foreground)]">
                        {item.name}
                      </p>
                      <button
                        aria-label={`Remover ${item.name}`}
                        className="mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-red-50 hover:text-red-500"
                        onClick={() => removeItem(item.id)}
                        type="button"
                      >
                        <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>

                    {/* Tags de opções/ingredientes */}
                    {item.optionNames && item.optionNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.optionNames.map((name, i) => (
                          <span key={i} className="inline-flex rounded-full bg-[var(--accent-light)] px-1.5 py-0.5 text-[0.6rem] font-medium text-[var(--brand-orange-dark)]">
                            +{name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {item.ingredientCustomizations && item.ingredientNames ? (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(item.ingredientCustomizations)
                          .filter(([, qty]) => qty !== 1)
                          .map(([ingId, qty]) => {
                            const ingName = item.ingredientNames?.[ingId] || ingId;
                            return (
                              <span key={ingId} className={`inline-flex rounded-full px-1.5 py-0.5 text-[0.6rem] font-medium ${qty === 0 ? "bg-red-50 text-red-500" : "bg-[var(--accent-light)] text-[var(--brand-orange-dark)]"}`}>
                                {qty === 0 ? `sem ${ingName}` : `${qty}× ${ingName}`}
                              </span>
                            );
                          })}
                      </div>
                    ) : null}

                    {/* Observação */}
                    {editingItemId === item.id ? (
                      <div className="mt-1 rounded-xl border border-[var(--line)] bg-[var(--cream)] p-2.5">
                        <textarea
                          autoFocus
                          className="w-full resize-none rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-[0.82rem] text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/50 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
                          id={`cart-notes-${item.id}`}
                          maxLength={180}
                          onChange={(event) =>
                            setDraftNotes((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                          placeholder="Ex.: sem tomate, tirar cebola..."
                          rows={2}
                          value={draftNotes[item.id] ?? ""}
                        />
                        <div className="mt-2 flex gap-1.5">
                          <button
                            className="cursor-pointer rounded-full bg-[var(--brand-green)] px-3 py-1 text-[0.72rem] font-bold text-white transition hover:bg-[var(--brand-green-dark)]"
                            onClick={() => saveNotes(item.id)}
                            type="button"
                          >
                            Salvar
                          </button>
                          <button
                            className="cursor-pointer rounded-full border border-[var(--line)] px-3 py-1 text-[0.72rem] font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]"
                            onClick={() => setEditingItemId(null)}
                            type="button"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : item.notes ? (
                      <button
                        className="mt-0.5 flex cursor-pointer items-start gap-1.5 rounded-lg bg-[var(--cream)] px-2.5 py-1.5 text-left transition hover:bg-[var(--cream-deep)] group"
                        onClick={() => startEditing(item.id, item.notes)}
                        type="button"
                      >
                        <svg className="mt-0.5 h-3 w-3 shrink-0 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        <span className="text-[0.75rem] italic leading-snug text-[var(--ink-soft)]">{item.notes}</span>
                      </button>
                    ) : (
                      <button
                        className="mt-0.5 flex w-fit cursor-pointer items-center gap-1 text-[0.72rem] text-[var(--muted)] transition hover:text-[var(--brand-orange-dark)]"
                        onClick={() => startEditing(item.id, item.notes)}
                        type="button"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Observação
                      </button>
                    )}

                    {/* Preço + qty */}
                    <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                      <p className="text-[1rem] font-extrabold text-[var(--accent)]">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((item.price + (item.optionDelta || 0)) * item.quantity)}
                      </p>
                      <div className="flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--background)] p-0.5">
                        <button
                          aria-label="Diminuir quantidade"
                          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--accent-light)] hover:text-[var(--brand-orange-dark)] active:scale-95"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          type="button"
                        >
                          <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <span className="min-w-[1.4rem] text-center text-[0.85rem] font-black text-[var(--foreground)]">
                          {item.quantity}
                        </span>
                        <button
                          aria-label="Aumentar quantidade"
                          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--success-light)] hover:text-[var(--brand-green-dark)] active:scale-95"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          type="button"
                        >
                          <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="border-t border-[var(--line)] bg-white px-5 pb-6 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
            {/* Total */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Total</span>
              <span className="text-[1.5rem] font-extrabold leading-none text-[var(--foreground)]">
                {displayTotal}
              </span>
            </div>

            <Link
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--brand-green)] py-3.5 text-[0.95rem] font-bold text-white shadow-[0_4px_14px_rgba(127,181,57,0.35)] transition-all duration-200 hover:bg-[var(--brand-green-dark)] hover:shadow-[0_6px_20px_rgba(127,181,57,0.4)] active:scale-[0.98]"
              href="/pedido"
              onClick={closeCart}
            >
              Finalizar pedido
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>

            <button
              className="mt-3 w-full cursor-pointer py-2 text-[0.78rem] font-semibold text-[var(--muted)] transition-colors hover:text-red-500"
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
