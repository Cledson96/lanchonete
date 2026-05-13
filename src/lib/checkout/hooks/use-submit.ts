import { useCallback, useState } from "react";
import type { CartItem } from "@/lib/contracts/cart";
import type { CreateOrderResponse } from "@/lib/contracts/checkout";
import type { FulfillmentType, PaymentMethod } from "@/lib/contracts/common";
import type { CheckoutJsonReader } from "@/lib/checkout/api-client";
import { buildCheckoutSuccessParams } from "@/lib/checkout/success-params";
import { optionalTrimmed } from "@/lib/utils";

type CheckoutAddressInput = {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  stateCode: string;
  zipCode: string;
  reference: string;
};

type UseCheckoutSubmitInput = {
  canSubmitBase: boolean;
  readJson: CheckoutJsonReader;
  push: (href: string) => void;
  clearCart: () => void;
  closeCart: () => void;
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  orderNotes: string;
  address: CheckoutAddressInput;
};

type CheckoutSubmitPayloadInput = {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  orderNotes: string;
  address: CheckoutAddressInput;
};

function buildCreateOrderPayload(input: CheckoutSubmitPayloadInput) {
  return {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    type: input.fulfillmentType,
    paymentMethod: input.paymentMethod,
    notes: input.orderNotes,
    items: input.items.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      notes: optionalTrimmed(item.notes || ""),
      optionItemIds: item.optionItemIds || [],
      ingredients: item.ingredientCustomizations
        ? Object.entries(item.ingredientCustomizations).map(([ingredientId, quantity]) => ({
            ingredientId,
            quantity,
          }))
        : undefined,
    })),
    address:
      input.fulfillmentType === "delivery"
        ? {
            street: input.address.street,
            number: input.address.number,
            complement: optionalTrimmed(input.address.complement),
            neighborhood: input.address.neighborhood,
            city: input.address.city,
            state: input.address.stateCode.toUpperCase(),
            zipCode: optionalTrimmed(input.address.zipCode),
            reference: optionalTrimmed(input.address.reference),
          }
        : undefined,
  };
}

export function useCheckoutSubmit(input: UseCheckoutSubmitInput) {
  const {
    canSubmitBase,
    readJson,
    push,
    clearCart,
    closeCart,
    items,
    customerName,
    customerPhone,
    fulfillmentType,
    paymentMethod,
    orderNotes,
    address,
  } = input;
  const [submitPending, setSubmitPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmitOrder = useCallback(async () => {
    if (!canSubmitBase || submitPending) return;

    setSubmitPending(true);
    setSubmitError(null);

    try {
      const payload = await readJson<CreateOrderResponse>("/api/orders", {
        method: "POST",
        body: JSON.stringify(
          buildCreateOrderPayload({
            items,
            customerName,
            customerPhone,
            fulfillmentType,
            paymentMethod,
            orderNotes,
            address,
          }),
        ),
      });

      const params = buildCheckoutSuccessParams(payload.order, customerName);
      clearCart();
      closeCart();
      push(`/pedido/sucesso?${params.toString()}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Nao foi possivel finalizar o pedido.",
      );
    } finally {
      setSubmitPending(false);
    }
  }, [
    address,
    canSubmitBase,
    clearCart,
    closeCart,
    customerName,
    customerPhone,
    fulfillmentType,
    items,
    orderNotes,
    paymentMethod,
    push,
    readJson,
    submitPending,
  ]);

  return {
    submitPending,
    submitError,
    handleSubmitOrder,
  };
}
