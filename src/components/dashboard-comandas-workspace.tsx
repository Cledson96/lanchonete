"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { ComandaEntryList } from "@/components/comanda-entry-list";
import { ComandaMenuLauncher } from "@/components/comanda-menu-launcher";
import {
  canEditComanda,
  humanizeComandaStatus,
  humanizePaymentMethod,
  statusTone,
  type ComandaDetail,
  type PaymentMethod,
  type PublicMenuCategory,
} from "@/lib/comanda-ui";
import { formatMoney } from "@/lib/utils";

type CreateModalState = {
  open: boolean;
  name: string;
  notes: string;
  error: string | null;
  loading: boolean;
};

const paymentMethods: Array<{ value: Exclude<PaymentMethod, null>; label: string }> = [
  { value: "pix", label: "Pix" },
  { value: "cartao_credito", label: "Cartao de credito" },
  { value: "cartao_debito", label: "Cartao de debito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "outro", label: "Outro" },
];

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

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function sortCommandas(commandas: ComandaDetail[]) {
  return [...commandas].sort((left, right) => {
    const activeRank = canEditComanda(left.status) === canEditComanda(right.status)
      ? 0
      : canEditComanda(left.status)
        ? -1
        : 1;

    if (activeRank !== 0) {
      return activeRank;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function ComandaShareCard({ slug }: { slug: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const publicUrl = typeof window === "undefined"
    ? `/comanda/${slug}`
    : `${window.location.origin}/comanda/${slug}`;

  useEffect(() => {
    let active = true;

    void QRCode.toDataURL(publicUrl, {
      margin: 1,
      width: 320,
      color: {
        dark: "#1f4d3f",
        light: "#FFF8F1",
      },
    }).then((value) => {
      if (active) {
        setQrDataUrl(value);
      }
    }).catch(() => {
      if (active) {
        setQrDataUrl(null);
      }
    });

    return () => {
      active = false;
    };
  }, [publicUrl]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyFeedback("Link copiado.");
      window.setTimeout(() => setCopyFeedback(null), 1800);
    } catch {
      setCopyFeedback("Nao foi possivel copiar agora.");
      window.setTimeout(() => setCopyFeedback(null), 1800);
    }
  }

  return (
    <section className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--background)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-[var(--muted)]">Compartilhar com o cliente</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">QR e link da comanda</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            O cliente pode escanear ou abrir este link para acompanhar a parcial e lancar novos itens na mesma comanda.
          </p>
        </div>
        <button
          className="rounded-full border border-[var(--brand-orange)]/20 bg-[var(--brand-orange)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
          onClick={() => void handleCopy()}
          type="button"
        >
          Copiar link
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[13rem_1fr]">
        <div className="rounded-[1.4rem] border border-[var(--line)] bg-white p-3">
          {qrDataUrl ? (
            <Image alt="QR code da comanda" className="h-auto w-full rounded-[1rem]" height={320} src={qrDataUrl} width={320} />
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-[1rem] border border-dashed border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--muted)]">
              Gerando QR...
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Link publico</p>
            <p className="mt-2 break-all text-sm leading-6 text-[var(--foreground)]">{publicUrl}</p>
          </div>
          <a
            className="inline-flex rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
            href={publicUrl}
            rel="noreferrer"
            target="_blank"
          >
            Abrir comanda publica
          </a>
          {copyFeedback ? (
            <div className="rounded-[1.2rem] border border-[var(--brand-green)]/20 bg-[var(--brand-green)]/10 px-4 py-3 text-sm text-[var(--brand-green-dark)]">
              {copyFeedback}
            </div>
          ) : null}
          <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
            A rota publica fica aberta em <span className="font-semibold text-[var(--foreground)]">/comanda/{slug}</span>.
          </div>
        </div>
      </div>
    </section>
  );
}

export function DashboardComandasWorkspace() {
  const [commandas, setCommandas] = useState<ComandaDetail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedComanda, setSelectedComanda] = useState<ComandaDetail | null>(null);
  const [categories, setCategories] = useState<PublicMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [closingPaymentMethod, setClosingPaymentMethod] = useState<Exclude<PaymentMethod, null>>("pix");
  const [closing, setClosing] = useState(false);
  const [createModal, setCreateModal] = useState<CreateModalState>({
    open: false,
    name: "",
    notes: "",
    error: null,
    loading: false,
  });

  const activeCommandas = useMemo(() => sortCommandas(commandas), [commandas]);

  const refreshList = useCallback(async (keepSelection = true) => {
    const [commandasResponse, menuResponse] = await Promise.all([
      fetch("/api/dashboard/comandas", { cache: "no-store" }),
      fetch("/api/menu", { cache: "no-store" }),
    ]);

    const commandasPayload = await parseJson<{ commandas: ComandaDetail[] }>(commandasResponse);
    const menuPayload = await parseJson<{ categories: PublicMenuCategory[] }>(menuResponse);
    setCommandas(commandasPayload.commandas);
    setCategories(menuPayload.categories);

    if (keepSelection && selectedId) {
      const current = commandasPayload.commandas.find((item) => item.id === selectedId) || null;
      setSelectedComanda(current);
    }
  }, [selectedId]);

  const openComanda = useCallback(async (id: string) => {
    try {
      setSelectedId(id);
      setDetailLoading(true);
      setDetailError(null);
      const response = await fetch(`/api/comandas/${id}`, { cache: "no-store" });
      const payload = await parseJson<{ comanda: ComandaDetail }>(response);
      setSelectedComanda(payload.comanda);
    } catch (nextError) {
      setDetailError(nextError instanceof Error ? nextError.message : "Nao foi possivel carregar a comanda.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        await refreshList(false);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Nao foi possivel carregar as comandas.");
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshList]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshList(true).catch(() => undefined);
    }, 7000);

    return () => window.clearInterval(interval);
  }, [refreshList]);

  useEffect(() => {
    if (!selectedId && activeCommandas[0]) {
      void openComanda(activeCommandas[0].id);
    }
  }, [activeCommandas, openComanda, selectedId]);

  async function handleCreateComanda() {
    try {
      setCreateModal((current) => ({ ...current, loading: true, error: null }));
      const response = await fetch("/api/dashboard/comandas", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: createModal.name,
          notes: createModal.notes,
        }),
      });
      const payload = await parseJson<{ comanda: ComandaDetail }>(response);
      await refreshList(false);
      setCreateModal({ open: false, name: "", notes: "", error: null, loading: false });
      setFeedback(`Comanda ${payload.comanda.code} aberta com sucesso.`);
      void openComanda(payload.comanda.id);
    } catch (nextError) {
      setCreateModal((current) => ({
        ...current,
        loading: false,
        error: nextError instanceof Error ? nextError.message : "Nao foi possivel abrir a comanda.",
      }));
    }
  }

  async function handleAddItem(input: {
    menuItemId: string;
    quantity: number;
    notes?: string;
    optionItemIds: string[];
  }) {
    if (!selectedComanda) {
      return;
    }

    const response = await fetch(`/api/comandas/${selectedComanda.id}/items`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        items: [input],
      }),
    });
    const payload = await parseJson<{ comanda: ComandaDetail }>(response);
    setSelectedComanda(payload.comanda);
    await refreshList(false);
    setFeedback(`Item lancado na comanda ${payload.comanda.code}.`);
  }

  async function handleCloseComanda() {
    if (!selectedComanda) {
      return;
    }

    try {
      setClosing(true);
      setDetailError(null);
      const response = await fetch(`/api/dashboard/comandas/${selectedComanda.id}/close`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ paymentMethod: closingPaymentMethod }),
      });
      const payload = await parseJson<{ comanda: ComandaDetail }>(response);
      setSelectedComanda(payload.comanda);
      await refreshList(false);
      setFeedback(`Comanda ${payload.comanda.code} fechada com ${humanizePaymentMethod(payload.comanda.paymentMethod)}.`);
    } catch (nextError) {
      setDetailError(nextError instanceof Error ? nextError.message : "Nao foi possivel fechar a comanda.");
    } finally {
      setClosing(false);
    }
  }

  return (
    <main className="space-y-6 text-[var(--foreground)]">
      <section className="panel rounded-[2rem] bg-[var(--surface)] p-6 shadow-sm transition hover:border-[var(--brand-orange)]/25 hover:shadow-md">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="eyebrow mb-3 text-[var(--muted)]">Salao em tempo real</p>
            <h1 className="text-3xl font-semibold tracking-tight">Comandas ativas</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Abra comandas pelo nome do cliente, compartilhe o QR na mesa e acompanhe a parcial sem sair desta tela.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              className="rounded-full border border-[var(--line)] bg-[var(--background)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              onClick={() => {
                setLoading(true);
                void refreshList(true).finally(() => setLoading(false));
              }}
              type="button"
            >
              Atualizar
            </button>
            <button
              className="rounded-full bg-[var(--brand-orange)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
              onClick={() => setCreateModal({ open: true, name: "", notes: "", error: null, loading: false })}
              type="button"
            >
              Abrir comanda
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {feedback ? (
        <div className="rounded-[1.4rem] border border-[var(--brand-green)]/20 bg-[var(--brand-green)]/10 px-4 py-3 text-sm text-[var(--brand-green-dark)]">{feedback}</div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <aside className="panel rounded-[1.8rem] bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-2 pb-4">
            <div>
              <p className="text-lg font-semibold tracking-tight text-[var(--foreground)]">Fila de comandas</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Abertas primeiro, com parcial e ultimos lancamentos.</p>
            </div>
            <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {activeCommandas.length} ativas
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--background)] px-4 py-6 text-sm text-[var(--muted)]">
                Carregando comandas...
              </div>
            ) : activeCommandas.length ? (
              activeCommandas.map((comanda) => {
                const selected = selectedId === comanda.id;
                return (
                  <button
                    className={`block w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${selected
                      ? "border-[var(--brand-orange)]/28 bg-[var(--background)] shadow-sm"
                      : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--brand-orange)]/18 hover:bg-[var(--background)]"
                    }`}
                    key={comanda.id}
                    onClick={() => void openComanda(comanda.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{comanda.code}</p>
                        <h2 className="mt-2 text-lg font-semibold tracking-tight text-[var(--foreground)]">
                          {comanda.name || comanda.customerProfile?.fullName || "Cliente sem nome"}
                        </h2>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${statusTone(comanda.status)}`}>
                        {humanizeComandaStatus(comanda.status)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm text-[var(--muted)]">{comanda.entries.length} itens lancados</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">Atualizada em {formatDate(comanda.updatedAt)}</p>
                      </div>
                      <p className="text-xl font-semibold text-[var(--brand-orange-dark)]">{formatMoney(comanda.totalAmount)}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[var(--line)] bg-[var(--background)] px-4 py-8 text-sm text-[var(--muted)]">
                Nenhuma comanda aberta ainda. Abra a primeira para gerar um QR e comecar o salao.
              </div>
            )}
          </div>
        </aside>

        <section className="space-y-5">
          {detailLoading ? (
            <div className="panel rounded-[1.8rem] bg-[var(--surface)] p-6 text-sm text-[var(--muted)] shadow-sm">
              Carregando detalhe da comanda...
            </div>
          ) : selectedComanda ? (
            <>
              <section className="panel rounded-[1.8rem] bg-[var(--surface)] p-6 shadow-sm">
                <div className="flex flex-col gap-5 border-b border-[var(--line)] pb-5 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="eyebrow text-[var(--muted)]">Comanda {selectedComanda.code}</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                      {selectedComanda.name || selectedComanda.customerProfile?.fullName || "Cliente sem nome"}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                      {selectedComanda.notes || "Sem observacao geral. Use esta comanda para centralizar os lancamentos da mesa e compartilhar o link com o cliente."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Status</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{humanizeComandaStatus(selectedComanda.status)}</p>
                    </div>
                    <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Parcial</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--brand-orange-dark)]">{formatMoney(selectedComanda.totalAmount)}</p>
                    </div>
                    <div className="rounded-[1.3rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Itens</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{selectedComanda.entries.length}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Resumo operacional</p>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Aberta em</dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{formatDate(selectedComanda.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Aberta por</dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{selectedComanda.openedBy?.email || "Equipe"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Pagamento</dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{humanizePaymentMethod(selectedComanda.paymentMethod)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">Cliente vinculado</dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{selectedComanda.customerProfile?.fullName || "Somente nome da comanda"}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--background)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Fechamento</p>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                      Feche a comanda quando a mesa acertar o pagamento. Depois disso, o link publico para de aceitar novos lancamentos.
                    </p>
                    <div className="mt-4 space-y-3">
                      <select
                        className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-medium text-[var(--foreground)]"
                        onChange={(event) => setClosingPaymentMethod(event.target.value as Exclude<PaymentMethod, null>)}
                        value={closingPaymentMethod}
                      >
                        {paymentMethods.map((method) => (
                          <option key={method.value} value={method.value}>{method.label}</option>
                        ))}
                      </select>
                      <button
                        className="w-full rounded-full bg-[var(--brand-green)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-green-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={closing || !canEditComanda(selectedComanda.status)}
                        onClick={() => void handleCloseComanda()}
                        type="button"
                      >
                        {closing ? "Fechando comanda..." : "Fechar comanda"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {detailError ? (
                <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{detailError}</div>
              ) : null}

              <ComandaShareCard slug={selectedComanda.qrCodeSlug} />

              <section className="grid gap-5 2xl:grid-cols-[1.05fr_0.95fr]">
                <section className="panel rounded-[1.8rem] bg-[var(--surface)] p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
                    <div>
                      <p className="eyebrow text-[var(--muted)]">Parcial atual</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">Itens da comanda</h3>
                    </div>
                    <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      {selectedComanda.entries.length} lancados
                    </span>
                  </div>

                  <div className="mt-5">
                    <ComandaEntryList
                      emptyLabel="Nenhum item foi lancado ainda nesta comanda."
                      entries={selectedComanda.entries}
                    />
                  </div>
                </section>

                <section className="panel rounded-[1.8rem] bg-[var(--surface)] p-5 shadow-sm">
                  <div className="border-b border-[var(--line)] pb-4">
                    <p className="eyebrow text-[var(--muted)]">Lancamento manual</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">Adicionar itens pela equipe</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      Use esta area para lancar pedidos do cliente diretamente na comanda. O mesmo link publico tambem fica disponivel para a mesa.
                    </p>
                  </div>

                  <div className="mt-5">
                    <ComandaMenuLauncher
                      categories={categories}
                      disabled={!canEditComanda(selectedComanda.status)}
                      disabledMessage="Esta comanda ja foi encerrada e nao aceita novos lancamentos."
                      onAddItem={handleAddItem}
                    />
                  </div>
                </section>
              </section>
            </>
          ) : (
            <div className="panel rounded-[1.8rem] bg-[var(--surface)] p-8 text-sm text-[var(--muted)] shadow-sm">
              Selecione uma comanda para ver o detalhe ou abra uma nova para gerar o primeiro QR do salao.
            </div>
          )}
        </section>
      </section>

      {createModal.open ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(31,18,10,0.5)] p-4 backdrop-blur-sm">
          <button
            aria-label="Fechar modal de abertura"
            className="absolute inset-0"
            onClick={() => {
              if (!createModal.loading) {
                setCreateModal({ open: false, name: "", notes: "", error: null, loading: false });
              }
            }}
            type="button"
          />

          <div className="relative z-10 w-full max-w-[34rem] rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_24px_80px_rgba(26,14,7,0.22)]">
            <p className="eyebrow text-[var(--muted)]">Nova comanda</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">Abrir comanda do salao</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Informe o nome do cliente. O sistema gera o codigo, o slug do QR e abre o detalhe da comanda em seguida.
            </p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Nome do cliente</span>
                <input
                  autoFocus
                  className="mt-2 w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand-orange)]/30"
                  onChange={(event) => setCreateModal((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex: Mesa da Julia"
                  value={createModal.name}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Observacao da comanda</span>
                <textarea
                  className="mt-2 h-28 w-full resize-none rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--brand-orange)]/30"
                  onChange={(event) => setCreateModal((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Ex: aniversariante, mesa do fundo, dividir a conta depois..."
                  value={createModal.notes}
                />
              </label>
            </div>

            {createModal.error ? (
              <div className="mt-4 rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{createModal.error}</div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:justify-end">
              <button
                className="rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
                onClick={() => setCreateModal({ open: false, name: "", notes: "", error: null, loading: false })}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="rounded-full bg-[var(--brand-orange)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={createModal.loading || createModal.name.trim().length < 2}
                onClick={() => void handleCreateComanda()}
                type="button"
              >
                {createModal.loading ? "Abrindo comanda..." : "Abrir comanda"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
