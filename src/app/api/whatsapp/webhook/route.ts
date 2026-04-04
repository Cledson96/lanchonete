import { Prisma } from "@prisma/client";
import { config } from "@/lib/config";
import { handleRouteError, ok } from "@/lib/http";
import { sendWhatsAppTextMessage, verifyWhatsAppSignature } from "@/lib/integrations/whatsapp";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";

type IncomingWhatsAppPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        contacts?: Array<{
          wa_id?: string;
          profile?: {
            name?: string;
          };
        }>;
        messages?: Array<{
          id?: string;
          from?: string;
          type?: string;
          text?: {
            body?: string;
          };
        }>;
        statuses?: Array<{
          id?: string;
          status?: "sent" | "delivered" | "read" | "failed";
        }>;
      };
    }>;
  }>;
};

async function storeInboundMessage(payload: {
  phone: string;
  customerName?: string;
  externalMessageId?: string;
  body: string;
}) {
  const customer = await prisma.customerProfile.upsert({
    where: {
      phone: payload.phone,
    },
    create: {
      phone: payload.phone,
      fullName: payload.customerName || "Cliente",
    },
    update: {
      fullName: payload.customerName || undefined,
    },
  });

  const conversation =
    (await prisma.whatsAppConversation.findFirst({
      where: {
        customerProfileId: customer.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })) ||
    (await prisma.whatsAppConversation.create({
      data: {
        customerProfileId: customer.id,
        phone: payload.phone,
        state: "human_handoff",
        lastMessageAt: new Date(),
      },
    }));

  if (payload.externalMessageId) {
    await prisma.whatsAppMessage.upsert({
      where: {
        externalMessageId: payload.externalMessageId,
      },
      create: {
        conversationId: conversation.id,
        externalMessageId: payload.externalMessageId,
        direction: "inbound",
        status: "read",
        content: payload.body,
        readAt: new Date(),
      },
      update: {
        status: "read",
        content: payload.body,
        readAt: new Date(),
      },
    });
  } else {
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "inbound",
        status: "read",
        content: payload.body,
        readAt: new Date(),
      },
    });
  }

  await prisma.whatsAppConversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      lastMessageAt: new Date(),
      state: "human_handoff",
    },
  });

  return {
    conversationId: conversation.id,
    customerId: customer.id,
  };
}

async function storeOutboundMessage(payload: {
  conversationId: string;
  body: string;
  externalMessageId?: string;
}) {
  await prisma.whatsAppMessage.create({
    data: {
      conversationId: payload.conversationId,
      externalMessageId: payload.externalMessageId,
      direction: "outbound",
      status: payload.externalMessageId ? "sent" : "pending",
      content: payload.body,
      sentAt: new Date(),
    },
  });
}

async function updateOutboundStatuses(
  statuses: Array<{ id?: string; status?: "sent" | "delivered" | "read" | "failed" }>,
) {
  await Promise.all(
    statuses
      .filter((status) => status.id && status.status)
      .map((status) =>
        prisma.whatsAppMessage.updateMany({
          where: {
            externalMessageId: status.id,
          },
          data: {
            status: status.status as Prisma.EnumWhatsAppMessageStatusFieldUpdateOperationsInput["set"],
            deliveredAt: status.status === "delivered" ? new Date() : undefined,
            readAt: status.status === "read" ? new Date() : undefined,
            failedAt: status.status === "failed" ? new Date() : undefined,
          },
        }),
      ),
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    challenge &&
    token === config.whatsappVerifyToken
  ) {
    return new Response(challenge, {
      status: 200,
    });
  }

  return new Response("forbidden", {
    status: 403,
  });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    if (
      config.whatsappAppSecret &&
      !verifyWhatsAppSignature(rawBody, request.headers.get("x-hub-signature-256"))
    ) {
      return new Response("invalid signature", {
        status: 401,
      });
    }

    const payload = JSON.parse(rawBody) as IncomingWhatsAppPayload;
    const values =
      payload.entry?.flatMap((entry) => entry.changes?.map((change) => change.value) || []) ||
      [];

    for (const value of values) {
      if (value?.statuses?.length) {
        await updateOutboundStatuses(value.statuses);
      }

      if (!value?.messages?.length) {
        continue;
      }

      const contact = value.contacts?.[0];

      for (const message of value.messages) {
        const body = message.text?.body?.trim();

        if (!body || !message.from) {
          continue;
        }

        const phone = normalizePhone(message.from || contact?.wa_id || "");
        const stored = await storeInboundMessage({
          phone,
          customerName: contact?.profile?.name,
          externalMessageId: message.id,
          body,
        });

        const responseBody =
          "Recebemos sua mensagem por aqui. Em breve o fluxo completo de pedido no WhatsApp vai responder automaticamente usando o mesmo cardapio do site.";
        const sent = await sendWhatsAppTextMessage({
          to: phone,
          body: responseBody,
        });

        await storeOutboundMessage({
          conversationId: stored.conversationId,
          body: responseBody,
          externalMessageId: sent.externalMessageId,
        });
      }
    }

    return ok({ received: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
