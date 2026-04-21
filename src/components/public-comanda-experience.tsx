"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ComandaEntryList } from "@/components/comanda-entry-list";
import { ComandaMenuLauncher } from "@/components/comanda-menu-launcher";
import {
  canEditComanda,
  humanizeComandaStatus,
  statusTone,
  type ComandaDetail,
  type PublicMenuCategory,
} from "@/lib/comanda-ui";
import { formatMoney } from "@/lib/utils";

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & {
    error?: {
      message?: string;
    };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || "Nao foi possivel concluir a acao.");
  }

  return payload;
}

type Props = {
  slug: string;
};

export function PublicComandaExperience({ slug }: Props) {
  const [comanda, setComanda] = useState<ComandaDetail | null>(null);
  const [categories, setCategories] = useState<PublicMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [comandaResponse, menuResponse] = await Promise.all([
      fetch(`/api/comandas/slug/${slug}`, { cache: "no-store" }),
      fetch("/api/menu", { cache: "no-store" }),
    ]);

    const comandaPayload = await parseJson<{ comanda: ComandaDetail }>(comandaResponse);
    const menuPayload = await parseJson<{ categories: PublicMenuCategory[] }>(menuResponse);
    setComanda(comandaPayload.comanda);
    setCategories(menuPayload.categories);
  }, [slug]);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        await refresh();
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Nao foi possivel abrir a comanda.");
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  useEffect(() => {
    if (!comanda) return;
    if (!canEditComanda(comanda.status)) return;

    let consecutiveErrors = 0;
    const interval = window.setInterval(() => {
      void refresh()
        .then(() => {
          consecutiveErrors = 0;
        })
        .catch(() => {
          consecutiveErrors++;
          if (consecutiveErrors >= 5) {
            window.clearInterval(interval);
          }
        });
    }, 7000);

    return () => window.clearInterval(interval);
  }, [refresh, comanda]);

  async function handleAddItem(input: {
    menuItemId: string;
    quantity: number;
    notes?: string;
    optionItemIds: string[];
    ingredientCustomizations: Record<string, number>;
  }) {
    if (!comanda) {
      return;
    }

    const requestPayload = {
      ...input,
      ingredients: Object.entries(input.ingredientCustomizations || {}).map(([ingredientId, quantity]) => ({
        ingredientId,
        quantity,
      })),
    };

    const response = await fetch(`/api/comandas/${comanda.id}/items`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ items: [requestPayload] }),
    });
    const payload = await parseJson<{ comanda: ComandaDetail }>(response);
    setComanda(payload.comanda);
    setFeedback("Item adicionado na comanda.");
    window.setTimeout(() => setFeedback(null), 1800);
  }

  const canLaunch = useMemo(() => (comanda ? canEditComanda(comanda.status) : false), [comanda]);

  if (loading) {
    return (
      <main className="shell py-12">
        <section className="panel rounded-[2rem] p-6 text-sm text-[var(--muted)]">Carregando comanda...</section>
      </main>
    );
  }

  if (error || !comanda) {
    return (
      <main className="shell py-12">
        <section className="panel rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Comanda nao encontrada."}
        </section>
      </main>
    );
  }

  return (
    <main className="shell py-10 text-[var(--foreground)]">
      <div className="space-y-6">
        <section className="rounded-[2.2rem] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow text-[var(--muted)]">Comanda da mesa</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
                {comanda.name || "Comanda do cliente"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                {comanda.notes || "Use esta tela para acompanhar a parcial e adicionar novos itens direto para a cozinha."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Codigo</p>
                <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{comanda.code}</p>
              </div>
              <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Status</p>
                <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone(comanda.status)}`}>
                  {humanizeComandaStatus(comanda.status)}
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Parcial</p>
                <p className="mt-2 text-lg font-semibold text-[var(--brand-orange-dark)]">{formatMoney(comanda.totalAmount)}</p>
              </div>
            </div>
          </div>
        </section>

        {feedback ? (
          <div className="rounded-[1.4rem] border border-[var(--brand-green)]/20 bg-[var(--brand-green)]/10 px-4 py-3 text-sm text-[var(--brand-green-dark)]">
            {feedback}
          </div>
        ) : null}

        {!canLaunch ? (
          <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Esta comanda foi encerrada e nao aceita novos itens.
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[1.04fr_0.96fr]">
          <section className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
              <div>
                <p className="eyebrow text-[var(--muted)]">Parcial acumulada</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">Itens ja lancados</h2>
              </div>
              <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                {comanda.entries.length} itens
              </span>
            </div>

            <div className="mt-5">
              <ComandaEntryList
                emptyLabel="Nenhum item foi lancado ainda nesta comanda."
                entries={comanda.entries}
              />
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="border-b border-[var(--line)] pb-4">
              <p className="eyebrow text-[var(--muted)]">Novo lancamento</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">Adicionar mais itens</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Escolha a categoria, abra o item e confirme a quantidade. O lancamento entra direto na mesma comanda.
              </p>
            </div>

            <div className="mt-5">
              <ComandaMenuLauncher
                categories={categories}
                disabled={!canLaunch}
                disabledMessage="A comanda esta encerrada e nao recebe novos itens."
                onAddItem={handleAddItem}
              />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
