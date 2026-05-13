import "server-only";

import { Prisma } from "@prisma/client";

export function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}

export function numberFromDecimal(value?: Prisma.Decimal | null) {
  return value ? Number(value) : null;
}

export function coerceNumber(
  value?: Prisma.Decimal | number | string | null,
  fallback = 0,
) {
  if (value == null || value === "") {
    return fallback;
  }

  return value instanceof Prisma.Decimal ? Number(value) : Number(value);
}

export function coerceNullableNumber(value?: Prisma.Decimal | number | string | null) {
  if (value == null || value === "") {
    return null;
  }

  return coerceNumber(value);
}
