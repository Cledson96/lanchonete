"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";
import { formatMoney } from "@/lib/utils";

type OptionGroupForDialog = {
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

type IngredientForDialog = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

type MenuItemDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (notes?: string, quantity?: number, selectedOptions?: Record<string, string[]>, ingredientCustomizations?: Record<string, number>) => void;
  added: boolean;
  name: string;
  categoryName: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  priceLabel: string;
  compareAtPriceLabel?: string | null;
  optionGroups?: OptionGroupForDialog[];
  ingredients?: IngredientForDialog[];
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
      <span className="h-px flex-1 bg-[var(--line)]" />
      {children}
      <span className="h-px flex-1 bg-[var(--line)]" />
    </p>
  );
}

export function MenuItemDetailDialog({
  open,
  onClose,
  onAdd,
  added,
  name,
  categoryName,
  description,
  imageUrl,
  price,
  priceLabel,
  compareAtPriceLabel,
  optionGroups = [],
  ingredients = [],
}: MenuItemDetailDialogProps) {
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const [quantity, setQuantity] = useState(1);
  const [showNotes, setShowNotes] = useState(false);
  const [ingredientQtys, setIngredientQtys] = useState<Record<string, number>>(
    () => Object.fromEntries(ingredients.map((ing) => [ing.id, ing.quantity])),
  );
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const group of optionGroups) {
      initial[group.id] = [];
    }
    return initial;
  });

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const ingredientDelta = useMemo(() => {
    let total = 0;
    for (const ing of ingredients) {
      const currentQty = Math.max(0, Math.min(ingredientQtys[ing.id] ?? ing.quantity, ing.quantity));
      const extraQty = currentQty - ing.quantity;
      if (extraQty > 0) total += extraQty * ing.price;
    }
    return total;
  }, [ingredients, ingredientQtys]);

  const optionDelta = useMemo(() => {
    let total = 0;
    for (const group of optionGroups) {
      const selected = selectedOptions[group.id] || [];
      for (const optionId of selected) {
        const option = group.options.find((o) => o.id === optionId);
        if (option) total += option.priceDelta;
      }
    }
    return total;
  }, [optionGroups, selectedOptions]);

  const totalLabel = formatMoney((price + optionDelta + ingredientDelta) * quantity);

  function getOptionQuantity(groupId: string, optionId: string) {
    return (selectedOptions[groupId] || []).filter((id) => id === optionId).length;
  }

  function toggleRadioOption(groupId: string, optionId: string) {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];
      if (current.includes(optionId)) return { ...prev, [groupId]: [] };
      return { ...prev, [groupId]: [optionId] };
    });
  }

  function incrementOption(groupId: string, optionId: string, maxSelections?: number | null) {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];
      if (maxSelections && current.length >= maxSelections) return prev;
      return { ...prev, [groupId]: [...current, optionId] };
    });
  }

  function decrementOption(groupId: string, optionId: string) {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];
      const index = current.lastIndexOf(optionId);
      if (index === -1) return prev;
      return { ...prev, [groupId]: [...current.slice(0, index), ...current.slice(index + 1)] };
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Backdrop */}
      <button
        aria-label="Fechar detalhes do item"
        className="absolute inset-0 cursor-pointer bg-[#1c130b]/65 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      {/* Mobile: bottom sheet / Desktop: centered modal */}
      <div className="absolute inset-0 flex flex-col items-stretch justify-end sm:items-center sm:justify-center sm:p-6">
        <div className="relative flex w-full max-w-[52rem] flex-col overflow-hidden rounded-t-[1.5rem] border border-[var(--line)] bg-[var(--background)] shadow-[0_-8px_40px_rgba(23,15,8,0.22)] sm:max-h-[90vh] sm:flex-row sm:rounded-[var(--radius-xl)] sm:shadow-[0_30px_80px_rgba(23,15,8,0.28)]">

          {/* Handle bar — mobile only */}
          <div className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-[var(--line)] sm:hidden" />

          {/* Botão fechar */}
          <button
            aria-label="Fechar detalhes"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[var(--foreground)] shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Imagem — desktop: coluna lateral */}
          <div className="relative hidden w-[42%] shrink-0 sm:block">
            <Image
              alt={name}
              className="object-cover"
              fill
              sizes="340px"
              src={resolveMenuItemImage(imageUrl)}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10" />
          </div>

          {/* Coluna de conteúdo */}
          <div className="flex w-full flex-col sm:w-[58%]" style={{ maxHeight: "90dvh" }}>

            {/* Imagem — mobile: topo */}
            <div className="relative h-48 shrink-0 sm:hidden">
              <Image
                alt={name}
                className="object-cover"
                fill
                sizes="100vw"
                src={resolveMenuItemImage(imageUrl)}
              />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--background)] to-transparent" />
            </div>

            {/* Cabeçalho */}
            <div className="px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
              <div className="flex items-start justify-between gap-3 sm:pr-10">
                <div className="min-w-0 flex-1">
                  <span className="inline-flex rounded-full bg-[var(--accent-light)] px-2.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[var(--brand-orange-dark)]">
                    {categoryName}
                  </span>
                  <h2 className="mt-1.5 text-[1.15rem] font-black leading-tight text-[var(--foreground)] sm:text-xl">
                    {name}
                  </h2>
                </div>
                <div className="shrink-0 text-right">
                  {compareAtPriceLabel ? (
                    <p className="text-[0.68rem] text-[var(--muted)] line-through leading-none">{compareAtPriceLabel}</p>
                  ) : null}
                  <p className="text-[1.35rem] font-extrabold leading-none text-[var(--accent)] sm:text-2xl">
                    {priceLabel}
                  </p>
                </div>
              </div>

              {description?.trim() ? (
                <p className="mt-2 text-[0.82rem] leading-relaxed text-[var(--muted)]">
                  {description}
                </p>
              ) : null}
            </div>

            {/* Área scrollável */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5">

              {/* Ingredientes customizáveis */}
              {ingredients.length > 0 && (
                <div className="mb-4 space-y-2">
                  <SectionLabel>Monte seu lanche</SectionLabel>
                  <p className="text-[0.72rem] text-[var(--muted)]">Toque em − para remover ingredientes.</p>
                  <div className="space-y-1.5">
                    {ingredients.map((ing) => {
                      const qty = Math.max(0, Math.min(ingredientQtys[ing.id] ?? ing.quantity, ing.quantity));
                      const canIncrease = qty < ing.quantity;
                      return (
                        <div
                          key={ing.id}
                          className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-[0.85rem] transition-colors ${
                            qty === 0
                              ? "border-red-100 bg-red-50/60 text-[var(--muted)]/50"
                              : "border-[var(--line)] bg-white"
                          }`}
                        >
                          <span className={qty === 0 ? "line-through" : "text-[var(--foreground)]"}>
                            {ing.name}
                          </span>
                          <div className="inline-flex items-center gap-2">
                            <button
                              aria-label={`Remover ${ing.name}`}
                              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[var(--line)]/60 text-[var(--foreground)] transition hover:bg-red-100 hover:text-red-600"
                              onClick={() =>
                                setIngredientQtys((prev) => ({
                                  ...prev,
                                  [ing.id]: Math.max(0, (prev[ing.id] ?? ing.quantity) - 1),
                                }))
                              }
                              type="button"
                            >
                              <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            <span className="min-w-[1.4rem] text-center text-[0.82rem] font-bold text-[var(--foreground)]">
                              {qty}
                            </span>
                            <button
                              aria-label={`Adicionar ${ing.name}`}
                              className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                                canIncrease
                                  ? "cursor-pointer bg-[var(--brand-green)]/20 text-[var(--green-rich)] hover:bg-[var(--brand-green)]/30"
                                  : "cursor-not-allowed bg-[var(--line)]/35 text-[var(--muted)] opacity-40"
                              }`}
                              onClick={() => {
                                if (!canIncrease) return;
                                setIngredientQtys((prev) => ({
                                  ...prev,
                                  [ing.id]: Math.min(ing.quantity, (prev[ing.id] ?? ing.quantity) + 1),
                                }));
                              }}
                              disabled={!canIncrease}
                              type="button"
                            >
                              <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grupos de opções */}
              {optionGroups.length > 0 && (
                <div className="mb-4 space-y-4">
                  <SectionLabel>Adicionais</SectionLabel>
                  {optionGroups.map((group) => {
                    const isRadio = group.maxSelections === 1;

                    return (
                      <div key={group.id} className="rounded-xl border border-[var(--line)] bg-white overflow-hidden">
                        {/* Cabeçalho do grupo */}
                        <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--cream)]/60 px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[0.85rem] font-semibold text-[var(--foreground)]">
                              {group.name}
                            </p>
                            {group.isRequired && (
                              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-red-600">
                                obrigatório
                              </span>
                            )}
                          </div>
                          {group.maxSelections && group.maxSelections > 1 && (
                            <span className="text-[0.68rem] text-[var(--muted)]">
                              máx. {group.maxSelections}
                            </span>
                          )}
                        </div>

                        {group.description ? (
                          <p className="px-3 pt-2 text-[0.72rem] text-[var(--muted)]">{group.description}</p>
                        ) : null}

                        <div className="divide-y divide-[var(--line)]">
                          {group.options.map((option) => {
                            const optionQty = getOptionQuantity(group.id, option.id);
                            const isSelected = optionQty > 0;

                            return (
                              <div
                                key={option.id}
                                className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                                  isSelected ? "bg-[var(--brand-green)]/5" : "hover:bg-[var(--cream)]/60"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className={`text-[0.85rem] ${isSelected ? "font-semibold text-[var(--foreground)]" : "text-[var(--foreground)]"}`}>
                                    {option.name}
                                  </p>
                                  {option.description ? (
                                    <p className="text-[0.72rem] text-[var(--muted)]">{option.description}</p>
                                  ) : null}
                                </div>

                                <span className={`shrink-0 text-[0.78rem] font-semibold ${option.priceDelta > 0 ? "text-[var(--brand-green-dark)]" : "text-[var(--muted)]"}`}>
                                  {option.priceDelta > 0 ? `+${formatMoney(option.priceDelta)}` : "incluso"}
                                </span>

                                {/* Radio (seleção única) ou Stepper (múltipla) */}
                                {isRadio ? (
                                  <button
                                    aria-pressed={isSelected}
                                    className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all ${
                                      isSelected
                                        ? "border-[var(--brand-green)] bg-[var(--brand-green)]"
                                        : "border-[var(--line)] bg-white hover:border-[var(--brand-green)]"
                                    }`}
                                    onClick={() => toggleRadioOption(group.id, option.id)}
                                    type="button"
                                  >
                                    {isSelected && (
                                      <span className="h-2 w-2 rounded-full bg-white" />
                                    )}
                                  </button>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      aria-label={`Diminuir ${option.name}`}
                                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[var(--line)]/60 text-[var(--foreground)] transition hover:bg-red-100 hover:text-red-600"
                                      onClick={() => decrementOption(group.id, option.id)}
                                      type="button"
                                    >
                                      <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </button>
                                    <span className="min-w-[1.4rem] text-center text-[0.82rem] font-bold text-[var(--foreground)]">
                                      {optionQty}
                                    </span>
                                    <button
                                      aria-label={`Adicionar ${option.name}`}
                                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[var(--brand-green)]/20 text-[var(--green-rich)] transition hover:bg-[var(--brand-green)]/30"
                                      onClick={() => incrementOption(group.id, option.id, group.maxSelections)}
                                      type="button"
                                    >
                                      <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Observação */}
              <div className="mb-4">
                {!showNotes ? (
                  <button
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-[var(--line)] px-3 py-1.5 text-[0.78rem] font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--brand-orange)] hover:text-[var(--brand-orange-dark)]"
                    onClick={() => setShowNotes(true)}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Adicionar observação
                  </button>
                ) : (
                  <div>
                    <label
                      className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--ink-soft)]"
                      htmlFor={`notes-${name}`}
                    >
                      Observação
                    </label>
                    <textarea
                      autoFocus
                      className="mt-1.5 w-full resize-none rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-[0.85rem] text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/50 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
                      defaultValue=""
                      id={`notes-${name}`}
                      maxLength={180}
                      placeholder="Ex: sem tomate, tirar cebola..."
                      ref={notesRef}
                      rows={2}
                    />
                  </div>
                )}
              </div>

              {/* Deltas de preço */}
              {(ingredientDelta > 0 || optionDelta > 0) && (
                <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-[var(--brand-green)]/8 px-3 py-2 text-[0.75rem] text-[var(--muted)]">
                  {ingredientDelta > 0 && (
                    <span>Extras: <strong className="text-[var(--brand-green-dark)]">+{formatMoney(ingredientDelta)}</strong></span>
                  )}
                  {optionDelta > 0 && (
                    <span>Adicionais: <strong className="text-[var(--brand-green-dark)]">+{formatMoney(optionDelta)}</strong></span>
                  )}
                </div>
              )}
            </div>

            {/* CTA sticky — sempre visível */}
            <div className="shrink-0 border-t border-[var(--line)] bg-[var(--background)] px-4 pb-5 pt-3 sm:px-5 sm:pb-4">
              <div className="flex items-center gap-3">
                {/* Stepper de quantidade */}
                <div className="inline-flex items-center gap-0.5 rounded-full border border-[var(--line)] bg-white p-0.5">
                  <button
                    aria-label="Diminuir quantidade"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--cream)] hover:text-[var(--foreground)]"
                    onClick={() => setQuantity((c) => Math.max(c - 1, 1))}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="min-w-7 text-center text-[0.9rem] font-bold text-[var(--foreground)]">
                    {quantity}
                  </span>
                  <button
                    aria-label="Aumentar quantidade"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--cream)] hover:text-[var(--foreground)]"
                    onClick={() => setQuantity((c) => Math.min(c + 1, 100))}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {/* Botão adicionar */}
                <button
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[0.88rem] font-bold text-white transition-all duration-200 active:scale-[0.97] ${
                    added
                      ? "bg-[var(--green-soft)]"
                      : "bg-[var(--green-rich)] hover:bg-[var(--green-deep)]"
                  }`}
                  onClick={() => onAdd(notesRef.current?.value, quantity, selectedOptions, ingredientQtys)}
                  type="button"
                >
                  {added ? (
                    <>
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Adicionado!
                    </>
                  ) : (
                    <>
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Adicionar · {totalLabel}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
