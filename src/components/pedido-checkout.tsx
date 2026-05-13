"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CheckoutCustomerSnapshot,
  CheckoutStoreStatus,
} from "@/lib/contracts/checkout";
import type { FulfillmentType, PaymentMethod } from "@/lib/contracts/common";
import {
  canSubmitCheckoutOrder,
  getCheckoutUnavailableItems,
  isCheckoutDeliveryAddressValid,
} from "@/lib/checkout/rules";
import { formatCheckoutPhoneNumber } from "@/lib/checkout/formatters";
import { readCheckoutJson } from "@/lib/checkout/api-client";
import { buildCheckoutPricingSummary } from "@/lib/checkout/pricing";
import { useCheckoutDeliveryFlow } from "@/lib/checkout/hooks/use-delivery-flow";
import { useCheckoutCustomerSession } from "@/lib/checkout/hooks/use-customer-session";
import { useCheckoutStoreStatus } from "@/lib/checkout/hooks/use-store-status";
import { useCheckoutSubmit } from "@/lib/checkout/hooks/use-submit";
import { useCheckoutVerification } from "@/lib/checkout/hooks/use-verification";
import { CheckoutCustomerDetailsSection } from "@/components/checkout/checkout-customer-details-section";
import { CheckoutFulfillmentSection } from "@/components/checkout/checkout-fulfillment-section";
import { CheckoutItemsSection } from "@/components/checkout/checkout-items-section";
import { CheckoutPaymentSection } from "@/components/checkout/checkout-payment-section";
import { CheckoutPhoneSection } from "@/components/checkout/checkout-phone-section";
import { CheckoutSummaryAside } from "@/components/checkout/checkout-summary-aside";
import { useCart } from "@/lib/cart-store";

