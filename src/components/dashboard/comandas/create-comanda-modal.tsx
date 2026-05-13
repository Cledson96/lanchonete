import type { Dispatch, SetStateAction } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CloseIcon } from "./icons";
import type { CreateModalState } from "./types";

const closedCreateModal: CreateModalState = {
  open: false,
  name: "",
  notes: "",
  error: null,
  loading: false,
};

export function CreateComandaModal({
  createModal,
  setCreateModal,
  onCreate,
}: {
  createModal: CreateModalState;
  setCreateModal: Dispatch<SetStateAction<CreateModalState>>;
  onCreate: () => void;
}) {
  function closeModal() {
    if (!createModal.loading) setCreateModal(closedCreateModal);
  }

  return (
    <Modal
      closeDisabled={createModal.loading}
      closeIcon={<CloseIcon />}
      eyebrow="Nova comanda"
      footer={
        <div className="flex gap-2">
          <Button disabled={createModal.loading} fullWidth onClick={closeModal} variant="secondary">
            Cancelar
          </Button>
          <Button
            disabled={createModal.loading || createModal.name.trim().length < 2}
            fullWidth
            onClick={() => void onCreate()}
          >
            {createModal.loading ? "Abrindo…" : "Abrir comanda"}
          </Button>
        </div>
      }
      onClose={closeModal}
      title="Abrir comanda do salão"
    >
      <div className="space-y-3">
        <label className="block">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            Nome do cliente ou mesa
          </span>
          <input
            autoFocus
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--brand-orange)]"
            onChange={(event) => setCreateModal((current) => ({ ...current, name: event.target.value }))}
            placeholder="Ex: Mesa da Julia"
            value={createModal.name}
          />
        </label>

        <label className="block">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            Observação (opcional)
          </span>
          <textarea
            className="mt-1 h-20 w-full resize-none rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--brand-orange)]"
            onChange={(event) => setCreateModal((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Aniversariante, mesa do fundo, dividir a conta…"
            value={createModal.notes}
          />
        </label>
      </div>

      {createModal.error ? <Alert className="mt-3" tone="error">{createModal.error}</Alert> : null}
    </Modal>
  );
}
