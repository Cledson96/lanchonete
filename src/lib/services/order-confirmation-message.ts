import { formatMoney } from "@/lib/utils";

type OrderConfirmationItem = {
  quantity: number;
  subtotalAmount: string | number | { toString(): string };
  notes?: string | null;
  menuItem: {
    id: string;
    name: string;
    ingredients: Array<{
      quantity: number;
      ingredient: {
        id: string;
        name: string;
      };
    }>;
  };
  selectedOptions?: Array<{
    quantity: number;
    unitPriceDelta: string | number | { toString(): string };
    optionItem: {
      name: string;
    };
  }>;
  ingredientCustomizations?: Array<{
    quantity: number;
    ingredient: {
      id: string;
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
  customerName?: string | null;
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

function moneyValue(value: string | number | { toString(): string }) {
  return Number(value);
}

function formatSelectedOptions(options: NonNullable<OrderConfirmationItem["selectedOptions"]>) {
  if (!options.length) {
    return [];
  }

  return options.map((option) => {
    const price = moneyValue(option.unitPriceDelta) * option.quantity;
    const prefix = option.quantity > 1 ? `${option.quantity}x ` : "";
    return `${prefix}${option.optionItem.name} (+${formatMoney(price)})`;
  });
}

function formatIngredientAdjustments(item: OrderConfirmationItem) {
  const baseIngredients = new Map(
    (item.menuItem.ingredients || []).map((entry) => [entry.ingredient.id, entry]),
  );
  const customIngredients = new Map(
    (item.ingredientCustomizations || []).map((entry) => [entry.ingredient.id, entry]),
  );

  const adjustments: string[] = [];

  for (const [ingredientId, base] of baseIngredients) {
    const current = customIngredients.get(ingredientId)?.quantity ?? base.quantity;

    if (current < base.quantity) {
      const removed = base.quantity - current;

      if (current === 0) {
        adjustments.push(`sem ${base.ingredient.name}`);
      } else {
        adjustments.push(`${base.ingredient.name} -${removed}`);
      }
    } else if (current > base.quantity) {
      const extra = current - base.quantity;
      adjustments.push(`${base.ingredient.name} +${extra}`);
    }
  }

  return adjustments;
}

function formatItemLine(item: OrderConfirmationItem, index: number) {
  const options = formatSelectedOptions(item.selectedOptions || []);
  const adjustments = formatIngredientAdjustments(item);

  const lines = [`${index + 1}. ${item.quantity}x ${item.menuItem.name} — ${formatMoney(moneyValue(item.subtotalAmount))}`];

  if (options.length) {
    lines.push(`   Adicionais: ${options.join(", ")}`);
  }

  if (adjustments.length) {
    lines.push(`   Ajustes: ${adjustments.join(", ")}`);
  }

  if (item.notes) {
    lines.push(`   Obs.: ${item.notes}`);
  }

  return lines.join("\n");
}

function buildTrackingUrl(code: string, publicSiteUrl: string) {
  return new URL(`/pedido/${code}`, publicSiteUrl).toString();
}

export function buildOrderConfirmationMessage(
  order: OrderConfirmationInput,
  options: {
    pixKey?: string;
    publicSiteUrl?: string;
    paymentMethodFallback?: OrderConfirmationInput["paymentMethod"];
  } = {},
) {
  const lines = order.items.map((item, index) => formatItemLine(item, index));
  const paymentLabel = paymentMethodLabel(order.paymentMethod || options.paymentMethodFallback || "outro");
  const trackingUrl = buildTrackingUrl(order.code, options.publicSiteUrl || "http://localhost:3000");

  return [
    "✅ Pedido enviado e já está a caminho da preparação.",
    order.customerName ? `Cliente: *${order.customerName}*` : null,
    `Código: *${order.code}*`,
    `Acompanhe seu pedido: ${trackingUrl}`,
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
