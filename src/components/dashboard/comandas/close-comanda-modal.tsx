import { useEffect } from "react";
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(45,24,11,0.4)] p-4 backdrop-blur-[3px]">
      <button aria-label="Fechar" className="absolute inset-0" disabled={closing} onClick={onClose} type="button" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--line)] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Fechar comanda
            </p>
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

        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
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
