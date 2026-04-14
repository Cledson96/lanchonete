"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";

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

type MenuItemDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (notes?: string, quantity?: number, selectedOptions?: Record<string, string[]>) => void;
  added: boolean;
  name: string;
  categoryName: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  priceLabel: string;
  compareAtPriceLabel?: string | null;
  optionGroups?: OptionGroupForDialog[];
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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
}: MenuItemDetailDialogProps) {
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const [quantity, setQuantity] = useState(1);
  const [showNotes, setShowNotes] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const group of optionGroups) {
      if (group.maxSelections === 1 && group.minSelections === 1) {
        const defaultOption = group.options.find(() => false);
        initial[group.id] = defaultOption ? [defaultOption.id] : [];
      } else {
        initial[group.id] = [];
      }
    }
    return initial;
  });

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

  const optionDelta = useMemo(() => {
    let total = 0;
    for (const group of optionGroups) {
      const selected = selectedOptions[group.id] || [];
      for (const optionId of selected) {
        const option = group.options.find((o) => o.id === optionId);
        if (option) {
          total += option.priceDelta;
        }
      }
    }
    return total;
  }, [optionGroups, selectedOptions]);

  const totalLabel = formatMoney((price + optionDelta) * quantity);

  function toggleRadio(groupId: string, optionId: string) {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupId]: prev[groupId]?.[0] === optionId ? [] : [optionId],
    }));
  }

  function toggleCheckbox(groupId: string, optionId: string, maxSelections?: number | null) {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];
      const isSelected = current.includes(optionId);

      if (isSelected) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }

      if (maxSelections && current.length >= maxSelections) {
        return prev;
      }

      return { ...prev, [groupId]: [...current, optionId] };
    });
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label="Fechar detalhes do item"
        className="absolute inset-0 cursor-pointer bg-[#1c130b]/60 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div className="relative flex w-full max-w-[52rem] max-h-[90vh] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--background)] shadow-[0_30px_80px_rgba(23,15,8,0.28)]">

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

          <div className="flex w-full flex-col sm:w-[58%] overflow-y-auto">
            <div className="relative h-36 shrink-0 sm:hidden">
              <Image
                alt={name}
                className="object-cover"
                fill
                sizes="100vw"
                src={resolveMenuItemImage(imageUrl)}
              />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--background)] to-transparent" />
            </div>

            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 sm:pr-10">
                <div className="min-w-0 flex-1">
                  <span className="inline-flex rounded-full bg-[var(--success-light)] px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[var(--green-rich)]">
                    {categoryName}
                  </span>
                  <h2 className="mt-1 text-lg font-black leading-tight text-[var(--foreground)] sm:text-xl">
                    {name}
                  </h2>
                </div>
                <div className="shrink-0 text-right">
                  <p className="menu-price text-xl font-bold leading-none text-[var(--accent)] sm:text-2xl">
                    {priceLabel}
                  </p>
                  {compareAtPriceLabel ? (
                    <p className="mt-0.5 text-[0.7rem] text-[var(--muted)] line-through">{compareAtPriceLabel}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 border-t border-[var(--line)] pt-3">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">Ingredientes</p>
                <p className="mt-1 text-[0.82rem] leading-relaxed text-[var(--muted)]">
                  {description || "Ingredientes sob consulta no atendimento."}
                </p>
              </div>

              {optionGroups.length > 0 && (
                <div className="mt-3 border-t border-[var(--line)] pt-3 space-y-3">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">Adicionais</p>
                  {optionGroups.map((group) => {
                    const isRadio = group.maxSelections === 1 && group.minSelections === 1;
                    const selected = selectedOptions[group.id] || [];
                    const groupDelta = selected.reduce((sum, optionId) => {
                      const option = group.options.find((o) => o.id === optionId);
                      return sum + (option?.priceDelta || 0);
                    }, 0);

                    return (
                      <div key={group.id} className="rounded-[1rem] border border-[var(--line)] bg-white/60 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[var(--foreground)]">
                            {group.name}
                            {group.isRequired && (
                              <span className="ml-1.5 text-[0.65rem] font-normal text-red-500">*</span>
                            )}
                          </p>
                          {groupDelta > 0 && (
                            <span className="text-xs font-semibold text-[var(--brand-green-dark)]">
                              +{formatMoney(groupDelta)}
                            </span>
                          )}
                        </div>
                        {group.description && (
                          <p className="mt-0.5 text-[0.72rem] text-[var(--muted)]">{group.description}</p>
                        )}
                        <div className="mt-2 space-y-1.5">
                          {group.options.map((option) => {
                            const isChecked = selected.includes(option.id);
                            return (
                              <label
                                key={option.id}
                                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.82rem] cursor-pointer transition-colors ${isChecked ? "bg-[var(--brand-green)]/5 text-[var(--foreground)]" : "text-[var(--muted)] hover:bg-[var(--cream)]"}`}
                              >
                                <input
                                  checked={isChecked}
                                  className="accent-[var(--green-rich)]"
                                  name={isRadio ? `group-${group.id}` : undefined}
                                  onChange={() => {
                                    if (isRadio) {
                                      toggleRadio(group.id, option.id);
                                    } else {
                                      toggleCheckbox(group.id, option.id, group.maxSelections);
                                    }
                                  }}
                                  type={isRadio ? "radio" : "checkbox"}
                                />
                                <span className="flex-1">
                                  {option.name}
                                  {option.description && (
                                    <span className="ml-1 text-[0.7rem] text-[var(--muted)]">— {option.description}</span>
                                  )}
                                </span>
                                {option.priceDelta > 0 ? (
                                  <span className="text-xs font-semibold text-[var(--brand-green-dark)]">
                                    +{formatMoney(option.priceDelta)}
                                  </span>
                                ) : (
                                  <span className="text-[0.65rem] text-[var(--muted)]">incluido</span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 border-t border-[var(--line)] pt-3">
                {!showNotes ? (
                  <button
                    className="inline-flex cursor-pointer items-center gap-1.5 text-[0.78rem] font-semibold text-[var(--green-rich)] transition-colors hover:text-[var(--green-deep)]"
                    onClick={() => setShowNotes(true)}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Adicionar observacao
                  </button>
                ) : (
                  <>
                    <label
                      className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]"
                      htmlFor={`notes-${name}`}
                    >
                      Observacao
                    </label>
                    <textarea
                      autoFocus
                      className="mt-1.5 w-full resize-none rounded-[var(--radius-sm)] border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/50 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
                      defaultValue=""
                      id={`notes-${name}`}
                      maxLength={180}
                      placeholder="Ex: sem tomate, tirar cebola..."
                      ref={notesRef}
                      rows={2}
                    />
                  </>
                )}
              </div>

              <div className="flex-1" />

              <div className="mt-4 flex items-center gap-3 border-t border-[var(--line)] pt-4">
                <div className="inline-flex items-center gap-0.5 rounded-full border border-[var(--line)] bg-white p-0.5">
                  <button
                    aria-label="Diminuir quantidade"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--cream)] hover:text-[var(--foreground)]"
                    onClick={() => setQuantity((c) => Math.max(c - 1, 1))}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="min-w-6 text-center text-sm font-bold text-[var(--foreground)]">
                    {quantity}
                  </span>
                  <button
                    aria-label="Aumentar quantidade"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--cream)] hover:text-[var(--foreground)]"
                    onClick={() => setQuantity((c) => Math.min(c + 1, 99))}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <button
                  className={`flex-1 cursor-pointer rounded-full px-4 py-2.5 text-[0.82rem] font-bold text-white transition-all duration-200 active:scale-[0.97] ${
                    added
                      ? "bg-[var(--green-soft)]"
                      : "bg-[var(--green-rich)] hover:bg-[var(--green-deep)]"
                  }`}
                  onClick={() => onAdd(notesRef.current?.value, quantity, selectedOptions)}
                  type="button"
                >
                  {added ? (
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Adicionado!
                    </span>
                  ) : (
                    `Adicionar ${quantity > 1 ? quantity + " itens" : ""} · ${totalLabel}`
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