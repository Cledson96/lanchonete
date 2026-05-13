import { Prisma } from "@prisma/client";
import { coerceNumber } from "@/lib/db/decimal";

type PriceValue = Prisma.Decimal | number | string | null | undefined;

type PricedSelection = {
  priceDelta: PriceValue;
  quantity: number;
};

export function sumSelectedOptionDelta(options: PricedSelection[]) {
  return options.reduce(
    (sum, option) => sum + coerceNumber(option.priceDelta) * option.quantity,
    0,
  );
}

export function calculateLineItemPricing(input: {
  basePrice: PriceValue;
  selectedOptions: PricedSelection[];
  quantity: number;
}) {
  const optionDelta = sumSelectedOptionDelta(input.selectedOptions);
  const unitPrice = coerceNumber(input.basePrice) + optionDelta;
  const subtotalAmount = unitPrice * input.quantity;

  return {
    optionDelta,
    unitPrice,
    subtotalAmount,
  };
}
