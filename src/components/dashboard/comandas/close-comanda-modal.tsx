import { useEffect } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { ComandaDetail } from "@/lib/comanda-ui";
import { formatMoney } from "@/lib/utils";
import { CloseIcon } from "./icons";
import { paymentMethods } from "./payment-methods";
import type { ClosingPaymentMethod } from "./types";

export function CloseComandaModal({
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
  method: ClosingPaymentMethod;
  setMethod: (method: ClosingPaymentMethod) => void;
}) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closing) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closing, onClose]);

  return (
    <Modal
      closeDisabled={closing}
      closeIcon={<CloseIcon />}
      eyebrow="Fechar comanda"
      footer={
        <div className="flex gap-2">
          <Button disabled={closing} fullWidth onClick={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button disabled={closing} fullWidth onClick={onConfirm} variant="success">
            {closing ? "Fechando…" : "Confirmar fechamento"}
          </Button>
        </div>
      }
      onClose={onClose}
      size="sm"
      title={comanda.name || "Cliente"}
    >
      <div className="rounded-lg bg-[var(--brand-orange)]/5 p-3">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          Total a cobrar
        </p>
        <p className="text-2xl font-bold text-[var(--brand-orange-dark)]">{formatMoney(comanda.totalAmount)}</p>
      </div>

      <div className="mt-4">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          Forma de pagamento
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {paymentMethods.map((paymentMethod) => (
            <button
              key={paymentMethod.value}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                method === paymentMethod.value
                  ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]"
                  : "border-[var(--line)] bg-white text-[var(--foreground)] hover:border-[var(--brand-orange)]/40"
              }`}
              onClick={() => setMethod(paymentMethod.value)}
              type="button"
            >
              {paymentMethod.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <Alert className="mt-3" tone="error">{error}</Alert> : null}
    </Modal>
  );
}
