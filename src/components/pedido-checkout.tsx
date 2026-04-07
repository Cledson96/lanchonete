"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  distanceKm: number;
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
  store: {
    name: string;
    city: string;
    state: string;
    maxDeliveryDistanceKm: number;
  };
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

type RequestVerificationResponse = {
  phone: string;
  expiresAt: string;
  delivered: boolean;
  provider: "whatsapp-web" | "development";
  devCodePreview?: string;
};

type ConfirmVerificationResponse = {
  customer: {
    id: string;
    fullName?: string | null;
    phone: string;
  };
};

type CheckoutAddress = {
  id: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode?: string | null;
  reference?: string | null;
};

type CheckoutCustomerSnapshot = {
  id: string;
  fullName?: string | null;
  phone: string;
  defaultAddress?: CheckoutAddress | null;
  lastPaymentMethod?: PaymentMethod | null;
  lastOrderType?: FulfillmentType | "local" | null;
};

type CustomerMeResponse = {
  customer: {
    id: string;
    fullName?: string | null;
    phone: string;
    defaultAddress?: CheckoutAddress | null;
    lastPaymentMethod?: PaymentMethod | null;
    lastOrderType?: FulfillmentType | "local" | null;
  } | null;
};

type CustomerLookupResponse = {
  customer: CheckoutCustomerSnapshot | null;
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

type ApiErrorPayload = {
  error?: {
    message?: string;
    details?: {
      fieldErrors?: Record<string, string[] | undefined>;
      formErrors?: string[];
    };
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

function formatZipCode(value: string) {
  const digits = digitsOnly(value).slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatPhoneNumber(value: string) {
  let digits = digitsOnly(value);

  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);

  if (digits.length <= 2) {
    return digits.length ? `(${digits}` : "";
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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

function labelField(field: string) {
  const labels: Record<string, string> = {
    customerName: "nome",
    customerPhone: "telefone",
    type: "tipo do pedido",
    paymentMethod: "forma de pagamento",
    items: "itens do pedido",
    address: "endereco",
    street: "rua",
    number: "numero",
    neighborhood: "bairro",
    city: "cidade",
    state: "estado",
    zipCode: "CEP",
    code: "codigo",
    phone: "telefone",
  };

  return labels[field] || field;
}

function getErrorMessage(payload: ApiErrorPayload | null) {
  const fieldErrors = payload?.error?.details?.fieldErrors;
  const formErrors = payload?.error?.details?.formErrors;

  if (fieldErrors) {
    const entries = Object.entries(fieldErrors)
      .flatMap(([field, messages]) =>
        (messages || []).map((message) => `${labelField(field)}: ${message}`),
      )
      .filter(Boolean);

    if (entries.length > 0) {
      return entries.join(" | ");
    }
  }

  if (formErrors?.length) {
    return formErrors.join(" | ");
  }

  return payload?.error?.message || "Nao foi possivel concluir a acao.";
}

async function readJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
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
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [customerLookupMessage, setCustomerLookupMessage] = useState<string | null>(null);
  const [customerLookupPhone, setCustomerLookupPhone] = useState("");

  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [reference, setReference] = useState("");
  const [zipLookupLoading, setZipLookupLoading] = useState(false);
  const [zipLookupMessage, setZipLookupMessage] = useState<string | null>(null);
  const [streetLocked, setStreetLocked] = useState(false);
  const [complementLocked, setComplementLocked] = useState(false);
  const [neighborhoodLocked, setNeighborhoodLocked] = useState(false);
  const [cityLocked, setCityLocked] = useState(false);
  const [stateLocked, setStateLocked] = useState(false);

  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [deliveryQuoteLoading, setDeliveryQuoteLoading] = useState(false);
  const [deliveryQuoteError, setDeliveryQuoteError] = useState<string | null>(null);

  const [submitPending, setSubmitPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const subtotal = totalPrice;
  const deliveryFeeAmount =
    fulfillmentType === "delivery" ? deliveryQuote?.feeAmount || 0 : 0;
  const totalAmount = subtotal + deliveryFeeAmount;
  const cleanZipCode = digitsOnly(zipCode);
  const isZipCodeComplete = cleanZipCode.length === 8;
  const canEditAddressFields = fulfillmentType === "delivery" && isZipCodeComplete;

  const resetAddressLocks = useCallback(() => {
    setStreetLocked(false);
    setComplementLocked(false);
    setNeighborhoodLocked(false);
    setCityLocked(false);
    setStateLocked(false);
  }, []);

  const applyAddress = useCallback((address?: CheckoutAddress | null) => {
    if (!address) return;

    setStreet(address.street || "");
    setNumber(address.number || "");
    setComplement(address.complement || "");
    setNeighborhood(address.neighborhood || "");
    setCity(address.city || "");
    setStateCode(address.state || "");
    setZipCode(address.zipCode || "");
    setReference(address.reference || "");
  }, []);

  const clearAddress = useCallback(() => {
    setStreet("");
    setNumber("");
    setComplement("");
    setNeighborhood("");
    setCity("");
    setStateCode("");
    setZipCode("");
    setReference("");
    resetAddressLocks();
  }, [resetAddressLocks]);

  const applyCustomerSnapshot = useCallback((
    customer: CheckoutCustomerSnapshot,
    options?: { preserveVerified?: boolean },
  ) => {
    setCustomerName(customer.fullName || "");
    setPaymentMethod(customer.lastPaymentMethod || "pix");
    applyAddress(customer.defaultAddress);
    setCustomerLookupPhone(customer.phone);
    setCustomerLookupMessage("Cliente encontrado. Preenchemos os dados salvos.");

    if (options?.preserveVerified) {
      setVerificationConfirmed(true);
      setVerifiedPhone(customer.phone);
      setVerificationMessage("Telefone ja validado para esta sessao.");
    }
  }, [applyAddress]);

  useEffect(() => {
    let active = true;

    readJson<CustomerMeResponse>("/api/customer/me")
      .then((payload) => {
        if (!active || !payload.customer) return;

        setCustomerPhone(payload.customer.phone);
        applyCustomerSnapshot(payload.customer, { preserveVerified: true });
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
  }, [applyCustomerSnapshot]);

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
    const normalizedPhone = normalizePhoneForCompare(customerPhone);

    if (digitsOnly(customerPhone).length < 10) {
      setCustomerLookupLoading(false);
      setCustomerLookupMessage(null);
      return;
    }

    if (normalizedPhone === verifiedPhone || normalizedPhone === customerLookupPhone) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      setCustomerLookupLoading(true);
      setCustomerLookupMessage(null);

      try {
        const payload = await readJson<CustomerLookupResponse>("/api/customer/lookup", {
          method: "POST",
          body: JSON.stringify({
            phone: customerPhone,
          }),
        });

        if (payload.customer) {
          applyCustomerSnapshot(payload.customer);
        } else {
          setCustomerLookupPhone(normalizedPhone);
          setCustomerLookupMessage(
            "Nao encontramos cadastro anterior para esse telefone. Pode continuar e preencher os dados.",
          );
          setCustomerName("");
          setPaymentMethod("pix");
          clearAddress();
        }
      } catch (error) {
        setCustomerLookupMessage(
          error instanceof Error ? error.message : "Nao foi possivel consultar o cadastro.",
        );
      } finally {
        setCustomerLookupLoading(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    customerPhone,
    verifiedPhone,
    customerLookupPhone,
    applyCustomerSnapshot,
    clearAddress,
  ]);

  useEffect(() => {
    if (fulfillmentType !== "delivery") {
      setZipLookupLoading(false);
      setZipLookupMessage(null);
      return;
    }

    if (!cleanZipCode) {
      setZipLookupLoading(false);
      setZipLookupMessage(null);
      resetAddressLocks();
      return;
    }

    if (cleanZipCode.length < 8) {
      setZipLookupLoading(false);
      setZipLookupMessage("Digite um CEP completo para buscar o endereco.");
      resetAddressLocks();
      return;
    }

    const timeout = window.setTimeout(async () => {
      setZipLookupLoading(true);
      setZipLookupMessage(null);

      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Nao foi possivel consultar o CEP.");
        }

        const payload = (await response.json()) as ViaCepResponse;

        if (payload.erro) {
          throw new Error("CEP nao encontrado.");
        }

        const nextStreet = payload.logradouro?.trim() || "";
        const nextComplement = payload.complemento?.trim() || "";
        const nextNeighborhood = payload.bairro?.trim() || "";
        const nextCity = payload.localidade?.trim() || "";
        const nextState = payload.uf?.trim() || "";

        setStreet(nextStreet);
        setComplement(nextComplement);
        setNeighborhood(nextNeighborhood);
        setCity(nextCity);
        setStateCode(nextState);

        setStreetLocked(Boolean(nextStreet));
        setComplementLocked(Boolean(nextComplement));
        setNeighborhoodLocked(Boolean(nextNeighborhood));
        setCityLocked(Boolean(nextCity));
        setStateLocked(Boolean(nextState));
        setZipLookupMessage("Endereco carregado pelo CEP. Edite apenas o que vier em branco.");
      } catch (error) {
        resetAddressLocks();
        setZipLookupMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel preencher o endereco pelo CEP.",
        );
      } finally {
        setZipLookupLoading(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [cleanZipCode, fulfillmentType, zipCode, resetAddressLocks]);

  useEffect(() => {
    if (fulfillmentType !== "delivery") {
      setDeliveryQuote(null);
      setDeliveryQuoteError(null);
      setDeliveryQuoteLoading(false);
      return;
    }

    const hasLocationForQuote =
      street.trim().length >= 2 &&
      number.trim().length >= 1 &&
      city.trim().length >= 2 &&
      stateCode.trim().length >= 2 &&
      neighborhood.trim().length >= 2;

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
            street,
            number,
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
  }, [
    fulfillmentType,
    street,
    number,
    city,
    stateCode,
    neighborhood,
    zipCode,
    subtotal,
  ]);

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
    digitsOnly(customerPhone).length >= 10 && !verificationPending;

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
    setVerificationCode("");

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
        payload.provider === "whatsapp-web" && payload.delivered
          ? "Codigo enviado pelo WhatsApp conectado da loja."
          : "WhatsApp real indisponivel no momento. Use o codigo de desenvolvimento abaixo para testar localmente.",
      );
    } catch (error) {
      setVerificationRequested(false);
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
      const message =
        error instanceof Error ? error.message : "Nao foi possivel validar o codigo.";

      if (message === "Codigo expirado.") {
        setVerificationRequested(false);
        setVerificationCode("");
        setDevCodePreview(null);
        setVerificationMessage("Codigo expirado. Solicite um novo codigo para continuar.");
      } else {
        setVerificationError(message);
      }
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
            notes: optionalTrimmed(item.notes || ""),
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
                <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] md:text-[3.3rem]">
                  Feche seu pedido com entrega ou retirada.
                </h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-[var(--muted)]">
                  Revise os itens, confirme seu telefone e envie tudo em uma unica
                  etapa, sem sair da tela.
                </p>
              </div>
              <Link
                className="inline-flex rounded-[1rem] border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-[0.88rem] font-bold text-[var(--muted)] transition-all duration-300 hover:border-[var(--brand-orange)]/50 hover:bg-[var(--brand-orange)]/5 hover:text-[var(--brand-orange-dark)] hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                href="/#cardapio"
              >
                Voltar ao cardapio
              </Link>
            </div>
          </div>

          <section className="panel rounded-[2rem] px-6 py-6 md:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow mb-3">Primeiro passo</p>
                <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  Informe seu telefone
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Se este numero ja tiver historico na {brandContent.shortName},
                  vamos puxar nome, endereco padrao e a ultima forma de pagamento.
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
                  onChange={(event) => setCustomerPhone(formatPhoneNumber(event.target.value))}
                  placeholder="(11) 99999-0000"
                  value={customerPhone}
                />
              </label>

              <div className="flex items-end">
                <div className="rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                  {customerLookupLoading
                    ? "Buscando cadastro..."
                    : isLoadingCustomer
                      ? "Verificando sessao..."
                      : verificationConfirmed
                        ? "Telefone liberado para finalizar."
                        : "Vamos buscar o historico assim que o numero estiver completo."}
                </div>
              </div>
            </div>

            {customerLookupMessage ? (
              <div className="mt-4 rounded-[1.3rem] border border-[var(--line)] bg-white/88 px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                {customerLookupMessage}
              </div>
            ) : null}
          </section>

          <section className="panel rounded-[2rem] px-6 py-6 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">Seu pedido</p>
                <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  Itens escolhidos
                </h2>
              </div>
              <span className="rounded-full bg-[var(--brand-orange)]/10 px-4 py-2 text-[0.8rem] font-bold text-[var(--brand-orange-dark)]">
                {state.items.length} {state.items.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {state.items.length === 0 ? (
              <div className="mt-5 rounded-[1.6rem] border border-dashed border-[var(--line)] bg-white/80 px-5 py-8 text-center">
                <p className="text-lg font-semibold text-[var(--foreground)]">
                  Seu carrinho esta vazio.
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Volte para o cardapio e adicione lanches, combos, pasteis,
                  tapiocas ou acai para continuar.
                </p>
                <Link
                  className="mt-5 inline-flex rounded-[1.2rem] bg-[var(--brand-orange)] px-6 py-3 text-[0.95rem] font-bold text-white transition-all shadow-[0_4px_14px_rgba(242,122,34,0.3)] hover:bg-[var(--brand-orange-dark)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(242,122,34,0.4)]"
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
                    className="group grid gap-4 rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:shadow-md hover:border-[var(--brand-orange)]/30 md:grid-cols-[6.5rem_minmax(0,1fr)_auto]"
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
                          <h3 className="text-xl font-semibold text-[var(--foreground)]">{item.name}</h3>
                          <p className="mt-1 text-[0.72rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                            {item.categoryName}
                          </p>
                        </div>
                        <p className="menu-price text-xl font-bold text-[var(--brand-orange)]">
                          {formatMoney(item.price * item.quantity)}
                        </p>
                      </div>

                      <div className="mt-3 rounded-[1rem] bg-[var(--brand-orange)]/5 px-4 py-3 border border-[var(--brand-orange)]/10">
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--brand-orange-dark)]">
                          Observacao do item
                        </p>
                        <p className="mt-1 text-[0.85rem] leading-6 text-[var(--foreground)]">
                          {item.notes || "Sem observacao para este item."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row items-center justify-between gap-3 md:flex-col md:items-end">
                      <div className="inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <button
                          aria-label="Diminuir quantidade"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--foreground)] transition-all hover:bg-[var(--brand-green)] hover:text-white active:scale-95"
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
                        <span className="min-w-6 text-center text-[0.95rem] font-bold text-[var(--foreground)]">
                          {item.quantity}
                        </span>
                        <button
                          aria-label="Aumentar quantidade"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--foreground)] transition-all hover:bg-[var(--brand-orange)] hover:text-white active:scale-95"
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
                        className="cursor-pointer rounded-[0.8rem] border border-transparent px-4 py-2 text-[0.85rem] font-semibold text-[var(--muted)] transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 mt-2 md:mt-0"
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
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Entrega ou retirada
            </h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <button
                className={`cursor-pointer rounded-[1.4rem] border px-5 py-4 text-left transition ${
                  fulfillmentType === "delivery"
                    ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 shadow-[0_18px_30px_rgba(242,122,34,0.15)]"
                    : "border-[var(--line)] bg-white hover:border-[var(--brand-orange)]/40 hover:bg-[var(--surface)] hover:shadow-md hover:-translate-y-0.5"
                }`}
                onClick={() => setFulfillmentType("delivery")}
                type="button"
              >
                <p className="text-lg font-semibold text-[var(--foreground)]">Entrega</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Calcule o frete por bairro ou CEP e receba em casa.
                </p>
              </button>
              <button
                className={`cursor-pointer rounded-[1.4rem] border px-5 py-4 text-left transition ${
                  fulfillmentType === "retirada"
                    ? "border-[var(--brand-green)] bg-[var(--brand-green)]/10 shadow-[0_18px_30px_rgba(140,198,63,0.15)]"
                    : "border-[var(--line)] bg-white hover:border-[var(--brand-green)]/40 hover:bg-[var(--surface)] hover:shadow-md hover:-translate-y-0.5"
                }`}
                onClick={() => setFulfillmentType("retirada")}
                type="button"
              >
                <p className="text-lg font-semibold text-[var(--foreground)]">Retirada</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Retire direto na loja e finalize sem custo de entrega.
                </p>
              </button>
            </div>

            {fulfillmentType === "delivery" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    CEP
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
                    inputMode="numeric"
                    onChange={(event) => setZipCode(formatZipCode(event.target.value))}
                    placeholder="00000-000"
                    value={zipCode}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    Rua
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
                    disabled={!canEditAddressFields || streetLocked}
                    onChange={(event) => setStreet(event.target.value)}
                    placeholder={
                      !canEditAddressFields
                        ? "Digite o CEP primeiro"
                        : streetLocked
                          ? "Preenchido pelo CEP"
                          : "Rua, avenida..."
                    }
                    value={street}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    Numero
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
                    disabled={!canEditAddressFields}
                    onChange={(event) => setNumber(event.target.value)}
                    placeholder={!canEditAddressFields ? "Digite o CEP primeiro" : "123"}
                    value={number}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    Complemento
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
                    disabled={!canEditAddressFields || complementLocked}
                    onChange={(event) => setComplement(event.target.value)}
                    placeholder={
                      !canEditAddressFields
                        ? "Digite o CEP primeiro"
                        : complementLocked
                          ? "Preenchido pelo CEP"
                          : "Apto, bloco, casa..."
                    }
                    value={complement}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    Bairro
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
                    disabled={!canEditAddressFields || neighborhoodLocked}
                    onChange={(event) => setNeighborhood(event.target.value)}
                    placeholder={
                      !canEditAddressFields
                        ? "Digite o CEP primeiro"
                        : neighborhoodLocked
                          ? "Preenchido pelo CEP"
                          : "Centro"
                    }
                    value={neighborhood}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    Cidade
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
                    disabled={!canEditAddressFields || cityLocked}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder={
                      !canEditAddressFields
                        ? "Digite o CEP primeiro"
                        : cityLocked
                          ? "Preenchido pelo CEP"
                          : "Curitiba"
                    }
                    value={city}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    Estado
                  </span>
                  <input
                    className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 uppercase outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
                    disabled={!canEditAddressFields || stateLocked}
                    maxLength={2}
                    onChange={(event) => setStateCode(event.target.value.toUpperCase())}
                    placeholder={
                      !canEditAddressFields
                        ? "Digite o CEP primeiro"
                        : stateLocked
                          ? "Preenchido pelo CEP"
                          : "PR"
                    }
                    value={stateCode}
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    Referencia
                  </span>
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
              <div className="mt-6 rounded-[1rem] border border-[var(--brand-green)]/20 bg-[var(--brand-green)]/5 px-5 py-4 text-[0.88rem] leading-6 text-[var(--brand-green-dark)] font-medium">
                Retirada selecionada. O pedido sera separado para buscar na{" "}
                {brandContent.location}.
              </div>
            )}

            {fulfillmentType === "delivery" ? (
              <div className="mt-5 rounded-[1.4rem] border border-[var(--line)] bg-white/85 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Status do frete
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {deliveryQuoteLoading
                        ? "Calculando frete..."
                        : deliveryQuote
                          ? `${deliveryQuote.rule.label} • ${formatMoney(deliveryQuote.feeAmount)} • ${deliveryQuote.distanceKm.toFixed(2)} km`
                          : deliveryQuoteError
                            ? deliveryQuoteError
                            : "Preencha rua, numero, bairro, cidade e estado para calcular."}
                    </p>
                  </div>
                  {deliveryQuote ? (
                    <span className="rounded-full bg-[var(--brand-green)]/10 px-4 py-2 text-[0.8rem] font-bold text-[var(--brand-green-dark)]">
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
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Quem vai receber o pedido
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-1">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  Nome
                </span>
                <input
                  className="w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Seu nome"
                  value={customerName}
                />
              </label>
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-[var(--line)] bg-white/85 px-5 py-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">Sessao atual</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
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
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Como vai pagar
            </h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {paymentOptions.map((option) => (
                <button
                  key={option.value}
                  className={`cursor-pointer rounded-[1.2rem] border px-4 py-4 text-left transition-all duration-300 ${paymentMethod === option.value ? "border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 shadow-[0_8px_20px_rgba(242,122,34,0.15)] -translate-y-0.5" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--brand-orange)]/40 hover:shadow-md hover:-translate-y-0.5"}`}
                  onClick={() => setPaymentMethod(option.value)}
                  type="button"
                >
                  <p className="text-base font-semibold text-[var(--foreground)]">{option.label}</p>
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                Observacao geral do pedido
              </span>
              <textarea
                className="min-h-28 w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 outline-none transition placeholder:text-[var(--muted)]/50 focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
                maxLength={250}
                onChange={(event) => setOrderNotes(event.target.value)}
                placeholder="Ex.: enviar guardanapo, troco para 50, tocar interfone..."
                value={orderNotes}
              />
            </label>
          </section>

          <section className="panel rounded-[2rem] px-6 py-6 md:px-8">
            <p className="eyebrow mb-3">Confirmacao do telefone</p>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Valide seu WhatsApp antes de finalizar
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              O pedido so e enviado depois que o telefone for confirmado. Assim a
              loja consegue localizar voce e atualizar o status sem erro.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  verificationConfirmed
                    ? "bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)]"
                    : verificationPending
                      ? "bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]"
                      : verificationRequested
                        ? "bg-[var(--muted)]/10 text-[var(--muted)]"
                        : "bg-[var(--muted)]/10 text-[var(--muted)]"
                }`}
              >
                {verificationConfirmed
                  ? "Validado"
                  : verificationPending
                    ? "Validando"
                    : verificationMessage?.includes("expirado")
                      ? "Codigo expirado"
                    : verificationRequested
                      ? "Codigo solicitado"
                      : "Aguardando envio"}
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto]">
              <button
                className="cursor-pointer rounded-[1rem] bg-[var(--brand-orange)] px-5 py-3 text-[0.88rem] font-bold text-white transition-all shadow-[0_4px_14px_rgba(242,122,34,0.3)] hover:bg-[var(--brand-orange-dark)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(242,122,34,0.4)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:transform-none"
                disabled={!canRequestVerification}
                onClick={handleRequestVerification}
                type="button"
              >
                {verificationPending
                  ? "Enviando..."
                  : verificationMessage?.includes("expirado")
                    ? "Solicitar novo codigo"
                    : "Solicitar codigo"}
              </button>

              <input
                className="rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 tracking-[0.3em] outline-none transition placeholder:tracking-normal focus:border-[var(--brand-orange)] focus:ring-4 focus:ring-[var(--brand-orange)]/15 shadow-sm"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) =>
                  setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Digite o codigo"
                value={verificationCode}
              />

              <button
                className="cursor-pointer rounded-[1rem] bg-[var(--brand-green)] px-5 py-3 text-[0.88rem] font-bold text-white transition-all shadow-[0_4px_14px_rgba(140,198,63,0.3)] hover:bg-[var(--brand-green-dark)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(140,198,63,0.4)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:transform-none"
                disabled={verificationCode.length !== 6 || verificationPending}
                onClick={handleConfirmVerification}
                type="button"
              >
                {verificationPending ? "Confirmando..." : "Confirmar codigo"}
              </button>
            </div>

            {devCodePreview ? (
              <div className="mt-4 rounded-[1rem] border border-[var(--brand-green)]/20 bg-[var(--brand-green)]/5 px-4 py-4 text-[0.88rem] text-[var(--brand-green-dark)] font-medium">
                <p className="font-semibold">Codigo para desenvolvimento</p>
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
          </section>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className="panel rounded-[2rem] px-6 py-6">
            <p className="eyebrow mb-3">Resumo</p>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Fechamento do pedido
            </h2>

            <div className="mt-5 space-y-3 rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] px-5 py-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
                <span>Modo</span>
                <span className="font-semibold text-[var(--foreground)]">
                  {fulfillmentType === "delivery" ? "Entrega" : "Retirada"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
                <span>Subtotal</span>
                <span className="font-semibold text-[var(--foreground)]">
                  {formatMoney(subtotal)}
                </span>
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
                  {paymentOptions.find((option) => option.value === paymentMethod)?.label}
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
              <button
                className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[var(--brand-green)] px-5 py-4 text-[1rem] font-bold text-white transition-all duration-300 hover:bg-[var(--brand-green-dark)] hover:shadow-[0_8px_25px_rgba(140,198,63,0.4)] hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
                disabled={!canSubmit}
                onClick={handleSubmitOrder}
                type="button"
              >
                <span className="absolute inset-0 z-0 h-full w-full -translate-x-full animate-[sheen_3s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {submitPending ? "Enviando pedido..." : "Finalizar pedido"}
                  <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </span>
              </button>
              <p className="text-sm leading-6 text-[var(--muted)]">
                O botao libera quando itens, dados, telefone e frete estiverem
                validados.
              </p>
            </div>

            {submitError ? (
              <div className="mt-4 rounded-[1.3rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            <div className="mt-5 rounded-[1.4rem] border border-[var(--line)] bg-white/85 px-4 py-4 text-sm leading-6 text-[var(--muted)]">
              <p className="font-semibold text-[var(--foreground)]">Retirada na loja</p>
              <p className="mt-2">{brandContent.location}</p>
              <p>{brandContent.hours}</p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
