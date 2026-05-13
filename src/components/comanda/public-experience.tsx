"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ComandaEntryList } from "@/components/comanda/entry-list";
import { ComandaMenuLauncher } from "@/components/comanda/menu-launcher";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import type { PublicMenuCategory, PublicMenuResponse } from "@/lib/contracts/menu";
import {
  canEditComanda,
  humanizeComandaStatus,
  statusTone,
  type ComandaDetail,
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
    const menuPayload = await parseJson<PublicMenuResponse>(menuResponse);
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
        <section className="panel rounded-[2rem] p-6"><Typography tone="muted" variant="body-sm">Carregando comanda...</Typography></section>
      </main>
    );
  }

  if (error || !comanda) {
    return (
      <main className="shell py-12">
        <Alert className="panel rounded-[2rem] p-6 text-sm font-normal" tone="error">{error || "Comanda nao encontrada."}</Alert>
      </main>
    );
  }

  return (
    <main className="shell py-10 text-[var(--foreground)]">
      <div className="space-y-6">
        <section className="rounded-[2.2rem] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Typography tone="muted" variant="eyebrow">Comanda da mesa</Typography>
              <Typography as="h1" className="mt-2 text-4xl" variant="title-lg">
                {comanda.name || "Comanda do cliente"}
              </Typography>
              <Typography className="mt-3 max-w-2xl leading-6" tone="muted" variant="body-sm">
                {comanda.notes || "Use esta tela para acompanhar a parcial e adicionar novos itens direto para a cozinha."}
              </Typography>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                <Typography tone="muted" variant="caption-sm">Codigo</Typography>
                <Typography className="mt-2" variant="title-md">{comanda.code}</Typography>
              </div>
              <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                <Typography tone="muted" variant="caption-sm">Status</Typography>
                <Badge className={`mt-2 border px-3 py-1 text-xs uppercase tracking-[0.18em] ${statusTone(comanda.status)}`}>
                  {humanizeComandaStatus(comanda.status)}
                </Badge>
              </div>
              <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                <Typography tone="muted" variant="caption-sm">Parcial</Typography>
                <Typography className="mt-2" tone="orange" variant="title-md">{formatMoney(comanda.totalAmount)}</Typography>
              </div>
            </div>
          </div>
        </section>

        {feedback ? (
          <Alert className="rounded-[1.4rem] px-4 py-3 text-sm font-normal" tone="success">{feedback}</Alert>
        ) : null}

        {!canLaunch ? (
          <Alert className="rounded-[1.4rem] px-4 py-3 text-sm font-normal" tone="warning">Esta comanda foi encerrada e nao aceita novos itens.</Alert>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[1.04fr_0.96fr]">
          <section className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
              <div>
                <Typography tone="muted" variant="eyebrow">Parcial acumulada</Typography>
                <Typography as="h2" className="mt-2" variant="title-lg">Itens ja lancados</Typography>
              </div>
              <Badge className="border px-3 py-1 text-xs uppercase tracking-[0.18em]">
                {comanda.entries.length} itens
              </Badge>
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
              <Typography tone="muted" variant="eyebrow">Novo lancamento</Typography>
              <Typography as="h2" className="mt-2" variant="title-lg">Adicionar mais itens</Typography>
              <Typography className="mt-2 leading-6" tone="muted" variant="body-sm">
                Escolha a categoria, abra o item e confirme a quantidade. O lancamento entra direto na mesma comanda.
              </Typography>
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
