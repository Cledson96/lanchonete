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
  { value: "cartao_credito", label: "Cartão de crédito" },
  { value: "cartao_debito", label: "Cartão de débito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "outro", label: "Outro" },
];

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & {
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || "Não foi possível concluir a ação.");
  }
  return payload;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatElapsed(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours < 24) return rem ? `${hours}h ${rem}min` : `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function describeComandaProgress(comanda: ComandaDetail) {
  if (comanda.operationalSummary.isFullyDelivered) return "Todos entregues";
  if (comanda.operationalSummary.isFullyReady) return "Todos prontos";
  if (comanda.operationalSummary.isPartiallyDelivered) return "Entrega parcial";
  if (comanda.operationalSummary.isPartiallyReady) return "Parcial pronta";
  if (comanda.operationalSummary.preparingUnits > 0) return "Em preparo";
  return "Aguardando preparo";
}

function sortCommandas(commandas: ComandaDetail[]) {
  return [...commandas].sort((left, right) => {
    const leftActive = canEditComanda(left.status);
    const rightActive = canEditComanda(right.status);
    if (leftActive !== rightActive) return leftActive ? -1 : 1;
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

/* ─────────── Ícones ─────────── */

function CloseIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="h-4 w-4">
      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" className="h-4 w-4">
      <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="h-4 w-4">
      <path d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM13.5 13.5h1.5v1.5h-1.5zM19.5 13.5h1.5v1.5h-1.5zM13.5 19.5h1.5v1.5h-1.5zM19.5 19.5h1.5v1.5h-1.5zM16.5 16.5h1.5v1.5h-1.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="h-4 w-4">
      <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="h-4 w-4">
      <path d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────── QR Modal ─────────── */

function QrShareModal({ slug, comandaName, onClose }: { slug: string; comandaName: string; onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const publicUrl = typeof window === "undefined" ? `/comanda/${slug}` : `${window.location.origin}/comanda/${slug}`;

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(publicUrl, {
      margin: 1,
      width: 320,
      color: { dark: "#1f4d3f", light: "#FFF8F1" },
    })
      .then((value) => { if (active) setQrDataUrl(value); })
      .catch(() => { if (active) setQrDataUrl(null); });
    return () => { active = false; };
  }, [publicUrl]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyFeedback("Link copiado!");
      window.setTimeout(() => setCopyFeedback(null), 1800);
    } catch {
      setCopyFeedback("Não foi possível copiar agora.");
      window.setTimeout(() => setCopyFeedback(null), 1800);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(45,24,11,0.4)] p-4 backdrop-blur-[3px]">
      <button aria-label="Fechar" className="absolute inset-0" onClick={onClose} type="button" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Compartilhar comanda</p>
            <h3 className="mt-0.5 text-lg font-bold leading-tight">{comandaName}</h3>
          </div>
          <button
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--background)]"
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="rounded-xl border border-[var(--line)] bg-white p-3">
            {qrDataUrl ? (
              <Image alt="QR code" className="h-56 w-56" height={224} src={qrDataUrl} width={224} />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center border border-dashed border-[var(--line)] text-sm text-[var(--muted)]">
                Gerando…
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-[var(--background)] p-2.5 text-xs">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Link público</p>
          <p className="mt-1 break-all font-mono text-[0.7rem] text-[var(--foreground)]">{publicUrl}</p>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--brand-orange)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-orange-dark)]"
            onClick={() => void handleCopy()}
            type="button"
          >
            <CopyIcon />
            {copyFeedback ?? "Copiar link"}
          </button>
          <a
            className="flex items-center justify-center rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background)]"
            href={publicUrl}
            rel="noreferrer"
            target="_blank"
          >
            Abrir
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Close Modal ─────────── */

function CloseComandaModal({
  comanda,
  closing,
  error,
  onClose,
  onConfirm,
  method,
  setMethod,
}: {
  comanda: ComandaDetail;
  closing: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
  method: Exclude<PaymentMethod, null>;
  setMethod: (m: Exclude<PaymentMethod, null>) => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !closing) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closing, onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(45,24,11,0.4)] p-4 backdrop-blur-[3px]">
      <button aria-label="Fechar" className="absolute inset-0" disabled={closing} onClick={onClose} type="button" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--line)] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Fechar comanda</p>
            <h3 className="mt-0.5 text-lg font-bold leading-tight">{comanda.name || "Cliente"}</h3>
          </div>
          <button
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--background)]"
            disabled={closing}
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-4 rounded-lg bg-[var(--brand-orange)]/5 p-3">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Total a cobrar</p>
          <p className="text-2xl font-bold text-[var(--brand-orange-dark)]">
            {formatMoney(comanda.totalAmount)}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Forma de pagamento</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {paymentMethods.map((pm) => (
              <button
                key={pm.value}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  method === pm.value
                    ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]"
                    : "border-[var(--line)] bg-white text-[var(--foreground)] hover:border-[var(--brand-orange)]/40"
                }`}
                onClick={() => setMethod(pm.value)}
                type="button"
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button
            className="flex-1 rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background)] disabled:opacity-50"
            disabled={closing}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="flex-1 rounded-full bg-[var(--brand-green)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-green-dark)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={closing}
            onClick={onConfirm}
            type="button"
          >
            {closing ? "Fechando…" : "Confirmar fechamento"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Main workspace ─────────── */

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
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
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
      setDetailError(nextError instanceof Error ? nextError.message : "Não foi possível carregar a comanda.");
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
        setError(nextError instanceof Error ? nextError.message : "Não foi possível carregar as comandas.");
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

  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(id);
  }, [feedback]);

  async function handleCreateComanda() {
    try {
      setCreateModal((current) => ({ ...current, loading: true, error: null }));
      const response = await fetch("/api/dashboard/comandas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: createModal.name, notes: createModal.notes }),
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
        error: nextError instanceof Error ? nextError.message : "Não foi possível abrir a comanda.",
      }));
    }
  }

  async function handleAddItem(input: {
    menuItemId: string;
    quantity: number;
    notes?: string;
    optionItemIds: string[];
  }) {
    if (!selectedComanda) return;
    const response = await fetch(`/api/comandas/${selectedComanda.id}/items`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: [input] }),
    });
    const payload = await parseJson<{ comanda: ComandaDetail }>(response);
    setSelectedComanda(payload.comanda);
    await refreshList(false);
    setFeedback(`Item lançado na comanda ${payload.comanda.code}.`);
    setAddItemModalOpen(false);
  }

  async function handleCloseComanda() {
    if (!selectedComanda) return;
    try {
      setClosing(true);
      setDetailError(null);
      const response = await fetch(`/api/dashboard/comandas/${selectedComanda.id}/close`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paymentMethod: closingPaymentMethod }),
      });
      const payload = await parseJson<{ comanda: ComandaDetail }>(response);
      setSelectedComanda(payload.comanda);
      await refreshList(false);
      setCloseModalOpen(false);
      setFeedback(`Comanda ${payload.comanda.code} fechada com ${humanizePaymentMethod(payload.comanda.paymentMethod)}.`);
    } catch (nextError) {
      setDetailError(nextError instanceof Error ? nextError.message : "Não foi possível fechar a comanda.");
    } finally {
      setClosing(false);
    }
  }

  const canEdit = selectedComanda ? canEditComanda(selectedComanda.status) : false;

  return (
    <main className="space-y-4 text-[var(--foreground)]">

      {/* ─── Header compacto ─── */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow text-[var(--muted)]">Salão em tempo real</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Comandas</h1>
          <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
            Abra comandas, compartilhe o QR e acompanhe a parcial sem sair da tela.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            aria-label="Atualizar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] transition hover:bg-[var(--background-strong)]"
            onClick={() => { setLoading(true); void refreshList(true).finally(() => setLoading(false)); }}
            type="button"
          >
            <RefreshIcon />
          </button>
          <button
            className="flex items-center gap-1.5 rounded-full bg-[var(--brand-orange)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
            onClick={() => setCreateModal({ open: true, name: "", notes: "", error: null, loading: false })}
            type="button"
          >
            <PlusIcon />
            Abrir comanda
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div>
      ) : null}
      {feedback ? (
        <div className="rounded-xl border border-[var(--brand-green)]/30 bg-[var(--brand-green)]/10 px-4 py-2 text-xs font-medium text-[var(--brand-green-dark)]">{feedback}</div>
      ) : null}

      {/* ─── Grid: lista + detalhe ─── */}
      <section className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">

        {/* Coluna: fila de comandas */}
        <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-sm">
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-sm font-bold tracking-tight">Fila</p>
            <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]">
              {activeCommandas.length}
            </span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="rounded-xl border border-dashed border-[var(--line)] px-3 py-6 text-center text-xs text-[var(--muted)]">
                Carregando…
              </div>
            ) : activeCommandas.length ? (
              activeCommandas.map((comanda) => {
                const selected = selectedId === comanda.id;
                const active = canEditComanda(comanda.status);
                const entryCount = comanda.entries.reduce((sum, e) => sum + e.quantity, 0);
                const progressLabel = describeComandaProgress(comanda);

                return (
                  <button
                    className={`block w-full overflow-hidden rounded-xl border text-left transition ${selected
                      ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/5 shadow-sm"
                      : active
                        ? "border-[var(--line)] bg-white hover:border-[var(--brand-orange)]/40 hover:shadow-sm"
                        : "border-[var(--line)] bg-[var(--background)] opacity-70 hover:opacity-100"
                    }`}
                    key={comanda.id}
                    onClick={() => void openComanda(comanda.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                          {comanda.code.slice(0, 8)}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold leading-tight">
                          {comanda.name || comanda.customerProfile?.fullName || "Sem nome"}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="rounded-full bg-[var(--background)] px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--muted)]">
                            {progressLabel}
                          </span>
                          <span className="rounded-full bg-[var(--brand-green)]/12 px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--brand-green-dark)]">
                            {comanda.operationalSummary.readyOrDeliveredUnits}/{comanda.operationalSummary.activeUnits} prontos
                          </span>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[0.6rem] font-semibold ${statusTone(comanda.status)}`}>
                        {humanizeComandaStatus(comanda.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-[var(--line)] bg-[var(--background)]/50 px-3 py-2">
                      <p className="text-[0.7rem] text-[var(--muted)]">
                        {entryCount} {entryCount === 1 ? "item" : "itens"} · {formatElapsed(comanda.updatedAt)}
                      </p>
                      <p className="text-sm font-bold text-[var(--brand-orange-dark)]">
                        {formatMoney(comanda.totalAmount)}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--line)] px-3 py-8 text-center text-xs text-[var(--muted)]">
                Nenhuma comanda aberta.<br />Abra a primeira para gerar um QR.
              </div>
            )}
          </div>
        </aside>

        {/* Coluna: detalhe */}
        <section className="space-y-4">
          {detailLoading ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-8 text-center text-sm text-[var(--muted)] shadow-sm">
              Carregando detalhe…
            </div>
          ) : selectedComanda ? (
            <>
              {/* Header da comanda */}
              <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                        {selectedComanda.code.slice(0, 8)}
                      </p>
                      <span className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold ${statusTone(selectedComanda.status)}`}>
                        {humanizeComandaStatus(selectedComanda.status)}
                      </span>
                    </div>
                    <h2 className="mt-1 truncate text-xl font-bold tracking-tight">
                      {selectedComanda.name || selectedComanda.customerProfile?.fullName || "Sem nome"}
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      Aberta em {formatDate(selectedComanda.createdAt)}
                      {selectedComanda.openedBy?.email ? ` · por ${selectedComanda.openedBy.email}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--brand-orange)]/40 hover:bg-[var(--brand-orange)]/5"
                      onClick={() => setQrModalOpen(true)}
                      type="button"
                    >
                      <QrIcon />
                      QR da mesa
                    </button>
                    {canEdit ? (
                      <button
                        className="rounded-full bg-[var(--brand-green)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-green-dark)]"
                        onClick={() => setCloseModalOpen(true)}
                        type="button"
                      >
                        Fechar comanda
                      </button>
                    ) : (
                      <span className="rounded-full bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--muted)]">
                        Encerrada · {humanizePaymentMethod(selectedComanda.paymentMethod)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
                  <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--muted)]">
                    {describeComandaProgress(selectedComanda)}
                  </span>
                  <span className="rounded-full bg-[var(--brand-green)]/12 px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--brand-green-dark)]">
                    {selectedComanda.operationalSummary.readyOrDeliveredUnits}/{selectedComanda.operationalSummary.activeUnits} prontos
                  </span>
                  {selectedComanda.operationalSummary.deliveredUnits > 0 ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-700">
                      {selectedComanda.operationalSummary.deliveredUnits} entregue(s)
                    </span>
                  ) : null}
                </div>

                {/* KPIs financeiros */}
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--line)] pt-4">
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Subtotal</p>
                    <p className="mt-0.5 text-sm font-semibold">{formatMoney(selectedComanda.subtotalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Desconto</p>
                    <p className="mt-0.5 text-sm font-semibold">{formatMoney(selectedComanda.discountAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Total</p>
                    <p className="mt-0.5 text-lg font-bold text-[var(--brand-orange-dark)]">
                      {formatMoney(selectedComanda.totalAmount)}
                    </p>
                  </div>
                </div>

                {selectedComanda.notes ? (
                  <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <span className="font-bold">Obs: </span>{selectedComanda.notes}
                  </div>
                ) : null}
              </section>

              {detailError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{detailError}</div>
              ) : null}

              {/* Itens lançados */}
              <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold tracking-tight">Itens lançados</p>
                    <span className="rounded-full bg-[var(--brand-green)]/12 px-2 py-0.5 text-[0.65rem] font-bold text-[var(--brand-green-dark)]">
                      {selectedComanda.entries.reduce((sum, e) => sum + e.quantity, 0)} itens
                    </span>
                  </div>
                  {canEdit ? (
                    <button
                      className="flex items-center gap-1.5 rounded-full bg-[var(--brand-orange)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
                      onClick={() => setAddItemModalOpen(true)}
                      type="button"
                    >
                      <PlusIcon />
                      Adicionar item
                    </button>
                  ) : null}
                </div>
                <ComandaEntryList
                  emptyLabel='Nenhum item lançado. Clique em "Adicionar item" para começar.'
                  entries={selectedComanda.entries}
                />
              </section>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-12 text-center text-sm text-[var(--muted)] shadow-sm">
              Selecione uma comanda na fila ou abra uma nova para começar.
            </div>
          )}
        </section>
      </section>

      {/* ─── Modais ─── */}
      {qrModalOpen && selectedComanda ? (
        <QrShareModal
          comandaName={selectedComanda.name || selectedComanda.customerProfile?.fullName || "Comanda"}
          onClose={() => setQrModalOpen(false)}
          slug={selectedComanda.qrCodeSlug}
        />
      ) : null}

      {addItemModalOpen && selectedComanda ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(45,24,11,0.4)] backdrop-blur-[3px] sm:items-center sm:p-4">
          <button
            aria-label="Fechar"
            className="absolute inset-0"
            onClick={() => setAddItemModalOpen(false)}
            type="button"
          />
          <div className="relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-[var(--line)] bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-5 py-4">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Lançamento manual</p>
                <h3 className="mt-0.5 text-base font-bold leading-tight">
                  {selectedComanda.name || selectedComanda.customerProfile?.fullName || "Comanda"}
                </h3>
              </div>
              <button
                aria-label="Fechar"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--background)]"
                onClick={() => setAddItemModalOpen(false)}
                type="button"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <ComandaMenuLauncher
                categories={categories}
                disabled={!canEdit}
                disabledMessage="Esta comanda foi encerrada e não aceita novos lançamentos."
                onAddItem={handleAddItem}
              />
            </div>
          </div>
        </div>
      ) : null}

      {closeModalOpen && selectedComanda ? (
        <CloseComandaModal
          closing={closing}
          comanda={selectedComanda}
          error={detailError}
          method={closingPaymentMethod}
          onClose={() => { if (!closing) setCloseModalOpen(false); }}
          onConfirm={() => void handleCloseComanda()}
          setMethod={setClosingPaymentMethod}
        />
      ) : null}

      {createModal.open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(45,24,11,0.4)] p-4 backdrop-blur-[3px]">
          <button
            aria-label="Fechar"
            className="absolute inset-0"
            onClick={() => {
              if (!createModal.loading) setCreateModal({ open: false, name: "", notes: "", error: null, loading: false });
            }}
            type="button"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Nova comanda</p>
                <h2 className="mt-0.5 text-lg font-bold">Abrir comanda do salão</h2>
              </div>
              <button
                aria-label="Fechar"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--background)]"
                disabled={createModal.loading}
                onClick={() => setCreateModal({ open: false, name: "", notes: "", error: null, loading: false })}
                type="button"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Nome do cliente ou mesa</span>
                <input
                  autoFocus
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--brand-orange)]"
                  onChange={(event) => setCreateModal((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ex: Mesa da Julia"
                  value={createModal.name}
                />
              </label>

              <label className="block">
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Observação (opcional)</span>
                <textarea
                  className="mt-1 h-20 w-full resize-none rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--brand-orange)]"
                  onChange={(event) => setCreateModal((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Aniversariante, mesa do fundo, dividir a conta…"
                  value={createModal.notes}
                />
              </label>
            </div>

            {createModal.error ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{createModal.error}</div>
            ) : null}

            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:opacity-50"
                disabled={createModal.loading}
                onClick={() => setCreateModal({ open: false, name: "", notes: "", error: null, loading: false })}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="flex-1 rounded-full bg-[var(--brand-orange)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={createModal.loading || createModal.name.trim().length < 2}
                onClick={() => void handleCreateComanda()}
                type="button"
              >
                {createModal.loading ? "Abrindo…" : "Abrir comanda"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
