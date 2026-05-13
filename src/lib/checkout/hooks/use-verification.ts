import { useCallback, useEffect, useState } from "react";
import type {
  ConfirmVerificationResponse,
  RequestVerificationResponse,
} from "@/lib/contracts/checkout";
import type { CheckoutJsonReader } from "@/lib/checkout/api-client";
import {
  canRequestCheckoutVerification,
  normalizeCheckoutPhoneForCompare,
} from "@/lib/checkout/rules";

type SyncCustomerFromSession = (options?: { preserveVerified?: boolean }) => Promise<boolean>;

type UseCheckoutVerificationInput = {
  customerPhone: string;
  customerName: string;
  readJson: CheckoutJsonReader;
  setCustomerName: (value: string | ((current: string) => string)) => void;
  syncCustomerFromSession: SyncCustomerFromSession;
};

export function useCheckoutVerification(input: UseCheckoutVerificationInput) {
  const {
    customerPhone,
    customerName,
    readJson,
    setCustomerName,
    syncCustomerFromSession,
  } = input;

  const [verificationCode, setVerificationCode] = useState("");
  const [verificationRequested, setVerificationRequested] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [devCodePreview, setDevCodePreview] = useState<string | null>(null);

  const canRequestVerificationAction = canRequestCheckoutVerification({
    customerPhone,
    verificationPending,
  });

  useEffect(() => {
    const normalizedCurrentPhone = normalizeCheckoutPhoneForCompare(customerPhone);

    if (verifiedPhone && normalizedCurrentPhone !== verifiedPhone) {
      setVerificationConfirmed(false);
      setVerificationRequested(false);
      setVerificationCode("");
      setDevCodePreview(null);
      setVerificationMessage("Telefone alterado. Confirme novamente antes de finalizar.");
    }
  }, [customerPhone, verifiedPhone]);

  const handleRequestVerification = useCallback(async () => {
    setVerificationPending(true);
    setVerificationError(null);
    setVerificationMessage(null);
    setDevCodePreview(null);
    setVerificationCode("");

    try {
      const payload = await readJson<RequestVerificationResponse>(
        "/api/customer/verification/request",
        {
          method: "POST",
          body: JSON.stringify({
            phone: customerPhone,
            customerName,
          }),
        },
      );

      setVerificationRequested(true);
      setVerificationConfirmed(false);
      setVerifiedPhone("");
      setDevCodePreview(payload.devCodePreview || null);
      setVerificationMessage(
        payload.provider === "baileys" && payload.delivered
          ? "Codigo enviado pelo WhatsApp conectado da loja."
          : "WhatsApp real indisponivel no momento. Use o codigo de desenvolvimento abaixo para testar localmente.",
      );
    } catch (error) {
      setVerificationRequested(false);
      setVerificationError(
        error instanceof Error ? error.message : "Nao foi possivel solicitar o codigo.",
      );
    } finally {
      setVerificationPending(false);
    }
  }, [customerName, customerPhone, readJson]);

  const handleConfirmVerification = useCallback(async () => {
    setVerificationPending(true);
    setVerificationError(null);
    setVerificationMessage(null);

    try {
      const payload = await readJson<ConfirmVerificationResponse>(
        "/api/customer/verification/confirm",
        {
          method: "POST",
          body: JSON.stringify({
            phone: customerPhone,
            code: verificationCode,
            customerName,
          }),
        },
      );

      setVerificationConfirmed(true);
      setVerifiedPhone(payload.customer.phone);
      setCustomerName((current) => current || payload.customer.fullName || "");
      const hasSessionCustomer = await syncCustomerFromSession({ preserveVerified: true });
      setVerificationMessage(
        hasSessionCustomer
          ? "Telefone validado com sucesso. Carregamos seu cadastro salvo."
          : "Telefone validado com sucesso.",
      );
    } catch (error) {
      setVerificationConfirmed(false);
      setVerifiedPhone("");
      const message =
        error instanceof Error ? error.message : "Nao foi possivel validar o codigo.";

      if (message === "Codigo expirado.") {
        setVerificationRequested(false);
        setVerificationCode("");
        setDevCodePreview(null);
        setVerificationMessage("Codigo expirado. Solicite um novo codigo para continuar.");
      } else {
        setVerificationError(message);
      }
    } finally {
      setVerificationPending(false);
    }
  }, [
    customerName,
    customerPhone,
    readJson,
    setCustomerName,
    syncCustomerFromSession,
    verificationCode,
  ]);

  return {
    verificationCode,
    setVerificationCode,
    verificationRequested,
    setVerificationRequested,
    verificationPending,
    verificationConfirmed,
    setVerificationConfirmed,
    verifiedPhone,
    setVerifiedPhone,
    verificationMessage,
    setVerificationMessage,
    verificationError,
    devCodePreview,
    setDevCodePreview,
    canRequestVerificationAction,
    handleRequestVerification,
    handleConfirmVerification,
  };
}
