export function groupRepeatedIds(ids: string[]) {
  const quantities = new Map<string, number>();

  for (const id of ids) {
    quantities.set(id, (quantities.get(id) || 0) + 1);
  }

  return Array.from(quantities.entries()).map(([id, quantity]) => ({ id, quantity }));
}
