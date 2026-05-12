import { useCallback, useEffect, useRef, useState } from "react";
import type { CheckoutAddress, DeliveryQuote, ViaCepResponse } from "@/lib/contracts/checkout";
import {
  buildCheckoutZipState,
  formatCheckoutZipCode,
  hasCheckoutLocationForQuote,
} from "@/lib/checkout-client";
import type { FulfillmentType } from "@/lib/contracts/common";
import { digitsOnly } from "@/lib/utils";

type CheckoutJsonReader = <T>(input: RequestInfo, init?: RequestInit) => Promise<T>;

type UseCheckoutDeliveryFlowInput = {
  fulfillmentType: FulfillmentType;
  subtotalAmount: number;
  readJson: CheckoutJsonReader;
};

type LockableAddressValues = {
  street?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
};

export function useCheckoutDeliveryFlow(input: UseCheckoutDeliveryFlowInput) {
  const { fulfillmentType, subtotalAmount, readJson } = input;

  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [reference, setReference] = useState("");
  const [zipLookupLoading, setZipLookupLoading] = useState(false);
  const [zipLookupMessage, setZipLookupMessage] = useState<string | null>(null);
  const [streetLocked, setStreetLocked] = useState(false);
  const [complementLocked, setComplementLocked] = useState(false);
  const [neighborhoodLocked, setNeighborhoodLocked] = useState(false);
  const [cityLocked, setCityLocked] = useState(false);
  const [stateLocked, setStateLocked] = useState(false);
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [deliveryQuoteLoading, setDeliveryQuoteLoading] = useState(false);
  const [deliveryQuoteError, setDeliveryQuoteError] = useState<string | null>(null);
  const lastZipLookupRef = useRef("");

  const { cleanZipCode, canEditAddressFields } = buildCheckoutZipState({
    zipCode,
    fulfillmentType,
  });

  const resetAddressLocks = useCallback(() => {
    setStreetLocked(false);
    setComplementLocked(false);
    setNeighborhoodLocked(false);
    setCityLocked(false);
    setStateLocked(false);
  }, []);

  const lockAddressFieldsFromValues = useCallback((values: LockableAddressValues) => {
    setStreetLocked(Boolean(values.street?.trim()));
    setComplementLocked(Boolean(values.complement?.trim()));
    setNeighborhoodLocked(Boolean(values.neighborhood?.trim()));
    setCityLocked(Boolean(values.city?.trim()));
    setStateLocked(Boolean(values.state?.trim()));
  }, []);

  const resetQuote = useCallback(() => {
    setDeliveryQuote(null);
    setDeliveryQuoteError(null);
  }, []);

  const clearAddressFields = useCallback((options?: { clearNumber?: boolean; clearReference?: boolean }) => {
    setStreet("");
    setComplement("");
    setNeighborhood("");
    setCity("");
    setStateCode("");

    if (options?.clearNumber) {
      setNumber("");
    }

    if (options?.clearReference) {
      setReference("");
    }
  }, []);

  const applyAddress = useCallback((address?: CheckoutAddress | null) => {
    if (!address) return;

    setStreet(address.street || "");
    setNumber(address.number || "");
    setComplement(address.complement || "");
    setNeighborhood(address.neighborhood || "");
    setCity(address.city || "");
    setStateCode(address.state || "");
    setZipCode(address.zipCode || "");
    setReference(address.reference || "");
    resetAddressLocks();
    lastZipLookupRef.current = digitsOnly(address.zipCode || "");
  }, [resetAddressLocks]);

  useEffect(() => {
    if (fulfillmentType !== "delivery") {
      setZipLookupLoading(false);
      setZipLookupMessage(null);
      return;
    }

    if (!cleanZipCode) {
      setZipLookupLoading(false);
      setZipLookupMessage(null);
      lastZipLookupRef.current = "";
      clearAddressFields({ clearNumber: true, clearReference: true });
      resetQuote();
      resetAddressLocks();
      return;
    }

    if (cleanZipCode.length < 8) {
      setZipLookupLoading(false);
      setZipLookupMessage("Digite um CEP completo para buscar o endereco.");
      clearAddressFields({ clearNumber: true, clearReference: true });
      resetQuote();
      resetAddressLocks();
      return;
    }

    const zipChanged = lastZipLookupRef.current !== cleanZipCode;

    if (zipChanged) {
      clearAddressFields();
      resetQuote();
      resetAddressLocks();
      setZipLookupMessage("Buscando endereco pelo CEP...");
    }

    let active = true;

    const timeout = window.setTimeout(async () => {
      setZipLookupLoading(true);
      setZipLookupMessage(null);

      try {
        const payload = await readJson<ViaCepResponse>(
          `/api/zip-code/lookup?zipCode=${cleanZipCode}`,
          { method: "GET" },
        );

        const nextStreet = payload.street.trim();
        const nextComplement = payload.complement?.trim() || "";
        const nextNeighborhood = payload.neighborhood.trim();
        const nextCity = payload.city.trim();
        const nextState = payload.state.trim();

        if (!active) return;

        setStreet(nextStreet);
        setComplement(nextComplement);
        setNeighborhood(nextNeighborhood);
        setCity(nextCity);
        setStateCode(nextState);
        lockAddressFieldsFromValues({
          street: nextStreet,
          complement: nextComplement,
          neighborhood: nextNeighborhood,
          city: nextCity,
          state: nextState,
        });
        lastZipLookupRef.current = cleanZipCode;
        setZipLookupMessage("Endereco carregado pelo CEP. Edite apenas o que vier em branco.");
      } catch (error) {
        if (!active) return;

        resetAddressLocks();
        setZipLookupMessage(
          error instanceof Error
            ? error.message
            : "Nao foi possivel preencher o endereco pelo CEP.",
        );
      } finally {
        if (active) {
          setZipLookupLoading(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [
    cleanZipCode,
    clearAddressFields,
    fulfillmentType,
    lockAddressFieldsFromValues,
    readJson,
    resetAddressLocks,
    resetQuote,
  ]);

  useEffect(() => {
    if (fulfillmentType !== "delivery") {
      setDeliveryQuote(null);
      setDeliveryQuoteError(null);
      setDeliveryQuoteLoading(false);
      return;
    }

    const hasLocationForQuote = hasCheckoutLocationForQuote({
      street,
      number,
      city,
      stateCode,
      neighborhood,
    });

    if (!hasLocationForQuote) {
      setDeliveryQuote(null);
      setDeliveryQuoteError(null);
      setDeliveryQuoteLoading(false);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setDeliveryQuoteLoading(true);
      setDeliveryQuoteError(null);

      try {
        const payload = await readJson<DeliveryQuote>("/api/delivery-fee/quote", {
          method: "POST",
          body: JSON.stringify({
            street,
            number,
            zipCode,
            neighborhood,
            city,
            state: stateCode.toUpperCase(),
            subtotalAmount,
          }),
        });

        setDeliveryQuote(payload);
      } catch (error) {
        setDeliveryQuote(null);
        setDeliveryQuoteError(
          error instanceof Error ? error.message : "Nao foi possivel calcular o frete.",
        );
      } finally {
        setDeliveryQuoteLoading(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    city,
    fulfillmentType,
    neighborhood,
    number,
    readJson,
    stateCode,
    street,
    subtotalAmount,
    zipCode,
  ]);

  return {
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
    setZipCode: (value: string) => setZipCode(formatCheckoutZipCode(value)),
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
  };
}
