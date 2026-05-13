type PriceValue = number | string | { toString(): string } | null | undefined;

function coercePriceValue(value: PriceValue) {
  if (value == null || value === "") {
    return 0;
  }

  return Number(value);
}

type PricedSelection = {
  priceDelta: PriceValue;
  quantity: number;
};

export function sumSelectedOptionDelta(options: PricedSelection[]) {
  return options.reduce(
    (sum, option) => sum + coercePriceValue(option.priceDelta) * option.quantity,
    0,
  );
}

export function calculateLineItemPricing(input: {
  basePrice: PriceValue;
  selectedOptions: PricedSelection[];
  quantity: number;
}) {
  const optionDelta = sumSelectedOptionDelta(input.selectedOptions);
  const unitPrice = coercePriceValue(input.basePrice) + optionDelta;
  const subtotalAmount = unitPrice * input.quantity;

  return {
    optionDelta,
    unitPrice,
    subtotalAmount,
  };
}
