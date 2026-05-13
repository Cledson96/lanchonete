import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(45,24,11,0.4)] p-4 backdrop-blur-[3px]">
      <button aria-label="Fechar" className="absolute inset-0" onClick={onClose} type="button" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Compartilhar comanda
            </p>
            <h3 className="mt-0.5 text-lg font-bold leading-tight">{comandaName}</h3>
          </div>
          <button
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--background)]"
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-4 flex justify-center">
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

        <div className="mt-3 flex gap-2">
          <button
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--brand-orange)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-orange-dark)]"
            onClick={() => void handleCopy()}
            type="button"
          >
            <CopyIcon />
            {copyFeedback ?? "Copiar link"}
          </button>
          <a
            className="flex items-center justify-center rounded-full border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background)]"
            href={publicUrl}
            rel="noreferrer"
            target="_blank"
          >
            Abrir
          </a>
        </div>
      </div>
    </div>
  );
}
