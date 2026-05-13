import type { OperationalSummary } from "@/lib/orders/operations";
import type { OrderSummary } from "./types";

export function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
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

export function humanize(value: string) {
  return value.replaceAll("_", " ");
}

export function summarizeIngredientChanges(
  ingredientCustomizations?: OrderSummary["items"][number]["ingredientCustomizations"],
) {
  if (!ingredientCustomizations?.length) return [] as string[];
  return ingredientCustomizations
    .filter((ing) => ing.quantity !== 1)
    .map((ing) => (ing.quantity === 0 ? `sem ${ing.ingredient.name}` : `${ing.quantity}x ${ing.ingredient.name}`));
}

export function summarizeSelectedOptions(
  selectedOptions?: OrderSummary["items"][number]["selectedOptions"],
) {
  if (!selectedOptions?.length) return [] as string[];

  return selectedOptions.map((option) =>
    option.quantity > 1 ? `${option.quantity}x ${option.optionItem.name}` : option.optionItem.name,
  );
}

export function getComandaLabel(order: Pick<OrderSummary, "comanda">) {
  if (!order.comanda) return null;
  return order.comanda.name?.trim() || order.comanda.code.slice(0, 8);
}

export function buildKitchenItems(orders: OrderSummary[]) {
  return orders
    .filter((order) => order.status !== "cancelado" && order.status !== "fechado")
    .flatMap((order) =>
      order.items.flatMap((item) =>
        item.units
          .filter((unit) => unit.status === "novo" || unit.status === "em_preparo" || unit.status === "pronto")
          .map((unit) => ({
            id: unit.id,
            orderId: order.id,
            itemId: item.id,
            unitId: unit.id,
            orderCode: order.code,
            unitStatus: unit.status,
            channel: order.channel,
            type: order.type,
            customerName: order.customerName,
            createdAt: order.createdAt,
            comandaLabel: getComandaLabel(order),
            orderNotes: order.notes,
            itemQuantity: item.quantity,
            unitSequence: unit.sequence,
            name: item.menuItem.name,
            itemNotes: item.notes,
            optionLines: summarizeSelectedOptions(item.selectedOptions),
            ingredientLines: summarizeIngredientChanges(item.ingredientCustomizations),
          })),
      ),
    );
}

export function describeOrderSummary(summary: OperationalSummary) {
  if (summary.isFullyDelivered) return "Todos entregues";
  if (summary.isFullyReady) return "Todos prontos";
  if (summary.isPartiallyDelivered) return "Entrega parcial";
  if (summary.isPartiallyReady) return "Parcial pronto";
  return "Em andamento";
}

export async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || "Não foi possível concluir a ação.");
  }
  return payload;
}
