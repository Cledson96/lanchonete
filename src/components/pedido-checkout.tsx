"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";
import { useCart } from "@/lib/cart-store";
import { brandContent } from "@/lib/brand-content";

type FulfillmentType = "delivery" | "retirada";
type PaymentMethod =
  | "pix"
  | "cartao_credito"
  | "cartao_debito"
  | "dinheiro"
  | "outro";

type DeliveryQuote = {
  serviceable: boolean;
  feeAmount: number;
  estimatedMinMinutes?: number | null;
  estimatedMaxMinutes?: number | null;
  rule: {
    id: string;
    label: string;
    city: string;
    state: string;
    neighborhood?: string | null;
    minimumOrderAmount?: number | null;
    freeAboveAmount?: number | null;
  };
};

type RequestVerificationResponse = {
  phone: string;
  expiresAt: string;
  delivered: boolean;
  provider: "meta" | "development";
  devCodePreview?: string;
};

type ConfirmVerificationResponse = {
  customer: {
    id: string;
    fullName?: string | null;
    phone: string;
  };
};

type CustomerMeResponse = {
  customer: {
    id: string;
    fullName?: string | null;
    phone: string;
  } | null;
};

type CreateOrderResponse = {
  order: {
    code: string;
    customerName?: string | null;
    customerPhone?: string | null;
    type: FulfillmentType;
    paymentMethod: PaymentMethod;
    totalAmount: string | number;
    subtotalAmount: string | number;
    deliveryFeeAmount: string | number;
  };
};

const paymentOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "pix", label: "Pix" },
  { value: "cartao_credito", label: "Cartao de credito" },
  { value: "cartao_debito", label: "Cartao de debito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "outro", label: "Outro" },
];

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function normalizePhoneForCompare(value: string) {
  const digits = digitsOnly(value);

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

function optionalTrimmed(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

async function readJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Nao foi possivel concluir a acao.");
  }

  return payload as T;
}

