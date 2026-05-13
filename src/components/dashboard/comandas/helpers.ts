import {
  canEditComanda,
  type ComandaDetail,
} from "@/lib/comanda-ui";

export async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & {
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || "Não foi possível concluir a ação.");
  }
  return payload;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatElapsed(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours < 24) return rem ? `${hours}h ${rem}min` : `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function describeComandaProgress(comanda: ComandaDetail) {
  if (comanda.operationalSummary.isFullyDelivered) return "Todos entregues";
  if (comanda.operationalSummary.isFullyReady) return "Todos prontos";
  if (comanda.operationalSummary.isPartiallyDelivered) return "Entrega parcial";
  if (comanda.operationalSummary.isPartiallyReady) return "Parcial pronta";
  if (comanda.operationalSummary.preparingUnits > 0) return "Em preparo";
  return "Aguardando preparo";
}

export function sortCommandas(commandas: ComandaDetail[]) {
  return [...commandas].sort((left, right) => {
    const leftActive = canEditComanda(left.status);
    const rightActive = canEditComanda(right.status);
    if (leftActive !== rightActive) return leftActive ? -1 : 1;
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}
