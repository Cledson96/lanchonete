"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
  onSubmit: (input: { quantity: number; notes?: string; optionItemIds: string[] }) => Promise<void>;
};

export function ComandaMenuItemDialog({
  item,
  categoryName,
  open,
  loading,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

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
  }, [onClose, open]);

  const optionItemIds = useMemo(
    () => Object.values(selectedOptions).flatMap((value) => value),
    [selectedOptions],
  );

  const optionDelta = useMemo(() => {
    if (!item) {
      return 0;
    }

    return item.optionGroups.reduce((sum, group) => {
      const current = selectedOptions[group.id] || [];
      return (
        sum +
        group.options.reduce((groupSum, option) => {
          return current.includes(option.id) ? groupSum + Number(option.priceDelta || 0) : groupSum;
        }, 0)
      );
    }, 0);
  }, [item, selectedOptions]);

  const validationError = useMemo(() => {
    if (!item) {
      return null;
    }

    for (const group of item.optionGroups) {
      const current = selectedOptions[group.id] || [];

      if (group.isRequired && current.length < Math.max(group.minSelections, 1)) {
        return `Selecione ${group.name.toLowerCase()}.`;
      }

      if (group.maxSelections && current.length > group.maxSelections) {
        return `Escolha ate ${group.maxSelections} opcoes em ${group.name.toLowerCase()}.`;
      }
    }

    return null;
  }, [item, selectedOptions]);

  if (!open || !item) {
    return null;
  }

  const totalPrice = (Number(item.price) + optionDelta) * quantity;

  function toggleOption(groupId: string, optionId: string, maxSelections?: number | null) {
    setSelectedOptions((current) => {
      const existing = current[groupId] || [];
      const alreadySelected = existing.includes(optionId);

      if (alreadySelected) {
        return {
          ...current,
          [groupId]: existing.filter((value) => value !== optionId),
        };
      }

      if (maxSelections === 1) {
        return {
          ...current,
          [groupId]: [optionId],
        };
      }

      if (maxSelections && existing.length >= maxSelections) {
        return current;
      }

      return {
        ...current,
        [groupId]: [...existing, optionId],
      };
    });
  }

  async function handleSubmit() {
    if (validationError) {
      return;
    }

    await onSubmit({
      quantity,
      notes: notes.trim() || undefined,
      optionItemIds,
    });
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        aria-label="Fechar modal do item"
        className="absolute inset-0 bg-[rgba(32,17,8,0.58)] backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
        <div className="relative flex max-h-[90vh] w-full max-w-[58rem] flex-col overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_30px_100px_rgba(26,14,7,0.28)] lg:flex-row">
          <button
            aria-label="Fechar modal"
            className="absolute right-4 top-4 z-10 rounded-full border border-white/50 bg-white/80 px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] backdrop-blur-sm transition hover:bg-white"
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>

          <div className="relative h-52 w-full shrink-0 overflow-hidden bg-[var(--background)] lg:h-auto lg:w-[42%]">
            <Image
              alt={item.name}
              className="object-cover"
              fill
              sizes="(max-width: 1024px) 100vw, 420px"
              src={resolveMenuItemImage(item.imageUrl)}
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[rgba(20,12,6,0.72)] to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">{categoryName}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{item.name}</h2>
              <p className="mt-3 text-xl font-semibold text-[var(--brand-orange)]">
                {formatMoney(Number(item.price) + optionDelta)}
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-6">
            <div>
              <p className="eyebrow text-[var(--muted)]">Montar lancamento</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                {item.description || "Sem ingredientes detalhados. Ajuste o item e lance a observacao se precisar."}
              </p>
            </div>

            {item.optionGroups.length ? (
              <div className="mt-6 space-y-4">
                {item.optionGroups.map((group) => {
                  const current = selectedOptions[group.id] || [];
                  const singleChoice = group.maxSelections === 1;

                  return (
                    <section
                      className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4"
                      key={group.id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">{group.name}</h3>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {group.description || (singleChoice ? "Escolha uma opcao." : "Selecione os complementos desejados.")}
                          </p>
                        </div>
                        <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                          {group.isRequired ? "Obrigatorio" : "Opcional"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {group.options.map((option) => {
                          const selected = current.includes(option.id);
                          return (
                            <button
                              className={`rounded-[1.15rem] border px-3 py-3 text-left transition ${selected
                                ? "border-[var(--brand-green)]/30 bg-[var(--brand-green)]/10"
                                : "border-[var(--line)] bg-white hover:border-[var(--brand-orange)]/25 hover:bg-[var(--surface)]"
                              }`}
                              key={option.id}
                              onClick={() => toggleOption(group.id, option.id, group.maxSelections)}
                              type="button"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-[var(--foreground)]">{option.name}</p>
                                  {option.description ? (
                                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{option.description}</p>
                                  ) : null}
                                </div>
                                <span className="text-sm font-semibold text-[var(--brand-orange-dark)]">
                                  {Number(option.priceDelta) > 0 ? `+${formatMoney(option.priceDelta)}` : "incluido"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 lg:grid-cols-[0.48fr_1fr]">
              <section className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Quantidade</p>
                <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-white p-1">
                  <button
                    className="h-10 w-10 rounded-full text-lg font-semibold text-[var(--muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    type="button"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center text-lg font-semibold text-[var(--foreground)]">{quantity}</span>
                  <button
                    className="h-10 w-10 rounded-full text-lg font-semibold text-[var(--muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                    onClick={() => setQuantity((current) => Math.min(99, current + 1))}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </section>

              <label className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Observacao do item</span>
                <textarea
                  className="mt-3 h-28 w-full resize-none rounded-[1rem] border border-[var(--line)] bg-white px-3 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/60 focus:border-[var(--brand-orange)]/35"
                  maxLength={180}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Ex: sem cebola, molho a parte, dividir em 2 pratos..."
                  value={notes}
                />
              </label>
            </div>

            {validationError || error ? (
              <div className="mt-4 rounded-[1.3rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {validationError || error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">Subtotal deste lancamento</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-[var(--brand-orange-dark)]">
                  {formatMoney(totalPrice)}
                </p>
              </div>
              <button
                className="rounded-full bg-[var(--brand-green)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-green-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading || Boolean(validationError)}
                onClick={() => void handleSubmit()}
                type="button"
              >
                {loading ? "Lancando item..." : "Lancar na comanda"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
