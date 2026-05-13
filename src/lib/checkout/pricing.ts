import type { DeliveryQuote } from "@/lib/contracts/checkout";
import type { FulfillmentType } from "@/lib/contracts/common";

export function buildCheckoutPricingSummary(input: {
  subtotalAmount: number;
  fulfillmentType: FulfillmentType;
  deliveryQuote: DeliveryQuote | null;
}) {
  const deliveryFeeAmount =
    input.fulfillmentType === "delivery" ? input.deliveryQuote?.feeAmount ?? 0 : 0;

  return {
    subtotalAmount: input.subtotalAmount,
    deliveryFeeAmount,
    totalAmount: input.subtotalAmount + deliveryFeeAmount,
  };
}
