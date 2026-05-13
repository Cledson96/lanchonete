"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AddItemModal } from "./comandas/add-item-modal";
import { CloseComandaModal } from "./comandas/close-comanda-modal";
import { ComandaDetailPanel } from "./comandas/detail-panel";
import { ComandaList } from "./comandas/comanda-list";
import { CreateComandaModal } from "./comandas/create-comanda-modal";
import { parseJson, sortCommandas } from "./comandas/helpers";
import { PlusIcon, RefreshIcon } from "./comandas/icons";
import { QrShareModal } from "./comandas/qr-share-modal";
import type { AddComandaItemInput, ClosingPaymentMethod, CreateModalState } from "./comandas/types";
import type { PublicMenuCategory, PublicMenuResponse } from "@/lib/contracts/menu";
import {
  canEditComanda,
  humanizePaymentMethod,
  type ComandaDetail,
} from "@/lib/comanda-ui";

const emptyCreateModal: CreateModalState = {
  open: false,
  name: "",
  notes: "",
  error: null,
  loading: false,
};

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
  const [closingPaymentMethod, setClosingPaymentMethod] = useState<ClosingPaymentMethod>("pix");
  const [closing, setClosing] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [createModal, setCreateModal] = useState<CreateModalState>(emptyCreateModal);

  const openCommandas = useMemo(
    () => sortCommandas(commandas.filter((comanda) => canEditComanda(comanda.status))),
    [commandas],
  );
  const closedCommandas = useMemo(
    () => sortCommandas(commandas.filter((comanda) => !canEditComanda(comanda.status))),
    [commandas],
  );

  const refreshList = useCallback(
    async (keepSelection = true) => {
      const [commandasResponse, menuResponse] = await Promise.all([
        fetch("/api/dashboard/comandas", { cache: "no-store" }),
        fetch("/api/menu", { cache: "no-store" }),
      ]);
      const commandasPayload = await parseJson<{ commandas: ComandaDetail[] }>(commandasResponse);
      const menuPayload = await parseJson<PublicMenuResponse>(menuResponse);

      setCommandas(commandasPayload.commandas);
      setCategories(menuPayload.categories);

      if (keepSelection && selectedId) {
        const current = commandasPayload.commandas.find((item) => item.id === selectedId) || null;
        setSelectedComanda(current);
      }
    },
    [selectedId],
  );

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
    let consecutiveErrors = 0;
    const interval = window.setInterval(() => {
      void refreshList(true)
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
  }, [refreshList]);

  useEffect(() => {
    if (!selectedId && openCommandas[0]) {
      void openComanda(openCommandas[0].id);
    }
  }, [openCommandas, openComanda, selectedId]);

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
      setCreateModal(emptyCreateModal);
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

  async function handleAddItem(input: AddComandaItemInput) {
    if (!selectedComanda) return;

    const requestPayload = {
      ...input,
      ingredients: input.ingredientCustomizations
        ? Object.entries(input.ingredientCustomizations).map(([ingredientId, quantity]) => ({
            ingredientId,
            quantity,
          }))
        : undefined,
    };
    const response = await fetch(`/api/comandas/${selectedComanda.id}/items`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: [requestPayload] }),
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
            onClick={() => {
              setLoading(true);
              void refreshList(true).finally(() => setLoading(false));
            }}
            type="button"
          >
            <RefreshIcon />
          </button>
          <button
            className="flex items-center gap-1.5 rounded-full bg-[var(--brand-orange)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
            onClick={() => setCreateModal({ ...emptyCreateModal, open: true })}
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
        <div className="rounded-xl border border-[var(--brand-green)]/30 bg-[var(--brand-green)]/10 px-4 py-2 text-xs font-medium text-[var(--brand-green-dark)]">
          {feedback}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <ComandaList
          closedCommandas={closedCommandas}
          loading={loading}
          onOpenComanda={(id) => void openComanda(id)}
          openCommandas={openCommandas}
          selectedId={selectedId}
          setShowClosed={setShowClosed}
          showClosed={showClosed}
        />

        <ComandaDetailPanel
          canEdit={canEdit}
          detailError={detailError}
          detailLoading={detailLoading}
          onOpenAddItem={() => setAddItemModalOpen(true)}
          onOpenClose={() => setCloseModalOpen(true)}
          onOpenQr={() => setQrModalOpen(true)}
          selectedComanda={selectedComanda}
        />
      </section>

      {qrModalOpen && selectedComanda ? (
        <QrShareModal
          comandaName={selectedComanda.name || selectedComanda.customerProfile?.fullName || "Comanda"}
          onClose={() => setQrModalOpen(false)}
          slug={selectedComanda.qrCodeSlug}
        />
      ) : null}

      {addItemModalOpen && selectedComanda ? (
        <AddItemModal
          canEdit={canEdit}
          categories={categories}
          onAddItem={handleAddItem}
          onClose={() => setAddItemModalOpen(false)}
          selectedComanda={selectedComanda}
        />
      ) : null}

      {closeModalOpen && selectedComanda ? (
        <CloseComandaModal
          closing={closing}
          comanda={selectedComanda}
          error={detailError}
          method={closingPaymentMethod}
          onClose={() => {
            if (!closing) setCloseModalOpen(false);
          }}
          onConfirm={() => void handleCloseComanda()}
          setMethod={(method) => setClosingPaymentMethod(method)}
        />
      ) : null}

      {createModal.open ? (
        <CreateComandaModal
          createModal={createModal}
          onCreate={() => void handleCreateComanda()}
          setCreateModal={setCreateModal}
        />
      ) : null}
    </main>
  );
}
