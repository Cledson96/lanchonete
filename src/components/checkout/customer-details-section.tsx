import { Typography } from "@/components/ui/typography";

type CheckoutCustomerDetailsSectionProps = {
  customerName: string;
  setCustomerName: (value: string) => void;
  isLoadingCustomer: boolean;
  verificationConfirmed: boolean;
};

export function CheckoutCustomerDetailsSection(props: CheckoutCustomerDetailsSectionProps) {
  const { customerName, setCustomerName, isLoadingCustomer, verificationConfirmed } = props;

  return (
    <section className="panel rounded-[2rem] px-6 py-6 md:px-8">
      <Typography className="mb-3" variant="eyebrow">Seus dados</Typography>
      <Typography variant="title-lg">Quem vai receber o pedido</Typography>
      <div className="mt-5 grid gap-4 md:grid-cols-1">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">Nome</span>
          <input
            className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Seu nome"
            value={customerName}
          />
        </label>
      </div>

      <div className="mt-5 rounded-[1.4rem] border border-[var(--line)] bg-white/85 px-5 py-4">
        <Typography variant="body-sm">Sessao atual</Typography>
        <Typography className="mt-1 leading-6" tone="muted" variant="body-sm">
          {isLoadingCustomer
            ? "Verificando se ja existe telefone validado..."
            : verificationConfirmed
              ? "Telefone validado para esta sessao."
              : "Voce vai validar o telefone na etapa final antes de enviar."}
        </Typography>
      </div>
    </section>
  );
}
