import type { PaymentMethod } from "@/lib/comanda-ui";

export const paymentMethods: Array<{ value: Exclude<PaymentMethod, null>; label: string }> = [
  { value: "pix", label: "Pix" },
  { value: "cartao_credito", label: "Cartão de crédito" },
  { value: "cartao_debito", label: "Cartão de débito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "outro", label: "Outro" },
];
