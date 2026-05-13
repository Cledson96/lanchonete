import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CloseIcon, CopyIcon } from "./icons";

export function QrShareModal({
  slug,
  comandaName,
  onClose,
}: {
  slug: string;
  comandaName: string;
  onClose: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const publicUrl =
    typeof window === "undefined"
      ? `/comanda/${slug}`
      : `${window.location.origin}/comanda/${slug}`;

  useEffect(() => {
    let active = true;

    void QRCode.toDataURL(publicUrl, {
      margin: 1,
      width: 320,
      color: { dark: "#1f4d3f", light: "#FFF8F1" },
    })
      .then((value) => {
        if (active) setQrDataUrl(value);
      })
      .catch(() => {
        if (active) setQrDataUrl(null);
      });

    return () => {
      active = false;
    };
  }, [publicUrl]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopyFeedback("Link copiado!");
      window.setTimeout(() => setCopyFeedback(null), 1800);
    } catch {
      setCopyFeedback("Não foi possível copiar agora.");
      window.setTimeout(() => setCopyFeedback(null), 1800);
    }
  }

  return (
    <Modal
      closeIcon={<CloseIcon />}
      eyebrow="Compartilhar comanda"
      footer={
        <div className="flex gap-2">
          <Button fullWidth onClick={() => void handleCopy()}>
            <CopyIcon />
            {copyFeedback ?? "Copiar link"}
          </Button>
          <a
            className="flex items-center justify-center rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background)]"
            href={publicUrl}
            rel="noreferrer"
            target="_blank"
          >
            Abrir
          </a>
        </div>
      }
      onClose={onClose}
      title={comandaName}
    >
      <div className="flex justify-center">
        <div className="rounded-xl border border-[var(--line)] bg-white p-3">
          {qrDataUrl ? (
            <Image alt="QR code" className="h-56 w-56" height={224} src={qrDataUrl} width={224} />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center border border-dashed border-[var(--line)] text-sm text-[var(--muted)]">
              Gerando…
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-[var(--background)] p-2.5 text-xs">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          Link público
        </p>
        <p className="mt-1 break-all font-mono text-[0.7rem] text-[var(--foreground)]">{publicUrl}</p>
      </div>
    </Modal>
  );
}
