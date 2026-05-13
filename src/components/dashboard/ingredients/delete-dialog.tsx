import { useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Typography } from "@/components/ui/typography";
import { CloseIcon } from "./icons";
import type { DeleteState } from "./types";

export function DeleteDialog({
  deleting,
  onClose,
  onConfirm,
  state,
}: {
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  state: NonNullable<DeleteState>;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleting, onClose]);

  return (
    <Modal
      closeDisabled={deleting}
      closeIcon={<CloseIcon />}
      eyebrow="Excluir grupo"
      footer={
        <div className="flex gap-2">
          <Button disabled={deleting} fullWidth onClick={onClose} size="sm" variant="secondary">Cancelar</Button>
          <Button disabled={deleting} fullWidth onClick={() => void onConfirm()} size="sm" variant="danger">
            {deleting ? "Excluindo…" : "Excluir grupo"}
          </Button>
        </div>
      }
      onClose={onClose}
      size="sm"
      title={state.name}
    >
      <Typography tone="muted" variant="caption">
        {state.optionCount > 0
          ? `${state.optionCount} ${state.optionCount === 1 ? "opção será removida" : "opções serão removidas"} junto.`
          : "Grupo vazio — remoção direta."}
      </Typography>
      <Alert className="mt-3" tone="warning">Itens do cardápio vinculados a este grupo podem bloquear a exclusão.</Alert>
    </Modal>
  );
}
