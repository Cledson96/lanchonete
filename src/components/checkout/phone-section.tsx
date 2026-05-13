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
          <p className="eyebrow mb-3">Primeiro passo</p>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Informe seu telefone
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Depois de validar o numero, buscamos seu cadastro salvo para preencher
            nome, endereco padrao e a ultima forma de pagamento.
          </p>
        </div>
        <span className={`rounded-full px-4 py-2 text-[0.8rem] font-bold ${verificationConfirmed ? "bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)]" : "bg-[var(--muted)]/5 text-[var(--muted)]"}`}>
          {verificationConfirmed ? "Telefone validado" : "Telefone primeiro"}
        </span>
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
            {isLoadingCustomer
              ? "Verificando sessao..."
              : verificationConfirmed
                ? "Telefone validado e pronto para finalizar."
                : "Valide o telefone para carregar o cadastro salvo."}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white/75 px-4 py-4 md:px-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Confirmação do telefone
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
              Valide seu WhatsApp antes de finalizar
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              O pedido só é enviado depois que o telefone for confirmado. Assim a loja consegue localizar você e atualizar o status sem erro.
            </p>
          </div>

          <span className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
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
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
          <button
            className="cursor-pointer rounded-[1rem] bg-[var(--brand-orange)] px-5 py-3 text-[0.88rem] font-bold text-white transition-all shadow-[0_4px_14px_rgba(242,122,34,0.3)] hover:bg-[var(--brand-orange-dark)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(242,122,34,0.4)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:transform-none"
            disabled={!canRequestVerificationAction}
            onClick={handleRequestVerification}
            type="button"
          >
            {verificationPending
              ? "Enviando..."
              : isCheckoutVerificationExpired(verificationMessage)
                ? "Solicitar novo código"
                : "Solicitar código"}
          </button>

          <input
            className="rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 tracking-[0.3em] outline-none transition placeholder:tracking-normal focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Digite o código"
            value={verificationCode}
          />

          <button
            className="cursor-pointer rounded-[1rem] bg-[var(--brand-green)] px-5 py-3 text-[0.88rem] font-bold text-white transition-all shadow-[0_4px_14px_rgba(140,198,63,0.3)] hover:bg-[var(--brand-green-dark)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(140,198,63,0.4)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:transform-none"
            disabled={verificationCode.length !== 6 || verificationPending}
            onClick={handleConfirmVerification}
            type="button"
          >
            {verificationPending ? "Confirmando..." : "Confirmar código"}
          </button>
        </div>

        {devCodePreview ? (
          <div className="mt-4 rounded-[1rem] border border-[var(--brand-green)]/20 bg-[var(--brand-green)]/5 px-4 py-4 text-[0.88rem] text-[var(--brand-green-dark)] font-medium">
            <p className="font-semibold">Código para desenvolvimento</p>
            <p className="mt-2">
              Use <strong>{devCodePreview}</strong> para testar localmente.
            </p>
          </div>
        ) : null}

        {verificationMessage ? (
          <div className="mt-4 rounded-[1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-[0.88rem] text-[var(--foreground)]">
            {verificationMessage}
          </div>
        ) : null}

        {verificationError ? (
          <div className="mt-4 rounded-[1.3rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            {verificationError}
          </div>
        ) : null}
      </div>
    </section>
  );
}
