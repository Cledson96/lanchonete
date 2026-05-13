import type { DeliveryQuote } from "@/lib/contracts/checkout";
import type { FulfillmentType } from "@/lib/contracts/common";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { brandContent } from "@/lib/brand-content";
import { formatMoney } from "@/lib/utils";

type CheckoutFulfillmentSectionProps = {
  fulfillmentType: FulfillmentType;
  setFulfillmentType: (value: FulfillmentType) => void;
  zipCode: string;
  setZipCode: (value: string) => void;
  street: string;
  setStreet: (value: string) => void;
  number: string;
  setNumber: (value: string) => void;
  complement: string;
  setComplement: (value: string) => void;
  neighborhood: string;
  setNeighborhood: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  stateCode: string;
  setStateCode: (value: string) => void;
  reference: string;
  setReference: (value: string) => void;
  canEditAddressFields: boolean;
  streetLocked: boolean;
  complementLocked: boolean;
  neighborhoodLocked: boolean;
  cityLocked: boolean;
  stateLocked: boolean;
  zipLookupLoading: boolean;
  zipLookupMessage: string | null;
  deliveryQuote: DeliveryQuote | null;
  deliveryQuoteLoading: boolean;
  deliveryQuoteError: string | null;
};

export function CheckoutFulfillmentSection(props: CheckoutFulfillmentSectionProps) {
  const {
    fulfillmentType,
    setFulfillmentType,
    zipCode,
    setZipCode,
    street,
    setStreet,
    number,
    setNumber,
    complement,
    setComplement,
    neighborhood,
    setNeighborhood,
    city,
    setCity,
    stateCode,
    setStateCode,
    reference,
    setReference,
    canEditAddressFields,
    streetLocked,
    complementLocked,
    neighborhoodLocked,
    cityLocked,
    stateLocked,
    zipLookupLoading,
    zipLookupMessage,
    deliveryQuote,
    deliveryQuoteLoading,
    deliveryQuoteError,
  } = props;

  return (
    <section className="panel rounded-[2rem] px-6 py-6 md:px-8">
      <Typography className="mb-3" variant="eyebrow">Como quer receber</Typography>
      <Typography variant="title-lg">Entrega ou retirada</Typography>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Button
          className={`cursor-pointer rounded-[1.4rem] border px-5 py-4 text-left transition ${
            fulfillmentType === "delivery"
              ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 shadow-[0_18px_30px_rgba(242,122,34,0.15)]"
              : "border-[var(--line)] bg-white hover:border-[var(--brand-orange)]/40 hover:bg-[var(--surface)] hover:shadow-md hover:-translate-y-0.5"
          }`}
          onClick={() => setFulfillmentType("delivery")}
          variant="unstyled"
        >
          <Typography variant="title-sm">Entrega</Typography>
          <Typography className="mt-2 leading-6" tone="muted" variant="body-sm">
            Calcule o frete por bairro ou CEP e receba em casa.
          </Typography>
        </Button>
        <Button
          className={`cursor-pointer rounded-[1.4rem] border px-5 py-4 text-left transition ${
            fulfillmentType === "retirada"
              ? "border-[var(--brand-green)] bg-[var(--brand-green)]/10 shadow-[0_18px_30px_rgba(140,198,63,0.15)]"
              : "border-[var(--line)] bg-white hover:border-[var(--brand-green)]/40 hover:bg-[var(--surface)] hover:shadow-md hover:-translate-y-0.5"
          }`}
          onClick={() => setFulfillmentType("retirada")}
          variant="unstyled"
        >
          <Typography variant="title-sm">Retirada</Typography>
          <Typography className="mt-2 leading-6" tone="muted" variant="body-sm">
            Retire direto na loja e finalize sem custo de entrega.
          </Typography>
        </Button>
      </div>

      {fulfillmentType === "delivery" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">CEP</span>
            <input
              className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
              inputMode="numeric"
              onChange={(event) => setZipCode(event.target.value)}
              placeholder="00000-000"
              value={zipCode}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">Rua</span>
            <input
              className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
              disabled={!canEditAddressFields || streetLocked}
              onChange={(event) => setStreet(event.target.value)}
              placeholder={!canEditAddressFields ? "Digite o CEP primeiro" : streetLocked ? "Preenchido pelo CEP" : "Rua, avenida..."}
              value={street}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">Numero</span>
            <input
              className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
              disabled={!canEditAddressFields}
              onChange={(event) => setNumber(event.target.value)}
              placeholder={!canEditAddressFields ? "Digite o CEP primeiro" : "123"}
              value={number}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">Complemento</span>
            <input
              className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
              disabled={!canEditAddressFields || complementLocked}
              onChange={(event) => setComplement(event.target.value)}
              placeholder={!canEditAddressFields ? "Digite o CEP primeiro" : complementLocked ? "Preenchido pelo CEP" : "Apto, bloco, casa..."}
              value={complement}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">Bairro</span>
            <input
              className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
              disabled={!canEditAddressFields || neighborhoodLocked}
              onChange={(event) => setNeighborhood(event.target.value)}
              placeholder={!canEditAddressFields ? "Digite o CEP primeiro" : neighborhoodLocked ? "Preenchido pelo CEP" : "Centro"}
              value={neighborhood}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">Cidade</span>
            <input
              className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
              disabled={!canEditAddressFields || cityLocked}
              onChange={(event) => setCity(event.target.value)}
              placeholder={!canEditAddressFields ? "Digite o CEP primeiro" : cityLocked ? "Preenchido pelo CEP" : "Curitiba"}
              value={city}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">Estado</span>
            <input
              className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 uppercase outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
              disabled={!canEditAddressFields || stateLocked}
              maxLength={2}
              onChange={(event) => setStateCode(event.target.value.toUpperCase())}
              placeholder={!canEditAddressFields ? "Digite o CEP primeiro" : stateLocked ? "Preenchido pelo CEP" : "PR"}
              value={stateCode}
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">Referencia</span>
            <input
              className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
              disabled={!canEditAddressFields}
              onChange={(event) => setReference(event.target.value)}
              placeholder={!canEditAddressFields ? "Digite o CEP primeiro" : "Perto de..."}
              value={reference}
            />
          </label>

          <div className="md:col-span-2 rounded-[1.3rem] border border-[var(--line)] bg-white/88 px-4 py-4 text-sm leading-6 text-[var(--muted)]">
            {zipLookupLoading
              ? "Buscando endereco pelo CEP..."
              : zipLookupMessage ||
                "Digite o CEP primeiro. Os campos do endereco ficam bloqueados ate o CEP completar, e so liberamos o que vier em branco."}
          </div>
        </div>
      ) : (
        <Alert className="mt-6 rounded-[1rem] border-[var(--brand-green)]/20 px-5 py-4 text-[0.88rem] font-medium leading-6" tone="success">
          Retirada selecionada. O pedido sera separado para buscar na {brandContent.location}.
        </Alert>
      )}

      {fulfillmentType === "delivery" ? (
        <div className={`mt-5 rounded-[1.4rem] border px-5 py-4 ${deliveryQuoteError ? "border-red-200 bg-red-50" : "border-[var(--line)] bg-white/85"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Typography className={deliveryQuoteError ? "text-red-800" : undefined} variant="body-sm">
                {deliveryQuoteError ? "Endereco fora da area de entrega" : "Status do frete"}
              </Typography>
              <Typography className={`mt-1 leading-6 ${deliveryQuoteError ? "text-red-700" : ""}`} tone={deliveryQuoteError ? "danger" : "muted"} variant="body-sm">
                {deliveryQuoteLoading
                  ? "Calculando frete..."
                  : deliveryQuote
                    ? `${deliveryQuote.rule.label} • ${formatMoney(deliveryQuote.feeAmount)} • ${deliveryQuote.distanceKm.toFixed(2)} km`
                    : deliveryQuoteError
                      ? deliveryQuoteError
                      : "Preencha rua, numero, bairro, cidade e estado para calcular."}
              </Typography>
            </div>
            {deliveryQuote ? (
              <Badge className="px-4 py-2 text-[0.8rem]" tone="success">
                {deliveryQuote.estimatedMinMinutes && deliveryQuote.estimatedMaxMinutes
                  ? `${deliveryQuote.estimatedMinMinutes}-${deliveryQuote.estimatedMaxMinutes} min`
                  : "Entrega disponivel"}
              </Badge>
            ) : null}
            {deliveryQuoteError ? (
              <Badge className="px-4 py-2 text-[0.8rem]" tone="danger">
                Nao atendemos
              </Badge>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
