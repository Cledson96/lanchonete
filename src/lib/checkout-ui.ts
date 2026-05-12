import type { CheckoutOrderSummary, DeliveryQuote } from "@/lib/contracts/checkout";
import type { FulfillmentType, OrderType, PaymentMethod } from "@/lib/contracts/common";
import { coerceNumber } from "@/lib/utils";

type CheckoutSuccessSearchParamsInput = {
  code?: string;
  name?: string;
  type?: string;
  payment?: string;
  total?: string;
};

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

export function buildCheckoutSuccessParams(
  order: CheckoutOrderSummary,
  fallbackCustomerName?: string,
) {
  return new URLSearchParams({
    code: order.code,
    name: order.customerName || fallbackCustomerName || "",
    type: order.type,
    payment: order.paymentMethod,
    total: String(order.totalAmount),
  });
}

export function parseCheckoutSuccessParams(params: CheckoutSuccessSearchParamsInput) {
  return {
    code: params.code,
    name: params.name,
    type: params.type as OrderType | undefined,
    payment: params.payment as PaymentMethod | undefined,
    totalAmount: coerceNumber(params.total),
  };
}
