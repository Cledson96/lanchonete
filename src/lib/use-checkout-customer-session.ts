import { useCallback, useEffect, useState } from "react";
import type { CheckoutCustomerSnapshot, CustomerMeResponse } from "@/lib/contracts/checkout";

type CheckoutJsonReader = <T>(input: RequestInfo, init?: RequestInit) => Promise<T>;

type SyncCustomerOptions = {
  preserveVerified?: boolean;
};

type UseCheckoutCustomerSessionInput = {
  readJson: CheckoutJsonReader;
  applyCustomerSnapshot: (
    customer: CheckoutCustomerSnapshot,
    options?: SyncCustomerOptions,
  ) => void;
  setCustomerPhone: (phone: string) => void;
};

export function useCheckoutCustomerSession(input: UseCheckoutCustomerSessionInput) {
  const {
    readJson,
    applyCustomerSnapshot,
    setCustomerPhone,
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

  return {
    isLoadingCustomer,
    syncCustomerFromSession,
  };
}
