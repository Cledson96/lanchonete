"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";
import { formatMoney } from "@/lib/utils";
import type { PublicMenuCategory } from "@/lib/comanda-ui";

type MenuItem = PublicMenuCategory["menuItems"][number];

type Props = {
  item: MenuItem | null;
  categoryName: string;
  open: boolean;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: {
    quantity: number;
    notes?: string;
    optionItemIds: string[];
    ingredientCustomizations: Record<string, number>;
  }) => Promise<void>;
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

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function asNumber(value: number | string | null | undefined) {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value);
}

export function ComandaMenuItemDialog({ item, categoryName, open, loading, error, onClose, onSubmit }: Props) {
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [ingredientQtys, setIngredientQtys] = useState<Record<string, number>>({});
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || !item) return;

    setNotes("");
    setQuantity(1);
    setSelectedOptions(
      Object.fromEntries(item.optionGroups.map((group) => [group.id, [] as string[]])),
    );
    setIngredientQtys(Object.fromEntries(item.ingredients.map((ing) => [ing.id, ing.quantity])));

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [item, open]);

  const currentItem = item;

  const ingredientDelta = useMemo(() => {
    if (!currentItem?.ingredients?.length) return 0;

    return currentItem.ingredients.reduce((total, ing) => {
      const qty = Math.max(0, Math.min(ingredientQtys[ing.id] ?? ing.quantity, ing.quantity));
      const extra = qty - ing.quantity;
      return extra > 0 ? total + extra * asNumber(ing.price) : total;
    }, 0);
  }, [currentItem, ingredientQtys]);

  const optionDelta = useMemo(() => {
    if (!currentItem) return 0;

    return currentItem.optionGroups.reduce((total, group) => {
      const current = selectedOptions[group.id] || [];
      return (
        total +
        group.options.reduce((groupTotal, option) => {
          return current.includes(option.id) ? groupTotal + asNumber(option.priceDelta) : groupTotal;
        }, 0)
      );
    }, 0);
  }, [currentItem, selectedOptions]);

  const validationError = useMemo(() => {
    if (!currentItem) return null;

    for (const group of currentItem.optionGroups) {
      const current = selectedOptions[group.id] || [];
      if (group.isRequired && current.length < Math.max(group.minSelections, 1)) {
        return `Selecione ${group.name.toLowerCase()}.`;
      }
      if (group.maxSelections && current.length > group.maxSelections) {
        return `Escolha ate ${group.maxSelections} opcoes em ${group.name.toLowerCase()}.`;
      }
    }

    return null;
  }, [currentItem, selectedOptions]);

  if (!open || !currentItem) {
    return null;
  }

  const totalPrice = (asNumber(currentItem.price) + optionDelta + ingredientDelta) * quantity;
  const submitDisabled = loading || Boolean(validationError);

  function getOptionQuantity(groupId: string, optionId: string) {
    return (selectedOptions[groupId] || []).filter((id) => id === optionId).length;
  }

  function toggleRadioOption(groupId: string, optionId: string) {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];
      return current.includes(optionId) ? { ...prev, [groupId]: [] } : { ...prev, [groupId]: [optionId] };
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

  async function handleSubmit() {
    if (submitDisabled || !currentItem) return;

    const ingredientCustomizations = Object.fromEntries(
      currentItem.ingredients.map((ing) => [ing.id, Math.max(0, Math.min(ingredientQtys[ing.id] ?? ing.quantity, ing.quantity))]),
    );

    await onSubmit({
      quantity,
      notes: notes.trim() || undefined,
      optionItemIds: Object.values(selectedOptions).flatMap((value) => value),
      ingredientCustomizations,
    });
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button aria-label="Fechar modal do item" className="absolute inset-0 bg-[rgba(32,17,8,0.58)] backdrop-blur-sm" onClick={onClose} type="button" />

      <div className="absolute inset-0 flex flex-col items-stretch justify-end sm:items-center sm:justify-center sm:p-6">
        <div className="relative flex w-full max-w-[52rem] flex-col overflow-hidden rounded-t-[1.5rem] border border-[var(--line)] bg-[var(--background)] shadow-[0_-8px_40px_rgba(23,15,8,0.22)] sm:max-h-[90vh] sm:flex-row sm:rounded-[var(--radius-xl)] sm:shadow-[0_30px_80px_rgba(23,15,8,0.28)]">
          <div className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-[var(--line)] sm:hidden" />

          <button aria-label="Fechar detalhes" className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[var(--foreground)] shadow-sm backdrop-blur-sm transition-colors hover:bg-white" onClick={onClose} type="button">
            <CloseIcon />
          </button>

          <div className="relative hidden w-[42%] shrink-0 sm:block">
            <Image alt={currentItem.name} className="object-cover" fill sizes="340px" src={resolveMenuItemImage(currentItem.imageUrl)} />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10" />
          </div>

          <div className="flex w-full flex-col sm:w-[58%]" style={{ maxHeight: "90dvh" }}>
            <div className="relative h-48 shrink-0 sm:hidden">
              <Image alt={currentItem.name} className="object-cover" fill sizes="100vw" src={resolveMenuItemImage(currentItem.imageUrl)} />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--background)] to-transparent" />
            </div>

            <div className="px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
              <div className="flex items-start justify-between gap-3 sm:pr-10">
                <div className="min-w-0 flex-1">
                  <span className="inline-flex rounded-full bg-[var(--accent-light)] px-2.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[var(--brand-orange-dark)]">{categoryName}</span>
                  <h2 className="mt-1.5 text-[1.15rem] font-black leading-tight text-[var(--foreground)] sm:text-xl">{currentItem.name}</h2>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[1.35rem] font-extrabold leading-none text-[var(--accent)] sm:text-2xl">{formatMoney(totalPrice)}</p>
                </div>
              </div>

              {currentItem.description?.trim() ? <p className="mt-2 text-[0.82rem] leading-relaxed text-[var(--muted)]">{currentItem.description}</p> : null}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5">
              {currentItem.ingredients.length > 0 ? (
                <div className="mb-4 space-y-2">
                  <SectionLabel>Monte seu lanche</SectionLabel>
                  <p className="text-[0.72rem] text-[var(--muted)]">Toque em − para remover ingredientes.</p>
                  <div className="space-y-1.5">
                    {currentItem.ingredients.map((ing) => {
                      const qty = Math.max(0, Math.min(ingredientQtys[ing.id] ?? ing.quantity, ing.quantity));
                      const canIncrease = qty < ing.quantity;
                      return (
                        <div key={ing.id} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-[0.85rem] transition-colors ${qty === 0 ? "border-red-100 bg-red-50/60 text-[var(--muted)]/50" : "border-[var(--line)] bg-white"}`}>
                          <span className={qty === 0 ? "line-through" : "text-[var(--foreground)]"}>{ing.name}</span>
                          <div className="inline-flex items-center gap-2">
                            <button aria-label={`Remover ${ing.name}`} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[var(--line)]/60 text-[var(--foreground)] transition hover:bg-red-100 hover:text-red-600" onClick={() => setIngredientQtys((prev) => ({ ...prev, [ing.id]: Math.max(0, (prev[ing.id] ?? ing.quantity) - 1) }))} type="button"><MinusIcon /></button>
                            <span className="min-w-[1.4rem] text-center text-[0.82rem] font-bold text-[var(--foreground)]">{qty}</span>
                            <button aria-label={`Adicionar ${ing.name}`} className={`flex h-7 w-7 items-center justify-center rounded-full transition ${canIncrease ? "cursor-pointer bg-[var(--brand-green)]/20 text-[var(--green-rich)] hover:bg-[var(--brand-green)]/30" : "cursor-not-allowed bg-[var(--line)]/35 text-[var(--muted)] opacity-40"}`} disabled={!canIncrease} onClick={() => { if (!canIncrease) return; setIngredientQtys((prev) => ({ ...prev, [ing.id]: Math.min(ing.quantity, (prev[ing.id] ?? ing.quantity) + 1) })); }} type="button"><PlusIcon /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {currentItem.optionGroups.length > 0 ? (
                <div className="mb-4 space-y-4">
                  <SectionLabel>Adicionais</SectionLabel>
                  {currentItem.optionGroups.map((group) => {
                    const current = selectedOptions[group.id] || [];
                    const isRadio = group.maxSelections === 1;

                    return (
                      <div key={group.id} className="rounded-xl border border-[var(--line)] bg-white overflow-hidden">
                        <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--cream)]/60 px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[0.85rem] font-semibold text-[var(--foreground)]">{group.name}</p>
                            {group.isRequired ? <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-red-600">obrigatório</span> : null}
                          </div>
                          {group.maxSelections && group.maxSelections > 1 ? <span className="text-[0.68rem] text-[var(--muted)]">máx. {group.maxSelections}</span> : null}
                        </div>

                        {group.description ? <p className="px-3 pt-2 text-[0.72rem] text-[var(--muted)]">{group.description}</p> : null}

                        <div className="divide-y divide-[var(--line)]">
                          {group.options.map((option) => {
                            const optionQty = getOptionQuantity(group.id, option.id);
                            const isSelected = optionQty > 0;

                            return (
                              <div key={option.id} className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${isSelected ? "bg-[var(--brand-green)]/5" : "hover:bg-[var(--cream)]/60"}`}>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-[0.85rem] ${isSelected ? "font-semibold text-[var(--foreground)]" : "text-[var(--foreground)]"}`}>{option.name}</p>
                                  {option.description ? <p className="text-[0.72rem] text-[var(--muted)]">{option.description}</p> : null}
                                </div>

                                <span className={`shrink-0 text-[0.78rem] font-semibold ${asNumber(option.priceDelta) > 0 ? "text-[var(--brand-green-dark)]" : "text-[var(--muted)]"}`}>{asNumber(option.priceDelta) > 0 ? `+${formatMoney(asNumber(option.priceDelta))}` : "incluso"}</span>

                                {isRadio ? (
                                  <button aria-pressed={isSelected} className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all ${isSelected ? "border-[var(--brand-green)] bg-[var(--brand-green)]" : "border-[var(--line)] bg-white hover:border-[var(--brand-green)]"}`} onClick={() => toggleRadioOption(group.id, option.id)} type="button">
                                    {isSelected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                                  </button>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button aria-label={`Diminuir ${option.name}`} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[var(--line)]/60 text-[var(--foreground)] transition hover:bg-red-100 hover:text-red-600" onClick={() => decrementOption(group.id, option.id)} type="button"><MinusIcon /></button>
                                    <span className="min-w-[1.4rem] text-center text-[0.82rem] font-bold text-[var(--foreground)]">{optionQty}</span>
                                    <button aria-label={`Adicionar ${option.name}`} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[var(--brand-green)]/20 text-[var(--green-rich)] transition hover:bg-[var(--brand-green)]/30" onClick={() => incrementOption(group.id, option.id, group.maxSelections)} type="button"><PlusIcon /></button>
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
              ) : null}

              <div className="mb-4">
                <label className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Observação do item</span>
                  <textarea className="mt-3 h-28 w-full resize-none rounded-[1rem] border border-[var(--line)] bg-white px-3 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--brand-orange)]/35" maxLength={180} onChange={(event) => setNotes(event.target.value)} placeholder="Ex: sem cebola, molho a parte, dividir em 2 pratos..." value={notes} />
                </label>
              </div>

              {ingredientDelta > 0 || optionDelta > 0 ? (
                <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-[var(--brand-green)]/8 px-3 py-2 text-[0.75rem] text-[var(--muted)]">
                  {ingredientDelta > 0 ? <span>Extras: <strong className="text-[var(--brand-green-dark)]">+{formatMoney(ingredientDelta)}</strong></span> : null}
                  {optionDelta > 0 ? <span>Adicionais: <strong className="text-[var(--brand-green-dark)]">+{formatMoney(optionDelta)}</strong></span> : null}
                </div>
              ) : null}

              {validationError || error ? <div className="mb-4 rounded-[1.3rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{validationError || error}</div> : null}
            </div>

            <div className="shrink-0 border-t border-[var(--line)] bg-[var(--background)] px-4 pb-5 pt-3 sm:px-5 sm:pb-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-0.5 rounded-full border border-[var(--line)] bg-white p-0.5">
                  <button aria-label="Diminuir quantidade" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--cream)] hover:text-[var(--foreground)]" onClick={() => setQuantity((current) => Math.max(1, current - 1))} type="button"><MinusIcon /></button>
                  <span className="min-w-7 text-center text-[0.9rem] font-bold text-[var(--foreground)]">{quantity}</span>
                  <button aria-label="Aumentar quantidade" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--cream)] hover:text-[var(--foreground)]" onClick={() => setQuantity((current) => Math.min(99, current + 1))} type="button"><PlusIcon /></button>
                </div>

                <button className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--green-rich)] px-4 py-2.5 text-[0.88rem] font-bold text-white transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60" disabled={submitDisabled} onClick={() => void handleSubmit()} type="button">
                  {loading ? "Lançando item..." : "Lançar na comanda"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
