import type { PaymentMethod } from "@/lib/contracts/common";
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
