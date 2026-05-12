import type { DeliveryQuote } from "@/lib/contracts/checkout";
import type { FulfillmentType, PaymentMethod } from "@/lib/contracts/common";
import { isCategoryAvailableNow } from "@/lib/category-availability";
import { digitsOnly } from "@/lib/utils";

export type CheckoutApiErrorPayload = {
  error?: {
    message?: string;
    details?: {
      fieldErrors?: Record<string, string[] | undefined>;
      formErrors?: string[];
    };
  };
};

type CheckoutAvailabilityItem = {
  categoryAvailability?: {
    availableFrom?: string | null;
    availableUntil?: string | null;
  };
};

export const checkoutPaymentOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "pix", label: "Pix" },
  { value: "cartao_credito", label: "Cartao de credito" },
  { value: "cartao_debito", label: "Cartao de debito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "outro", label: "Outro" },
];

export function formatCheckoutZipCode(value: string) {
  const digits = digitsOnly(value).slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function formatCheckoutPhoneNumber(value: string) {
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

export function normalizeCheckoutPhoneForCompare(value: string) {
  const digits = digitsOnly(value);

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

export function buildCheckoutZipState(input: {
  zipCode: string;
  fulfillmentType: FulfillmentType;
}) {
  const cleanZipCode = digitsOnly(input.zipCode);
  const isZipCodeComplete = cleanZipCode.length === 8;

  return {
    cleanZipCode,
    isZipCodeComplete,
    canEditAddressFields: input.fulfillmentType === "delivery" && isZipCodeComplete,
  };
}

export function hasCheckoutLocationForQuote(input: {
  street: string;
  number: string;
  city: string;
  stateCode: string;
  neighborhood: string;
}) {
  return (
    input.street.trim().length >= 2 &&
    input.number.trim().length >= 1 &&
    input.city.trim().length >= 2 &&
    input.stateCode.trim().length >= 2 &&
    input.neighborhood.trim().length >= 2
  );
}

export function isCheckoutDeliveryAddressValid(input: {
  fulfillmentType: FulfillmentType;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  stateCode: string;
  deliveryQuote: DeliveryQuote | null;
  deliveryQuoteError: string | null;
}) {
  if (input.fulfillmentType !== "delivery") {
    return true;
  }

  return (
    input.street.trim().length >= 2 &&
    input.number.trim().length >= 1 &&
    input.neighborhood.trim().length >= 2 &&
    input.city.trim().length >= 2 &&
    input.stateCode.trim().length === 2 &&
    !!input.deliveryQuote &&
    !input.deliveryQuoteError
  );
}

export function canRequestCheckoutVerification(input: {
  customerPhone: string;
  verificationPending: boolean;
}) {
  return digitsOnly(input.customerPhone).length >= 10 && !input.verificationPending;
}

export function getCheckoutUnavailableItems<T extends CheckoutAvailabilityItem>(items: T[]) {
  return items.filter(
    (item) => item.categoryAvailability && !isCategoryAvailableNow(item.categoryAvailability),
  );
}

export function canSubmitCheckoutOrder(input: {
  itemsCount: number;
  customerName: string;
  customerPhone: string;
  verificationConfirmed: boolean;
  verifiedPhone: string;
  paymentMethod: PaymentMethod;
  isDeliveryAddressValid: boolean;
  isMenuAvailableNow: boolean;
  storeIsOpen: boolean;
  submitPending: boolean;
  deliveryQuoteLoading: boolean;
}) {
  return (
    input.itemsCount > 0 &&
    input.customerName.trim().length >= 2 &&
    digitsOnly(input.customerPhone).length >= 10 &&
    input.verificationConfirmed &&
    input.verifiedPhone === normalizeCheckoutPhoneForCompare(input.customerPhone) &&
    input.paymentMethod &&
    input.isDeliveryAddressValid &&
    input.isMenuAvailableNow &&
    input.storeIsOpen &&
    !input.submitPending &&
    !input.deliveryQuoteLoading
  );
}

function labelCheckoutField(field: string) {
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

export function getCheckoutErrorMessage(payload: CheckoutApiErrorPayload | null) {
  const fieldErrors = payload?.error?.details?.fieldErrors;
  const formErrors = payload?.error?.details?.formErrors;

  if (fieldErrors) {
    const entries = Object.entries(fieldErrors)
      .flatMap(([field, messages]) =>
        (messages || []).map((message) => `${labelCheckoutField(field)}: ${message}`),
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

export function isCheckoutVerificationExpired(message?: string | null) {
  return message?.includes("expirado") ?? false;
}
