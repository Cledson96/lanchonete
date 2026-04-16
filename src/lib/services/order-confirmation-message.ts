import { formatMoney } from "@/lib/utils";

type OrderConfirmationItem = {
  quantity: number;
  subtotalAmount: string | number | { toString(): string };
  notes?: string | null;
  menuItem: {
    name: string;
  };
  selectedOptions?: Array<{
    quantity: number;
    optionItem: {
      name: string;
    };
  }>;
};

type OrderConfirmationAddress = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string | null;
  reference?: string | null;
};

type OrderConfirmationInput = {
  code: string;
  paymentMethod: "dinheiro" | "cartao_credito" | "cartao_debito" | "pix" | "outro" | null;
  subtotalAmount: string | number | { toString(): string };
  deliveryFeeAmount: string | number | { toString(): string };
  totalAmount: string | number | { toString(): string };
  type: "delivery" | "retirada" | "local";
  items: OrderConfirmationItem[];
  deliveryAddress?: OrderConfirmationAddress | null;
};

type PaymentMethod = Exclude<OrderConfirmationInput["paymentMethod"], null>;

function paymentMethodLabel(paymentMethod: OrderConfirmationInput["paymentMethod"]) {
  const labels: Record<PaymentMethod, string> = {
    dinheiro: "Dinheiro",
    cartao_credito: "Cartao de credito",
    cartao_debito: "Cartao de debito",
    pix: "Pix",
    outro: "Outro",
  };

  return labels[paymentMethod || "outro"];
}

function formatAddress(address: OrderConfirmationAddress) {
  const pieces = [
    `${address.street}, ${address.number}`,
    address.neighborhood,
    `${address.city}/${address.state}`,
  ];

  if (address.complement) {
    pieces.push(`Compl.: ${address.complement}`);
  }

  if (address.reference) {
    pieces.push(`Ref.: ${address.reference}`);
  }

  return pieces.join(" | ");
}

function formatItemLine(item: OrderConfirmationItem, index: number) {
  const notes = item.notes ? ` (${item.notes})` : "";
  const optionNames = (item.selectedOptions || [])
    .map((option) => `${option.quantity}x ${option.optionItem.name}`)
    .filter(Boolean);

  const optionText = optionNames.length ? `\n   Adicionais: ${optionNames.join(", ")}` : "";

  return `${index + 1}. ${item.quantity}x ${item.menuItem.name}${notes} — ${formatMoney(Number(item.subtotalAmount))}${optionText}`;
}

export function buildOrderConfirmationMessage(
  order: OrderConfirmationInput,
  options: { pixKey?: string; paymentMethodFallback?: OrderConfirmationInput["paymentMethod"] } = {},
) {
  const lines = order.items.map((item, index) => formatItemLine(item, index));
  const paymentLabel = paymentMethodLabel(order.paymentMethod || options.paymentMethodFallback || "outro");

  return [
    "✅ Pedido enviado e logo será preparado.",
    `Código: *${order.code}*`,
    "",
    "*Resumo do pedido*",
    ...lines,
    "",
    `Subtotal: ${formatMoney(Number(order.subtotalAmount))}`,
    `Frete: ${formatMoney(Number(order.deliveryFeeAmount))}`,
    `Total: ${formatMoney(Number(order.totalAmount))}`,
    `Pagamento: ${paymentLabel}`,
    order.type === "delivery" && order.deliveryAddress
      ? `Endereço: ${formatAddress(order.deliveryAddress)}`
      : "Retirada na loja.",
    (order.paymentMethod || options.paymentMethodFallback) === "pix"
      ? `PIX da loja: ${options.pixKey || "configure a STORE_PIX_KEY"}\nEnvie o comprovante nesta conversa.`
      : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}
