import { Prisma } from "@prisma/client";

export function digitsOnly(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

export function normalizePhone(value: string) {
  const digits = digitsOnly(value);

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

export function normalizeZipCode(value?: string | null) {
  const digits = digitsOnly(value);
  return digits || undefined;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function optionalTrimmed(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function optionalNullable(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

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

export function formatMoney(value?: Prisma.Decimal | number | string | null) {
  const numeric =
    value instanceof Prisma.Decimal ? Number(value) : Number(value ?? 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numeric);
}