export function PedidoCheckout({
  initialStoreStatus,
}: {
  initialStoreStatus?: CheckoutStoreStatus;
}) {
  const {
    state,
    removeItem,
    updateQuantity,
    clearCart,
    closeCart,
    totalPrice,
  } = useCart();
  const router = useRouter();
  const subtotal = totalPrice;

  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("delivery");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [orderNotes, setOrderNotes] = useState("");

  const {
    street,
    setStreet,
    number,
    setNumber,
    complement,
    setComplement,
    neighborhood,
    setNeighborhood,
    city,
    setCity,
    stateCode,
    setStateCode,
    zipCode,
    setZipCode,
    reference,
    setReference,
    zipLookupLoading,
    zipLookupMessage,
    streetLocked,
    complementLocked,
    neighborhoodLocked,
    cityLocked,
    stateLocked,
    deliveryQuote,
    deliveryQuoteLoading,
    deliveryQuoteError,
    canEditAddressFields,
    applyAddress,
  } = useCheckoutDeliveryFlow({
    fulfillmentType,
    subtotalAmount: subtotal,
    readJson: readCheckoutJson,
  });

  const { storeStatus } = useCheckoutStoreStatus({
    initialStoreStatus,
    readJson: readCheckoutJson,
  });

  const { deliveryFeeAmount, totalAmount } = buildCheckoutPricingSummary({
    subtotalAmount: subtotal,
    fulfillmentType,
    deliveryQuote,
  });

  const syncCustomerFromSessionRef = useRef<
    (options?: { preserveVerified?: boolean }) => Promise<boolean>
  >(async () => false);

  const verification = useCheckoutVerification({
    customerPhone,
    customerName,
    readJson: readCheckoutJson,
    setCustomerName,
    syncCustomerFromSession: (options) => syncCustomerFromSessionRef.current(options),
  });

  const {
    verificationCode,
    setVerificationCode,
    verificationRequested,
    verificationPending,
    verificationConfirmed,
    verifiedPhone,
    verificationMessage,
    verificationError,
    devCodePreview,
    canRequestVerificationAction,
    handleRequestVerification,
    handleConfirmVerification,
  } = verification;

  const {
    setVerificationConfirmed,
    setVerifiedPhone,
    setVerificationMessage,
  } = verification;

  const applyCustomerSnapshot = useCallback((
    customer: CheckoutCustomerSnapshot,
    options?: { preserveVerified?: boolean },
  ) => {
    setCustomerName(customer.fullName || "");
    setPaymentMethod(customer.lastPaymentMethod || "pix");
    applyAddress(customer.defaultAddress);

    if (options?.preserveVerified) {
      setVerificationConfirmed(true);
      setVerifiedPhone(customer.phone);
      setVerificationMessage("Telefone ja validado para esta sessao.");
    }
  }, [
    applyAddress,
    setVerificationConfirmed,
    setVerificationMessage,
    setVerifiedPhone,
  ]);

  const { isLoadingCustomer, syncCustomerFromSession } = useCheckoutCustomerSession({
    readJson: readCheckoutJson,
    applyCustomerSnapshot,
    setCustomerPhone,
  });

  useEffect(() => {
    syncCustomerFromSessionRef.current = syncCustomerFromSession;
  }, [syncCustomerFromSession]);

  const isDeliveryAddressValid = useMemo(
    () =>
      isCheckoutDeliveryAddressValid({
        fulfillmentType,
        street,
        number,
        neighborhood,
        city,
        stateCode,
        deliveryQuote,
        deliveryQuoteError,
      }),
    [
      fulfillmentType,
      street,
      number,
      neighborhood,
      city,
      stateCode,
      deliveryQuote,
      deliveryQuoteError,
    ],
  );

  const unavailableItems = useMemo(
    () => getCheckoutUnavailableItems(state.items),
    [state.items],
  );

  const isMenuAvailableNow = unavailableItems.length === 0;

  const canSubmitBase = canSubmitCheckoutOrder({
    itemsCount: state.items.length,
    customerName,
    customerPhone,
    verificationConfirmed,
    verifiedPhone,
    paymentMethod,
    isDeliveryAddressValid,
    isMenuAvailableNow,
    storeIsOpen: storeStatus.isOpen,
    submitPending: false,
    deliveryQuoteLoading,
  });

  const { submitPending, submitError, handleSubmitOrder } = useCheckoutSubmit({
    canSubmitBase,
    readJson: readCheckoutJson,
    push: router.push,
    clearCart,
    closeCart,
    items: state.items,
    customerName,
    customerPhone,
    fulfillmentType,
    paymentMethod,
    orderNotes,
    address: {
      street,
      number,
      complement,
      neighborhood,
      city,
      stateCode,
      zipCode,
      reference,
    },
  });

  const canSubmit = canSubmitBase && !submitPending;

  return (
    <main className="shell py-8 md:py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_24rem] xl:grid-cols-[minmax(0,1.3fr)_25rem]">
        <section className="space-y-6">
          <div className="panel rounded-[2rem] px-6 py-6 md:px-8">
            <p className="eyebrow mb-3">Pedido online</p>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] md:text-[3.3rem]">
                  Feche seu pedido com entrega ou retirada.
                </h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-[var(--muted)]">
                  Revise os itens, confirme seu telefone e envie tudo em uma unica
                  etapa, sem sair da tela.
                </p>
              </div>
              <Link
                className="inline-flex rounded-[1rem] border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-[0.88rem] font-bold text-[var(--muted)] transition-all duration-300 hover:border-[var(--brand-orange)]/50 hover:bg-[var(--brand-orange)]/5 hover:text-[var(--brand-orange-dark)] hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                href="/#cardapio"
              >
                Voltar ao cardapio
              </Link>
            </div>
          </div>

          <CheckoutPhoneSection
            verificationConfirmed={verificationConfirmed}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            formatPhone={formatCheckoutPhoneNumber}
            isLoadingCustomer={isLoadingCustomer}
            verificationPending={verificationPending}
            verificationRequested={verificationRequested}
            verificationMessage={verificationMessage}
            canRequestVerificationAction={canRequestVerificationAction}
            handleRequestVerification={handleRequestVerification}
            verificationCode={verificationCode}
            setVerificationCode={setVerificationCode}
            handleConfirmVerification={handleConfirmVerification}
            devCodePreview={devCodePreview}
            verificationError={verificationError}
          />

          <CheckoutItemsSection
            items={state.items}
            removeItem={removeItem}
            updateQuantity={updateQuantity}
          />

          <CheckoutFulfillmentSection
            fulfillmentType={fulfillmentType}
            setFulfillmentType={setFulfillmentType}
            zipCode={zipCode}
            setZipCode={setZipCode}
            street={street}
            setStreet={setStreet}
            number={number}
            setNumber={setNumber}
            complement={complement}
            setComplement={setComplement}
            neighborhood={neighborhood}
            setNeighborhood={setNeighborhood}
            city={city}
            setCity={setCity}
            stateCode={stateCode}
            setStateCode={setStateCode}
            reference={reference}
            setReference={setReference}
            canEditAddressFields={canEditAddressFields}
            streetLocked={streetLocked}
            complementLocked={complementLocked}
            neighborhoodLocked={neighborhoodLocked}
            cityLocked={cityLocked}
            stateLocked={stateLocked}
            zipLookupLoading={zipLookupLoading}
            zipLookupMessage={zipLookupMessage}
            deliveryQuote={deliveryQuote}
            deliveryQuoteLoading={deliveryQuoteLoading}
            deliveryQuoteError={deliveryQuoteError}
          />

          <CheckoutCustomerDetailsSection
            customerName={customerName}
            setCustomerName={setCustomerName}
            isLoadingCustomer={isLoadingCustomer}
            verificationConfirmed={verificationConfirmed}
          />

          <CheckoutPaymentSection
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            orderNotes={orderNotes}
            setOrderNotes={setOrderNotes}
          />

        </section>

        <CheckoutSummaryAside
          fulfillmentType={fulfillmentType}
          subtotal={subtotal}
          deliveryQuote={deliveryQuote}
          deliveryQuoteLoading={deliveryQuoteLoading}
          deliveryQuoteError={deliveryQuoteError}
          deliveryFeeAmount={deliveryFeeAmount}
          paymentMethod={paymentMethod}
          totalAmount={totalAmount}
          isMenuAvailableNow={isMenuAvailableNow}
          storeStatus={storeStatus}
          canSubmit={canSubmit}
          handleSubmitOrder={handleSubmitOrder}
          submitPending={submitPending}
          submitError={submitError}
        />
      </div>
    </main>
  );
}
