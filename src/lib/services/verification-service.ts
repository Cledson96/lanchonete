import { createHash, randomInt } from "node:crypto";
import { VerificationPurpose } from "@prisma/client";
import { ApiError } from "@/lib/api/error";
import { prisma } from "@/lib/prisma";
import { getCustomerByPhone } from "@/lib/services/customer-service";
import { setCustomerSession } from "@/lib/auth/session";
import { sendWhatsAppTextMessage } from "@/lib/integrations/whatsapp";
import { normalizePhone } from "@/lib/utils";

const OTP_EXPIRATION_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function generateCode() {
  return String(randomInt(100000, 1000000));
}

export async function requestPhoneVerification(input: {
  phone: string;
  customerName?: string;
}) {
  const phone = normalizePhone(input.phone);
  const customer = await getCustomerByPhone(phone);
  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  await prisma.phoneVerificationChallenge.updateMany({
    where: {
      phone,
      purpose: VerificationPurpose.order_checkout,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  await prisma.phoneVerificationChallenge.create({
    data: {
      phone,
      customerName: input.customerName || customer?.fullName || null,
      customerProfileId: customer?.id,
      codeHash: hashCode(code),
      expiresAt,
      purpose: VerificationPurpose.order_checkout,
    },
  });

  const message = `Seu codigo da lanchonete: ${code}. Ele vale por 10 minutos.`;
  const delivery = await sendWhatsAppTextMessage({
    to: phone,
    body: message,
  });

  return {
    phone,
    expiresAt: expiresAt.toISOString(),
    delivered: delivery.delivered,
    provider: delivery.provider,
    devCodePreview:
      process.env.NODE_ENV === "production" || delivery.provider !== "development"
        ? undefined
        : code,
  };
}

export async function confirmPhoneVerification(input: {
  phone: string;
  code: string;
  customerName?: string;
}) {
  const phone = normalizePhone(input.phone);
  const challenge = await prisma.phoneVerificationChallenge.findFirst({
    where: {
      phone,
      purpose: VerificationPurpose.order_checkout,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    throw new ApiError(404, "Nenhum codigo ativo para este telefone.");
  }

  if (challenge.expiresAt < new Date()) {
    throw new ApiError(410, "Codigo expirado.");
  }

  if (challenge.attemptCount >= MAX_ATTEMPTS) {
    throw new ApiError(429, "Numero maximo de tentativas excedido.");
  }

  if (challenge.codeHash !== hashCode(input.code)) {
    await prisma.phoneVerificationChallenge.update({
      where: { id: challenge.id },
      data: {
        attemptCount: {
          increment: 1,
        },
      },
    });

    throw new ApiError(401, "Codigo invalido.");
  }

  const customer = await prisma.customerProfile.upsert({
    where: { phone },
    create: {
      phone,
      fullName: input.customerName || challenge.customerName || "Cliente",
    },
    update: {
      fullName: input.customerName || challenge.customerName || undefined,
    },
  });

  await prisma.phoneVerificationChallenge.update({
    where: { id: challenge.id },
    data: {
      consumedAt: new Date(),
      customerProfileId: customer.id,
    },
  });

  await setCustomerSession({
    sub: customer.id,
    kind: "customer",
    phone: customer.phone,
    customerProfileId: customer.id,
    verifiedAt: new Date().toISOString(),
  });

  return {
    id: customer.id,
    fullName: customer.fullName,
    phone: customer.phone,
  };
}
