export type OrderItemUnitSeed = {
  sequence: number;
  status: "novo";
  comandaEntryId?: string;
};

export function buildOrderItemUnits(quantity: number, comandaEntryId?: string | null): OrderItemUnitSeed[] {
  return Array.from({ length: quantity }, (_, index) => ({
    sequence: index + 1,
    status: "novo" as const,
    ...(comandaEntryId ? { comandaEntryId } : {}),
  }));
}
