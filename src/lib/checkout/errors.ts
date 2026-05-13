export type CheckoutApiErrorPayload = {
  error?: {
    message?: string;
    details?: {
      fieldErrors?: Record<string, string[] | undefined>;
      formErrors?: string[];
    };
  };
};

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