export function PedidoCheckout() {
  const {
    state,
    removeItem,
    updateQuantity,
    clearCart,
    closeCart,
    totalPrice,
  } = useCart();
  const router = useRouter();

  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("delivery");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [orderNotes, setOrderNotes] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationRequested, setVerificationRequested] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [devCodePreview, setDevCodePreview] = useState<string | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);

  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [reference, setReference] = useState("");

  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [deliveryQuoteLoading, setDeliveryQuoteLoading] = useState(false);
  const [deliveryQuoteError, setDeliveryQuoteError] = useState<string | null>(null);

  const [submitPending, setSubmitPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const subtotal = totalPrice;
  const deliveryFeeAmount =
    fulfillmentType === "delivery" ? deliveryQuote?.feeAmount || 0 : 0;
  const totalAmount = subtotal + deliveryFeeAmount;

  useEffect(() => {
    let active = true;

    readJson<CustomerMeResponse>("/api/customer/me")
      .then((payload) => {
        if (!active || !payload.customer) return;

        setCustomerName((current) => current || payload.customer?.fullName || "");
        setCustomerPhone((current) => current || payload.customer?.phone || "");
        setVerificationConfirmed(true);
        setVerifiedPhone(payload.customer.phone);
        setVerificationMessage("Telefone ja validado para esta sessao.");
      })
      .catch(() => {
        if (!active) return;
      })
      .finally(() => {
        if (active) {
          setIsLoadingCustomer(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const normalizedCurrentPhone = normalizePhoneForCompare(customerPhone);

    if (verifiedPhone && normalizedCurrentPhone !== verifiedPhone) {
      setVerificationConfirmed(false);
      setVerificationRequested(false);
      setVerificationCode("");
      setDevCodePreview(null);
      setVerificationMessage("Telefone alterado. Confirme novamente antes de finalizar.");
    }
  }, [customerPhone, verifiedPhone]);

  useEffect(() => {
    if (fulfillmentType !== "delivery") {
      setDeliveryQuote(null);
      setDeliveryQuoteError(null);
      setDeliveryQuoteLoading(false);
      return;
    }

    const hasLocationForQuote =
      city.trim().length >= 2 &&
      stateCode.trim().length >= 2 &&
      (neighborhood.trim().length >= 2 || zipCode.trim().length >= 8);

    if (!hasLocationForQuote) {
      setDeliveryQuote(null);
      setDeliveryQuoteError(null);
      setDeliveryQuoteLoading(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setDeliveryQuoteLoading(true);
      setDeliveryQuoteError(null);

      try {
        const payload = await readJson<DeliveryQuote>("/api/delivery-fee/quote", {
          method: "POST",
          body: JSON.stringify({
            zipCode,
            neighborhood,
            city,
            state: stateCode.toUpperCase(),
            subtotalAmount: subtotal,
          }),
        });

        setDeliveryQuote(payload);
      } catch (error) {
        setDeliveryQuote(null);
        setDeliveryQuoteError(
          error instanceof Error ? error.message : "Nao foi possivel calcular o frete.",
        );
      } finally {
        setDeliveryQuoteLoading(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [fulfillmentType, city, stateCode, neighborhood, zipCode, subtotal]);

  const isDeliveryAddressValid = useMemo(() => {
    if (fulfillmentType !== "delivery") return true;

    return (
      street.trim().length >= 2 &&
      number.trim().length >= 1 &&
      neighborhood.trim().length >= 2 &&
      city.trim().length >= 2 &&
      stateCode.trim().length === 2 &&
      !!deliveryQuote &&
      !deliveryQuoteError
    );
  }, [
    fulfillmentType,
    street,
    number,
    neighborhood,
    city,
    stateCode,
    deliveryQuote,
    deliveryQuoteError,
  ]);

  const canRequestVerification =
    customerName.trim().length >= 2 &&
    digitsOnly(customerPhone).length >= 10 &&
    !verificationPending;

  const canSubmit =
    state.items.length > 0 &&
    customerName.trim().length >= 2 &&
    digitsOnly(customerPhone).length >= 10 &&
    verificationConfirmed &&
    verifiedPhone === normalizePhoneForCompare(customerPhone) &&
    paymentMethod &&
    isDeliveryAddressValid &&
    !submitPending &&
    !deliveryQuoteLoading;

  async function handleRequestVerification() {
    setVerificationPending(true);
    setVerificationError(null);
    setVerificationMessage(null);
    setDevCodePreview(null);

    try {
      const payload = await readJson<RequestVerificationResponse>(
        "/api/customer/verification/request",
        {
          method: "POST",
          body: JSON.stringify({
            phone: customerPhone,
            customerName,
          }),
        },
      );

      setVerificationRequested(true);
      setVerificationConfirmed(false);
      setVerifiedPhone("");
      setDevCodePreview(payload.devCodePreview || null);
      setVerificationMessage(
        payload.delivered
          ? "Codigo enviado para o WhatsApp informado."
          : "Nao conseguimos entregar no WhatsApp agora, mas o codigo foi gerado.",
      );
    } catch (error) {
      setVerificationError(
        error instanceof Error ? error.message : "Nao foi possivel solicitar o codigo.",
      );
    } finally {
      setVerificationPending(false);
    }
  }

  async function handleConfirmVerification() {
    setVerificationPending(true);
    setVerificationError(null);
    setVerificationMessage(null);

    try {
      const payload = await readJson<ConfirmVerificationResponse>(
        "/api/customer/verification/confirm",
        {
          method: "POST",
          body: JSON.stringify({
            phone: customerPhone,
            code: verificationCode,
            customerName,
          }),
        },
      );

      setVerificationConfirmed(true);
      setVerifiedPhone(payload.customer.phone);
      setCustomerName((current) => current || payload.customer.fullName || "");
      setVerificationMessage("Telefone validado com sucesso.");
    } catch (error) {
      setVerificationConfirmed(false);
      setVerifiedPhone("");
      setVerificationError(
        error instanceof Error ? error.message : "Nao foi possivel validar o codigo.",
      );
    } finally {
      setVerificationPending(false);
    }
  }

  async function handleSubmitOrder() {
    if (!canSubmit) return;

    setSubmitPending(true);
    setSubmitError(null);

    try {
      const payload = await readJson<CreateOrderResponse>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName,
          customerPhone,
          type: fulfillmentType,
          paymentMethod,
          notes: orderNotes,
          items: state.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
            optionItemIds: [],
          })),
          address:
            fulfillmentType === "delivery"
              ? {
                  street,
                  number,
                  complement: optionalTrimmed(complement),
                  neighborhood,
                  city,
                  state: stateCode.toUpperCase(),
                  zipCode: optionalTrimmed(zipCode),
                  reference: optionalTrimmed(reference),
                }
              : undefined,
        }),
      });

      const params = new URLSearchParams({
        code: payload.order.code,
        name: payload.order.customerName || customerName,
        type: payload.order.type,
        payment: payload.order.paymentMethod,
        total: String(payload.order.totalAmount),
      });

      clearCart();
      closeCart();
      router.push(`/pedido/sucesso?${params.toString()}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Nao foi possivel finalizar o pedido.",
      );
    } finally {
      setSubmitPending(false);
    }
  }

  return (
    <main className="shell py-8 md:py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_24rem] xl:grid-cols-[minmax(0,1.3fr)_25rem]">
        <section className="space-y-6">
          <div className="panel rounded-[2rem] px-6 py-6 md:px-8">
            <p className="eyebrow mb-3">Pedido online</p>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-[3.3rem]">
                  Feche seu pedido com entrega ou retirada.
                </h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-muted">
                  Revise os itens, confirme seu telefone e envie tudo em uma unica
                  etapa, sem sair da tela.
                </p>
              </div>
              <Link
                className="inline-flex rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-foreground transition hover:border-[#d7b386] hover:bg-[#fff0dd]"
                href="/#cardapio"
              >
                Voltar ao cardapio
              </Link>
            </div>
          </div>

          <section className="panel rounded-[2rem] px-6 py-6 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">Seu pedido</p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Itens escolhidos
                </h2>
              </div>
              <span className="rounded-full bg-[#fff0dd] px-4 py-2 text-sm font-semibold text-[#a55a20]">
                {state.items.length} {state.items.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {state.items.length === 0 ? (
              <div className="mt-5 rounded-[1.6rem] border border-dashed border-line bg-white/80 px-5 py-8 text-center">
                <p className="text-lg font-semibold text-foreground">
                  Seu carrinho esta vazio.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Volte para o cardapio e adicione lanches, combos, pasteis,
                  tapiocas ou acai para continuar.
                </p>
                <Link
                  className="mt-5 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
                  href="/#cardapio"
                >
                  Escolher itens
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {state.items.map((item) => (
                  <article
                    key={item.id}
                    className="grid gap-4 rounded-[1.6rem] border border-line bg-white/88 p-4 md:grid-cols-[5.5rem_minmax(0,1fr)_auto]"
                  >
                    <div className="relative h-22 overflow-hidden rounded-[1.15rem] bg-background-strong md:h-24">
                      <Image
                        alt={item.name}
                        className="object-cover"
                        fill
                        sizes="96px"
                        src={resolveMenuItemImage(item.imageUrl)}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{item.name}</h3>
                          <p className="mt-1 text-[0.72rem] uppercase tracking-[0.18em] text-muted">
                            {item.categoryName}
                          </p>
                        </div>
                        <p className="menu-price text-xl font-bold text-accent">
                          {formatMoney(item.price * item.quantity)}
                        </p>
                      </div>

                      <div className="mt-3 rounded-[1.1rem] bg-[#fff6ea] px-4 py-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#a06f42]">
                          Observacao do item
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#6f5d4a]">
                          {item.notes || "Sem observacao para este item."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row items-center justify-between gap-3 md:flex-col md:items-end">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#dfceb8] bg-[#fff8ef] p-1">
                        <button
                          aria-label="Diminuir quantidade"
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#5d5142] transition hover:bg-[#f7efdf]"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          type="button"
                        >
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                          >
                            <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <span className="min-w-8 text-center text-base font-bold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          aria-label="Aumentar quantidade"
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#5d5142] transition hover:bg-[#f7efdf]"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          type="button"
                        >
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M12 5v14m-7-7h14"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                      <button
                        className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeItem(item.id)}
                        type="button"
                      >
                        Remover
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel rounded-[2rem] px-6 py-6 md:px-8">
            <p className="eyebrow mb-3">Como quer receber</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Entrega ou retirada
            </h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <button
                className={`cursor-pointer rounded-[1.4rem] border px-5 py-4 text-left transition ${
                  fulfillmentType === "delivery"
                    ? "border-[#d97428] bg-[#fff0dd] shadow-[0_18px_30px_rgba(219,115,36,0.12)]"
                    : "border-line bg-white hover:border-[#e3c3a0]"
                }`}
                onClick={() => setFulfillmentType("delivery")}
                type="button"
              >
                <p className="text-lg font-semibold text-foreground">Entrega</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Calcule o frete por bairro ou CEP e receba em casa.
                </p>
              </button>
              <button
                className={`cursor-pointer rounded-[1.4rem] border px-5 py-4 text-left transition ${
                  fulfillmentType === "retirada"
                    ? "border-[#567b35] bg-[#eef5e8] shadow-[0_18px_30px_rgba(86,123,53,0.12)]"
                    : "border-line bg-white hover:border-[#c7d9b5]"
                }`}
                onClick={() => setFulfillmentType("retirada")}
                type="button"
              >
                <p className="text-lg font-semibold text-foreground">Retirada</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Retire direto na loja e finalize sem custo de entrega.
                </p>
              </button>
            </div>

            {fulfillmentType === "delivery" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-foreground">
                    Rua
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-[#d97428] focus:ring-2 focus:ring-[#f0b37d]/40"
                    onChange={(event) => setStreet(event.target.value)}
                    placeholder="Rua, avenida..."
                    value={street}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-foreground">
                    Numero
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-[#d97428] focus:ring-2 focus:ring-[#f0b37d]/40"
                    onChange={(event) => setNumber(event.target.value)}
                    placeholder="123"
                    value={number}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-foreground">
                    Complemento
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-[#d97428] focus:ring-2 focus:ring-[#f0b37d]/40"
                    onChange={(event) => setComplement(event.target.value)}
                    placeholder="Apto, bloco, casa..."
                    value={complement}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-foreground">
                    Bairro
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-[#d97428] focus:ring-2 focus:ring-[#f0b37d]/40"
                    onChange={(event) => setNeighborhood(event.target.value)}
                    placeholder="Centro"
                    value={neighborhood}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-foreground">
                    Cidade
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-[#d97428] focus:ring-2 focus:ring-[#f0b37d]/40"
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Sao Paulo"
                    value={city}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-foreground">
                    Estado
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-line bg-white px-4 py-3 uppercase outline-none transition focus:border-[#d97428] focus:ring-2 focus:ring-[#f0b37d]/40"
                    maxLength={2}
                    onChange={(event) => setStateCode(event.target.value.toUpperCase())}
                    placeholder="SP"
                    value={stateCode}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-foreground">
                    CEP
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-[#d97428] focus:ring-2 focus:ring-[#f0b37d]/40"
                    onChange={(event) => setZipCode(event.target.value)}
                    placeholder="00000-000"
                    value={zipCode}
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-foreground">
                    Referencia
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-[#d97428] focus:ring-2 focus:ring-[#f0b37d]/40"
                    onChange={(event) => setReference(event.target.value)}
                    placeholder="Perto de..."
                    value={reference}
                  />
                </label>
              </div>
            ) : (
              <div className="mt-6 rounded-[1.4rem] border border-[#d9e6cb] bg-[#f4f8ef] px-5 py-4 text-sm leading-6 text-[#567b35]">
                Retirada selecionada. O pedido sera separado para buscar na{" "}
                {brandContent.location}.
              </div>
            )}

            {fulfillmentType === "delivery" ? (
              <div className="mt-5 rounded-[1.4rem] border border-line bg-white/85 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Status do frete
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      {deliveryQuoteLoading
                        ? "Calculando frete..."
                        : deliveryQuote
                          ? `${deliveryQuote.rule.label} • ${formatMoney(deliveryQuote.feeAmount)}`
                          : deliveryQuoteError
                            ? deliveryQuoteError
                            : "Preencha cidade, estado e bairro ou CEP para calcular."}
                    </p>
                  </div>
                  {deliveryQuote ? (
                    <span className="rounded-full bg-[#eef5e8] px-4 py-2 text-sm font-semibold text-[#567b35]">
                      {deliveryQuote.estimatedMinMinutes && deliveryQuote.estimatedMaxMinutes
                        ? `${deliveryQuote.estimatedMinMinutes}-${deliveryQuote.estimatedMaxMinutes} min`
                        : "Entrega disponivel"}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="panel rounded-[2rem] px-6 py-6 md:px-8">
            <p className="eyebrow mb-3">Seus dados</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Quem vai receber o pedido
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-foreground">
                  Nome
                </span>
                <input
                  className="w-full rounded-[1rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-[#d97428] focus:ring-2 focus:ring-[#f0b37d]/40"
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Seu nome"
                  value={customerName}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-foreground">
                  Telefone
                </span>
                <input
                  className="w-full rounded-[1rem] border border-line bg-white px-4 py-3 outline-none transition focus:border-[#d97428] focus:ring-2 focus:ring-[#f0b37d]/40"
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="(11) 99999-0000"
                  value={customerPhone}
                />
              </label>
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-line bg-white/85 px-5 py-4">
              <p className="text-sm font-semibold text-foreground">Sessao atual</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {isLoadingCustomer
                  ? "Verificando se ja existe telefone validado..."
                  : verificationConfirmed
                    ? "Telefone validado para esta sessao."
                    : "Voce vai validar o telefone na etapa final antes de enviar."}
              </p>
            </div>
          </section>

          <section className="panel rounded-[2rem] px-6 py-6 md:px-8">
            <p className="eyebrow mb-3">Pagamento</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Como vai pagar
            </h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {paymentOptions.map((option) => (
                <button
                  key={option.value}
                  className={`cursor-pointer rounded-[1.3rem] border px-4 py-4 text-left transition ${
                    paymentMethod === option.value
                      ? "border-[#d97428] bg-[#fff0dd]"
                      : "border-line bg-white hover:border-[#e3c3a0]"
                  }`}
                  onClick={() => setPaymentMethod(option.value)}
                  type="button"
                >
                  <p className="text-base font-semibold text-foreground">{option.label}</p>
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold text-foreground">
                Observacao geral do pedido
              </span>
              <textarea
                className="min-h-28 w-full rounded-[1rem] border border-line bg-white px-4 py-3 outline-none transition placeholder:text-[#b9a490] focus:border-[#d97428] focus:ring-2 focus:ring-[#f0b37d]/40"
                maxLength={250}
                onChange={(event) => setOrderNotes(event.target.value)}
                placeholder="Ex.: enviar guardanapo, troco para 50, tocar interfone..."
                value={orderNotes}
              />
            </label>
          </section>

          <section className="panel rounded-[2rem] px-6 py-6 md:px-8">
            <p className="eyebrow mb-3">Confirmacao do telefone</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Valide seu WhatsApp antes de finalizar
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              O pedido so e enviado depois que o telefone for confirmado. Assim a
              loja consegue localizar voce e atualizar o status sem erro.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  verificationConfirmed
                    ? "bg-[#eef5e8] text-[#567b35]"
                    : verificationPending
                      ? "bg-[#fff0dd] text-[#a55a20]"
                      : verificationRequested
                        ? "bg-[#f4ead9] text-[#7a664e]"
                        : "bg-[#f4ead9] text-[#7a664e]"
                }`}
              >
                {verificationConfirmed
                  ? "Validado"
                  : verificationPending
                    ? "Validando"
                    : verificationRequested
                      ? "Codigo solicitado"
                      : "Aguardando envio"}
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto]">
              <button
                className="cursor-pointer rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
                disabled={!canRequestVerification}
                onClick={handleRequestVerification}
                type="button"
              >
                {verificationPending ? "Enviando..." : "Solicitar codigo"}
              </button>

              <input
                className="rounded-[1rem] border border-line bg-white px-4 py-3 tracking-[0.3em] outline-none transition placeholder:tracking-normal focus:border-[#d97428] focus:ring-2 focus:ring-[#f0b37d]/40"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) =>
                  setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Digite o codigo"
                value={verificationCode}
              />

              <button
                className="cursor-pointer rounded-full bg-[#567b35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#47652b] disabled:cursor-not-allowed disabled:opacity-55"
                disabled={verificationCode.length !== 6 || verificationPending}
                onClick={handleConfirmVerification}
                type="button"
              >
                {verificationPending ? "Confirmando..." : "Confirmar codigo"}
              </button>
            </div>

            {devCodePreview ? (
              <div className="mt-4 rounded-[1.3rem] border border-[#d9e6cb] bg-[#f4f8ef] px-4 py-4 text-sm text-[#47652b]">
                <p className="font-semibold">Codigo para desenvolvimento</p>
                <p className="mt-2">
                  Use <strong>{devCodePreview}</strong> para testar localmente.
                </p>
              </div>
            ) : null}

            {verificationMessage ? (
              <div className="mt-4 rounded-[1.3rem] border border-[#e3d2bc] bg-white px-4 py-4 text-sm text-[#6f5d4a]">
                {verificationMessage}
              </div>
            ) : null}

            {verificationError ? (
              <div className="mt-4 rounded-[1.3rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                {verificationError}
              </div>
            ) : null}
          </section>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className="panel rounded-[2rem] px-6 py-6">
            <p className="eyebrow mb-3">Resumo</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Fechamento do pedido
            </h2>

            <div className="mt-5 space-y-3 rounded-[1.5rem] bg-white/88 px-5 py-5">
              <div className="flex items-center justify-between gap-3 text-sm text-muted">
                <span>Modo</span>
                <span className="font-semibold text-foreground">
                  {fulfillmentType === "delivery" ? "Entrega" : "Retirada"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm text-muted">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">
                  {formatMoney(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm text-muted">
                <span>Frete</span>
                <span className="font-semibold text-foreground">
                  {fulfillmentType === "retirada"
                    ? "Gratis"
                    : deliveryQuoteLoading
                      ? "Calculando..."
                      : deliveryQuote
                        ? formatMoney(deliveryFeeAmount)
                        : "Aguardando"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm text-muted">
                <span>Pagamento</span>
                <span className="font-semibold text-foreground">
                  {paymentOptions.find((option) => option.value === paymentMethod)?.label}
                </span>
              </div>
              <div className="soft-divider pt-3" />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="menu-price text-[2rem] font-bold text-accent">
                  {formatMoney(totalAmount)}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <button
                className="w-full cursor-pointer rounded-full bg-accent px-5 py-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
                disabled={!canSubmit}
                onClick={handleSubmitOrder}
                type="button"
              >
                {submitPending ? "Enviando pedido..." : "Finalizar pedido"}
              </button>
              <p className="text-sm leading-6 text-muted">
                O botao libera quando itens, dados, telefone e frete estiverem
                validados.
              </p>
            </div>

            {submitError ? (
              <div className="mt-4 rounded-[1.3rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            <div className="mt-5 rounded-[1.4rem] border border-line bg-white/85 px-4 py-4 text-sm leading-6 text-muted">
              <p className="font-semibold text-foreground">Retirada na loja</p>
              <p className="mt-2">{brandContent.location}</p>
              <p>{brandContent.hours}</p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
