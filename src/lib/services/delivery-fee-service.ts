import { ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { digitsOnly, numberFromDecimal } from "@/lib/utils";

type DeliveryQuoteInput = {
  zipCode?: string;
  neighborhood?: string;
  city: string;
  state: string;
  subtotalAmount?: number;
};

function normalize(text?: string | null) {
  return (text || "").trim().toLowerCase();
}

export async function resolveDeliveryFeeRule(input: DeliveryQuoteInput) {
  const zipCode = digitsOnly(input.zipCode);
  const city = normalize(input.city);
  const state = normalize(input.state);
  const neighborhood = normalize(input.neighborhood);

  const rules = await prisma.deliveryFeeRule.findMany({
    where: {
      isActive: true,
      city: {
        equals: city,
        mode: "insensitive",
      },
      state: {
        equals: state,
        mode: "insensitive",
      },
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });

  const byZip = rules.find((rule) => {
    const start = digitsOnly(rule.zipCodeStart);
    const end = digitsOnly(rule.zipCodeEnd);

    if (!zipCode || !start || !end) {
      return false;
    }

    return zipCode >= start && zipCode <= end;
  });

  const byNeighborhood = rules.find(
    (rule) => normalize(rule.neighborhood) === neighborhood,
  );

  const matchedRule = byZip || byNeighborhood || null;

  if (!matchedRule) {
    throw new ApiError(422, "Area de entrega nao atendida.");
  }

  const minimumOrderAmount = numberFromDecimal(matchedRule.minimumOrderAmount);
  const freeAboveAmount = numberFromDecimal(matchedRule.freeAboveAmount);

  if (
    typeof input.subtotalAmount === "number" &&
    minimumOrderAmount !== null &&
    input.subtotalAmount < minimumOrderAmount
  ) {
    throw new ApiError(
      422,
      `Pedido abaixo do minimo para entrega (${minimumOrderAmount.toFixed(2)}).`,
    );
  }

  const feeAmount =
    typeof input.subtotalAmount === "number" &&
    freeAboveAmount !== null &&
    input.subtotalAmount >= freeAboveAmount
      ? 0
      : Number(matchedRule.feeAmount);

  return {
    serviceable: true,
    deliveryFeeRuleId: matchedRule.id,
    feeAmount,
    estimatedMinMinutes: matchedRule.estimatedMinMinutes,
    estimatedMaxMinutes: matchedRule.estimatedMaxMinutes,
    rule: {
      id: matchedRule.id,
      label: matchedRule.label,
      city: matchedRule.city,
      state: matchedRule.state,
      neighborhood: matchedRule.neighborhood,
      zipCodeStart: matchedRule.zipCodeStart,
      zipCodeEnd: matchedRule.zipCodeEnd,
      feeAmount,
      minimumOrderAmount,
      freeAboveAmount,
    },
  };
}

export async function getDeliveryFeeRules() {
  return prisma.deliveryFeeRule.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
}
