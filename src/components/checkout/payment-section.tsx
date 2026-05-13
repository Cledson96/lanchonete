import type { PaymentMethod } from "@/lib/contracts/common";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { checkoutPaymentOptions } from "@/lib/checkout/payment-options";

type CheckoutPaymentSectionProps = {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (value: PaymentMethod) => void;
  orderNotes: string;
  setOrderNotes: (value: string) => void;
};

export function CheckoutPaymentSection(props: CheckoutPaymentSectionProps) {
  const { paymentMethod, setPaymentMethod, orderNotes, setOrderNotes } = props;

  return (
    <section className="panel rounded-[2rem] px-6 py-6 md:px-8">
      <Typography className="mb-3" variant="eyebrow">Pagamento</Typography>
      <Typography variant="title-lg">Como vai pagar</Typography>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {checkoutPaymentOptions.map((option) => (
          <Button
            key={option.value}
            className={`cursor-pointer rounded-[1.2rem] border px-4 py-4 text-left transition-all duration-300 ${paymentMethod === option.value ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 shadow-[0_8px_20px_rgba(242,122,34,0.15)] -translate-y-0.5" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--brand-orange)]/40 hover:shadow-md hover:-translate-y-0.5"}`}
            onClick={() => setPaymentMethod(option.value)}
            variant="unstyled"
          >
            <Typography variant="title-sm">{option.label}</Typography>
          </Button>
        ))}
      </div>

      <label className="mt-5 block">
        <Typography as="span" className="mb-2 block" variant="body-sm">
          Observacao geral do pedido
        </Typography>
        <textarea
          className="min-h-28 w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition placeholder:text-[var(--muted)]/50 focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
          maxLength={250}
          onChange={(event) => setOrderNotes(event.target.value)}
          placeholder="Ex.: enviar guardanapo, troco para 50, tocar interfone..."
          value={orderNotes}
        />
      </label>
    </section>
  );
}
