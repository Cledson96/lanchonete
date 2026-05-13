import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { isCheckoutVerificationExpired } from "@/lib/checkout/rules";

type CheckoutPhoneSectionProps = {
  verificationConfirmed: boolean;
  customerPhone: string;
  setCustomerPhone: (value: string) => void;
  formatPhone: (value: string) => string;
  isLoadingCustomer: boolean;
  verificationPending: boolean;
  verificationRequested: boolean;
  verificationMessage: string | null;
  canRequestVerificationAction: boolean;
  handleRequestVerification: () => void;
  verificationCode: string;
  setVerificationCode: (value: string) => void;
  handleConfirmVerification: () => void;
  devCodePreview: string | null;
  verificationError: string | null;
};

export function CheckoutPhoneSection(props: CheckoutPhoneSectionProps) {
  const {
    verificationConfirmed,
    customerPhone,
    setCustomerPhone,
    formatPhone,
    isLoadingCustomer,
    verificationPending,
    verificationRequested,
    verificationMessage,
    canRequestVerificationAction,
    handleRequestVerification,
    verificationCode,
    setVerificationCode,
    handleConfirmVerification,
    devCodePreview,
    verificationError,
  } = props;

  return (
    <section className="panel rounded-[2rem] px-6 py-6 md:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <Typography className="mb-3" variant="eyebrow">Primeiro passo</Typography>
          <Typography as="h2" variant="title-lg">Informe seu telefone</Typography>
          <Typography className="mt-3 leading-6" tone="muted" variant="body-sm">
            Depois de validar o numero, buscamos seu cadastro salvo para preencher
            nome, endereco padrao e a ultima forma de pagamento.
          </Typography>
        </div>
        <Badge className={`px-4 py-2 text-[0.8rem] ${verificationConfirmed ? "bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)]" : "bg-[var(--muted)]/5 text-[var(--muted)]"}`}>
          {verificationConfirmed ? "Telefone validado" : "Telefone primeiro"}
        </Badge>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
            WhatsApp do cliente
          </span>
          <input
            className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
            inputMode="numeric"
            onChange={(event) => setCustomerPhone(formatPhone(event.target.value))}
            placeholder="(11) 99999-0000"
            value={customerPhone}
          />
        </label>

        <div className="flex items-end">
          <div className="rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[var(--muted)]">
            <Typography className="leading-6" tone="muted" variant="body-sm">{isLoadingCustomer
              ? "Verificando sessao..."
              : verificationConfirmed
                ? "Telefone validado e pronto para finalizar."
                : "Valide o telefone para carregar o cadastro salvo."}</Typography>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white/75 px-4 py-4 md:px-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Typography tone="muted" variant="eyebrow">
              Confirmação do telefone
            </Typography>
            <Typography as="h3" className="mt-1" variant="title-md">
              Valide seu WhatsApp antes de finalizar
            </Typography>
            <Typography className="mt-2 max-w-2xl leading-6" tone="muted" variant="body-sm">
              O pedido só é enviado depois que o telefone for confirmado. Assim a loja consegue localizar você e atualizar o status sem erro.
            </Typography>
          </div>

          <Badge className={`w-fit px-4 py-2 text-sm ${
            verificationConfirmed
              ? "bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)]"
              : verificationPending
                ? "bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]"
                : "bg-[var(--muted)]/10 text-[var(--muted)]"
          }`}>
            {verificationConfirmed
              ? "Validado"
              : verificationPending
                ? "Validando"
                : isCheckoutVerificationExpired(verificationMessage)
                  ? "Código expirado"
                  : verificationRequested
                  ? "Código solicitado"
                  : "Aguardando envio"}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
          <Button
            className="rounded-[1rem] px-5 py-3 text-[0.88rem] shadow-[0_4px_14px_rgba(242,122,34,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(242,122,34,0.4)] disabled:transform-none"
            disabled={!canRequestVerificationAction}
            onClick={handleRequestVerification}
          >
            {verificationPending
              ? "Enviando..."
              : isCheckoutVerificationExpired(verificationMessage)
                ? "Solicitar novo código"
                : "Solicitar código"}
          </Button>

          <input
            className="rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 tracking-[0.3em] outline-none transition placeholder:tracking-normal focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Digite o código"
            value={verificationCode}
          />

          <Button
            className="rounded-[1rem] px-5 py-3 text-[0.88rem] shadow-[0_4px_14px_rgba(140,198,63,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(140,198,63,0.4)] disabled:transform-none"
            disabled={verificationCode.length !== 6 || verificationPending}
            onClick={handleConfirmVerification}
            variant="success"
          >
            {verificationPending ? "Confirmando..." : "Confirmar código"}
          </Button>
        </div>

        {devCodePreview ? (
          <Alert className="mt-4 rounded-[1rem] px-4 py-4 text-[0.88rem]" tone="success">
            <Typography tone="green" variant="body-sm">Código para desenvolvimento</Typography>
            <Typography className="mt-2" tone="green" variant="body-sm">
              Use <strong>{devCodePreview}</strong> para testar localmente.
            </Typography>
          </Alert>
        ) : null}

        {verificationMessage ? (
          <Alert className="mt-4 rounded-[1rem] border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-[0.88rem] text-[var(--foreground)]" tone="info">{verificationMessage}</Alert>
        ) : null}

        {verificationError ? (
          <Alert className="mt-4 rounded-[1.3rem] px-4 py-4 text-sm font-normal" tone="error">{verificationError}</Alert>
        ) : null}
      </div>
    </section>
  );
}
