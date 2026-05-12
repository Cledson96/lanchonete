import { useCallback, useEffect, useState } from "react";
import type { CheckoutCustomerSnapshot, CustomerMeResponse } from "@/lib/contracts/checkout";
import { normalizeCheckoutPhoneForCompare } from "@/lib/checkout-client";

type CheckoutJsonReader = <T>(input: RequestInfo, init?: RequestInit) => Promise<T>;

type SyncCustomerOptions = {
  preserveVerified?: boolean;
};

type UseCheckoutCustomerSessionInput = {
  customerPhone: string;
  verifiedPhone: string;
  readJson: CheckoutJsonReader;
  applyCustomerSnapshot: (
    customer: CheckoutCustomerSnapshot,
    options?: SyncCustomerOptions,
  ) => void;
  setCustomerPhone: (phone: string) => void;
  setVerificationConfirmed: (value: boolean) => void;
  setVerificationRequested: (value: boolean) => void;
  setVerificationCode: (value: string) => void;
  setDevCodePreview: (value: string | null) => void;
  setVerificationMessage: (value: string | null) => void;
};

export function useCheckoutCustomerSession(input: UseCheckoutCustomerSessionInput) {
  const {
    customerPhone,
    verifiedPhone,
    readJson,
    applyCustomerSnapshot,
    setCustomerPhone,
    setVerificationConfirmed,
    setVerificationRequested,
    setVerificationCode,
    setDevCodePreview,
    setVerificationMessage,
  } = input;

  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);

  const syncCustomerFromSession = useCallback(
    async (options?: SyncCustomerOptions) => {
      const payload = await readJson<CustomerMeResponse>("/api/customer/me");

      if (!payload.customer) {
        return false;
      }

      setCustomerPhone(payload.customer.phone);
      applyCustomerSnapshot(payload.customer, options);
      return true;
    },
    [applyCustomerSnapshot, readJson, setCustomerPhone],
  );

  useEffect(() => {
    let active = true;

    syncCustomerFromSession({ preserveVerified: true })
      .catch(() => {
        if (!active) return;
      })
      .finally(() => {
        if (active) {
          setIsLoadingCustomer(false);
        }
      });

    return () => {
      active = false;
    };
  }, [syncCustomerFromSession]);

  useEffect(() => {
    const normalizedCurrentPhone = normalizeCheckoutPhoneForCompare(customerPhone);

    if (verifiedPhone && normalizedCurrentPhone !== verifiedPhone) {
      setVerificationConfirmed(false);
      setVerificationRequested(false);
      setVerificationCode("");
      setDevCodePreview(null);
      setVerificationMessage("Telefone alterado. Confirme novamente antes de finalizar.");
    }
  }, [
    customerPhone,
    setDevCodePreview,
    setVerificationCode,
    setVerificationConfirmed,
    setVerificationMessage,
    setVerificationRequested,
    verifiedPhone,
  ]);

  return {
    isLoadingCustomer,
    syncCustomerFromSession,
  };
}
