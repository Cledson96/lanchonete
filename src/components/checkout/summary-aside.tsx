import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { checkoutPaymentOptions } from "@/lib/checkout/payment-options";
import type { DeliveryQuote, CheckoutStoreStatus } from "@/lib/contracts/checkout";
import type { FulfillmentType, PaymentMethod } from "@/lib/contracts/common";
import { brandContent } from "@/lib/brand-content";
import { formatMoney } from "@/lib/utils";

type CheckoutSummaryAsideProps = {
  fulfillmentType: FulfillmentType;
  subtotal: number;
  deliveryQuote: DeliveryQuote | null;
  deliveryQuoteLoading: boolean;
  deliveryQuoteError: string | null;
  deliveryFeeAmount: number;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  isMenuAvailableNow: boolean;
  storeStatus: CheckoutStoreStatus;
  canSubmit: boolean;
  handleSubmitOrder: () => void;
  submitPending: boolean;
  submitError: string | null;
};

export function CheckoutSummaryAside(props: CheckoutSummaryAsideProps) {
  const {
    fulfillmentType,
    subtotal,
    deliveryQuote,
    deliveryQuoteLoading,
    deliveryQuoteError,
    deliveryFeeAmount,
    paymentMethod,
    totalAmount,
    isMenuAvailableNow,
    storeStatus,
    canSubmit,
    handleSubmitOrder,
    submitPending,
    submitError,
  } = props;

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <section className="panel rounded-[2rem] px-6 py-6">
        <Typography className="mb-3" variant="eyebrow">Resumo</Typography>
        <Typography as="h2" variant="title-lg">Fechamento do pedido</Typography>

        <div className="mt-5 space-y-3 rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] px-5 py-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
            <span>Modo</span>
            <span className="font-semibold text-[var(--foreground)]">
              {fulfillmentType === "delivery" ? "Entrega" : "Retirada"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
            <span>Subtotal</span>
            <span className="font-semibold text-[var(--foreground)]">{formatMoney(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
            <span>Frete</span>
            <span className="font-semibold text-[var(--foreground)]">
              {fulfillmentType === "retirada"
                ? "Gratis"
                : deliveryQuoteLoading
                  ? "Calculando..."
                  : deliveryQuote
                    ? formatMoney(deliveryFeeAmount)
                    : "Aguardando"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
            <span>Pagamento</span>
            <span className="font-semibold text-[var(--foreground)]">
              {checkoutPaymentOptions.find((option) => option.value === paymentMethod)?.label}
            </span>
          </div>
          <div className="soft-divider pt-3" />
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-[var(--foreground)]">Total</span>
            <span className="menu-price text-[2rem] font-bold text-[var(--brand-orange)]">
              {formatMoney(totalAmount)}
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {!isMenuAvailableNow ? (
            <Alert className="rounded-[1.1rem] px-4 py-3 text-sm font-normal" tone="warning">O cardapio de almoco esta disponivel apenas das 11:00 as 15:00.</Alert>
          ) : null}

          {!storeStatus.isOpen ? (
            <Alert className="rounded-[1.1rem] px-4 py-3 text-sm font-normal" tone="error">
              A loja esta fechada agora. Horario de atendimento: {storeStatus.hoursLabel}.
            </Alert>
          ) : null}

          <Button
            className="group relative w-full overflow-hidden py-4 text-[1rem] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(140,198,63,0.4)] disabled:hover:translate-y-0"
            disabled={!canSubmit}
            onClick={handleSubmitOrder}
            variant="success"
          >
            <span className="absolute inset-0 z-0 h-full w-full -translate-x-full animate-[sheen_3s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              {submitPending ? "Enviando pedido..." : "Finalizar pedido"}
              <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </span>
          </Button>
          <Typography className="leading-6" tone="muted" variant="body-sm">
            O botao libera quando itens, dados, telefone, frete e horario da loja
            estiverem validados.
          </Typography>
          {fulfillmentType === "delivery" && !deliveryQuote && !deliveryQuoteLoading ? (
            <Typography className="leading-6 text-amber-700" tone="amber" variant="body-sm">
              {deliveryQuoteError
                ? "Ajuste o endereco para um CEP atendido ou mude para retirada."
                : "Complete o endereco para calcular o frete e liberar o botao."}
            </Typography>
          ) : null}
        </div>

        {submitError ? (
          <Alert className="mt-4 rounded-[1.3rem] px-4 py-4 text-sm font-normal" tone="error">{submitError}</Alert>
        ) : null}

        <div className="mt-5 rounded-[1.4rem] border border-[var(--line)] bg-white/85 px-4 py-4 text-sm leading-6 text-[var(--muted)]">
          <Typography variant="body-sm">Retirada na loja</Typography>
          <Typography className="mt-2 leading-6" tone="muted" variant="body-sm">{brandContent.location}</Typography>
          <Typography className="leading-6" tone="muted" variant="body-sm">{storeStatus.hoursLabel}</Typography>
        </div>
      </section>
    </aside>
  );
}
