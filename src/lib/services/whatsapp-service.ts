import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api/error";
import { config } from "@/lib/config";
import type { WhatsAppInboxConversationItem, WhatsAppInboxPriority } from "@/lib/contracts/whatsapp";
import { prisma } from "@/lib/prisma";
import { renderWhatsAppMessageTemplate } from "@/lib/services/whatsapp-template-service";
import type {
  WhatsAppInboundMessageEvent,
  WhatsAppMessageStatusEvent,
} from "@/lib/whatsapp-contract";
import { getWhatsAppClientManager } from "@/lib/whatsapp-client";
import { normalizePhone, optionalTrimmed } from "@/lib/utils";

type BotState = "idle" | "human_handoff";

type SendResult = {
  delivered: boolean;
  provider: "baileys" | "development";
  externalMessageId?: string;
};

type WhatsAppInboxConversationRecord = {
  id: string;
  phone: string;
  state: string;
  updatedAt: Date;
  lastInboundAt: Date | null;
  priority: WhatsAppInboxPriority;
  externalThreadId: string | null;
  customerProfile: { fullName: string };
  owner: { id: string; email: string } | null;
  order: { code: string; totalAmount: number } | null;
  messages: Array<{
    content: string;
    direction: "inbound" | "outbound";
    createdAt: Date;
  }>;
};

const WHATSAPP_REENGAGEMENT_WINDOW_MS = 48 * 60 * 60 * 1000;
const PUBLIC_SITE_REPLY_KEY = "public_site_reply";
const WHATSAPP_GROUP_THREAD_SUFFIX = "@g.us";

function stripWhatsAppJidSuffix(value: string) {
  return value.replace(/@(c\.us|s\.whatsapp\.net|lid)$/u, "");
}

function isGroupThread(threadId?: string | null) {
  return threadId?.endsWith(WHATSAPP_GROUP_THREAD_SUFFIX) ?? false;
}

function isConversationPendingReply(conversation: {
  state: string;
  messages: Array<{ direction: "inbound" | "outbound" }>;
}) {
  return conversation.state !== "finalizado" && conversation.messages[0]?.direction === "inbound";
}

function serializeInboxConversation(
  conversation: WhatsAppInboxConversationRecord,
): WhatsAppInboxConversationItem {
  return {
    id: conversation.id,
    phone: conversation.phone,
    state: conversation.state,
    updatedAt: conversation.updatedAt.toISOString(),
    lastInboundAt: conversation.lastInboundAt?.toISOString() || null,
    priority: conversation.priority,
    needsReply: isConversationPendingReply(conversation),
    customerProfile: {
      fullName: conversation.customerProfile.fullName,
    },
    owner: conversation.owner,
    order: conversation.order
      ? {
          code: conversation.order.code,
          totalAmount: Number(conversation.order.totalAmount),
        }
      : null,
    messages: conversation.messages.map((message) => ({
      content: message.content,
      direction: message.direction,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

function normalizeInboundText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

async function buildPublicSiteReplyBody() {
  return renderWhatsAppMessageTemplate("public_site_reply", {
    cardapioUrl: buildPublicCardapioUrl(),
  });
}

function shouldSendPublicSiteReply(lastStandardReplyAt: Date | null | undefined) {
  if (!lastStandardReplyAt) {
    return true;
  }

  return Date.now() - lastStandardReplyAt.getTime() >= WHATSAPP_REENGAGEMENT_WINDOW_MS;
}

async function claimPublicSiteReply(conversationId: string) {
  const now = new Date();
  const cutoff = new Date(Date.now() - WHATSAPP_REENGAGEMENT_WINDOW_MS);

  const result = await prisma.whatsAppConversation.updateMany({
    where: {
      id: conversationId,
      OR: [{ lastStandardReplyAt: null }, { lastStandardReplyAt: { lt: cutoff } }],
    },
    data: {
      lastStandardReplyAt: now,
    },
  });

  return {
    claimed: result.count > 0,
    claimedAt: now,
  };
}

function buildPublicCardapioUrl() {
  return new URL("/#cardapio", config.publicSiteUrl).toString();
}

async function ensureCustomer(phone: string, customerName?: string) {
  return prisma.customerProfile.upsert({
    where: { phone },
    create: {
      phone,
      fullName: optionalTrimmed(customerName) || "Cliente",
    },
    update: {
      fullName: optionalTrimmed(customerName) || undefined,
    },
  });
}

async function getOrCreateConversation(
  phone: string,
  customerName?: string,
  externalThreadId?: string,
) {
  const customer = await ensureCustomer(phone, customerName);
  const threadId = externalThreadId || `${phone}@c.us`;

  const byThread = await prisma.whatsAppConversation.findUnique({
    where: {
      externalThreadId: threadId,
    },
  });

  if (byThread) {
    const conversation = await prisma.whatsAppConversation.update({
      where: { id: byThread.id },
      data: {
        customerProfileId: customer.id,
        phone,
        lastMessageAt: new Date(),
      },
    });

    return {
      customer,
      conversation,
    };
  }

  const existing = await prisma.whatsAppConversation.findFirst({
    where: {
      customerProfileId: customer.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (existing) {
    const conversation = await prisma.whatsAppConversation.update({
      where: { id: existing.id },
      data: {
        phone,
        externalThreadId: existing.externalThreadId || threadId,
        lastMessageAt: new Date(),
      },
    });

    return {
      customer,
      conversation,
    };
  }

  let conversation;
  try {
    conversation = await prisma.whatsAppConversation.create({
      data: {
        customerProfileId: customer.id,
        phone,
        externalThreadId: threadId,
        state: "idle",
        lastMessageAt: new Date(),
      },
    });
  } catch (error) {
    const prismaErrorCode =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : null;

    if (prismaErrorCode === "P2002") {
      const recovered = await prisma.whatsAppConversation.findUnique({
        where: {
          externalThreadId: threadId,
        },
      });

      if (recovered) {
        conversation = await prisma.whatsAppConversation.update({
          where: { id: recovered.id },
          data: {
            customerProfileId: customer.id,
            phone,
            lastMessageAt: new Date(),
          },
        });
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  return {
    customer,
    conversation,
  };
}

async function recordInboundMessage(params: {
  conversationId: string;
  externalMessageId?: string;
  content: string;
  payload?: Prisma.InputJsonValue;
}) {
  if (params.externalMessageId) {
    await prisma.whatsAppMessage.upsert({
      where: { externalMessageId: params.externalMessageId },
      create: {
        conversationId: params.conversationId,
        externalMessageId: params.externalMessageId,
        direction: "inbound",
        status: "read",
        content: params.content,
        payload: params.payload,
        readAt: new Date(),
      },
      update: {
        content: params.content,
        payload: params.payload,
        status: "read",
        readAt: new Date(),
      },
    });
    return;
  }

  await prisma.whatsAppMessage.create({
    data: {
      conversationId: params.conversationId,
      direction: "inbound",
      status: "read",
      content: params.content,
      payload: params.payload,
      readAt: new Date(),
    },
  });
}

async function recordOutboundMessage(params: {
  conversationId: string;
  externalMessageId?: string;
  content: string;
  payload?: Prisma.InputJsonValue;
}) {
  await prisma.whatsAppMessage.create({
    data: {
      conversationId: params.conversationId,
      externalMessageId: params.externalMessageId,
      direction: "outbound",
      status: params.externalMessageId ? "sent" : "pending",
      content: params.content,
      payload: params.payload,
      sentAt: new Date(),
    },
  });
}

async function updateConversationState(
  conversationId: string,
  state: BotState,
  extra?: { orderId?: string | null },
) {
  return prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      state,
      orderId: extra?.orderId,
      lastMessageAt: new Date(),
    },
  });
}

async function sendConversationMessage(
  conversation: { id: string; phone: string },
  body: string,
  payload?: Prisma.InputJsonValue,
) {
  const result = await sendWhatsAppTextMessage({
    to: conversation.phone,
    body,
  });

  await recordOutboundMessage({
    conversationId: conversation.id,
    externalMessageId: result.externalMessageId,
    content: body,
    payload,
  });

  return result;
}

async function sendStandardPublicSiteReply(conversation: { id: string; phone: string }) {
  const claim = await claimPublicSiteReply(conversation.id);

  if (!claim.claimed) {
    return false;
  }

  const body = await buildPublicSiteReplyBody();

  await sendConversationMessage(conversation, body, {
    kind: PUBLIC_SITE_REPLY_KEY,
  });

  return true;
}

export async function handleWhatsAppInboundEvent(message: WhatsAppInboundMessageEvent) {
  if (message.fromMe) {
    return;
  }

  if (isGroupThread(message.from)) {
    return;
  }

  const body = message.body?.trim();

  if (!body) {
    return;
  }

  const phone = normalizePhone(stripWhatsAppJidSuffix(message.from));
  const name = message.notifyName || message.pushName || undefined;

  if (!phone.startsWith(config.whatsappAllowedCountryCode)) {
    return;
  }

  const { conversation } = await getOrCreateConversation(
    phone,
    name,
    message.from,
  );

  await recordInboundMessage({
    conversationId: conversation.id,
    externalMessageId: message.messageId,
    content: body,
    payload: {
      from: message.from,
      rawType: message.rawType,
      timestamp: message.timestamp,
    },
  });

  const normalized = normalizeInboundText(body);
  const now = new Date();

  await prisma.whatsAppConversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: now,
      lastInboundAt: now,
      phone,
      externalThreadId: message.from,
    },
  });

  if (normalized === "atendente") {
    await updateConversationState(conversation.id, "human_handoff");
    return;
  }

  if (conversation.state === "human_handoff") {
    return;
  }

  if (!config.whatsappBotEnabled) {
    return;
  }

  if (!shouldSendPublicSiteReply(conversation.lastStandardReplyAt ? new Date(conversation.lastStandardReplyAt) : null)) {
    return;
  }

  await sendStandardPublicSiteReply(conversation);
}

export async function handleWhatsAppMessageStatusEvent(event: WhatsAppMessageStatusEvent) {
  const delivered = event.status === "delivered" || event.status === "read";
  const read = event.status === "read";

  await prisma.whatsAppMessage.updateMany({
    where: {
      externalMessageId: event.messageId,
    },
    data: {
      status: event.status,
      deliveredAt: delivered ? new Date(event.timestamp) : undefined,
      readAt: read ? new Date(event.timestamp) : undefined,
    },
  });
}

export async function getWhatsAppSession() {
  return getWhatsAppClientManager().getSessionInfo();
}

export async function connectWhatsAppSession() {
  const manager = getWhatsAppClientManager();
  await manager.ensureStarted();
  const deadline = Date.now() + 15_000;
  let session = await manager.getSessionInfo();

  while (
    Date.now() < deadline &&
    session.status === "inicializando" &&
    !session.qrAvailable &&
    !session.lastError
  ) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    session = await manager.getSessionInfo();
  }

  return session;
}

export async function disconnectWhatsAppSession() {
  const manager = getWhatsAppClientManager();
  await manager.disconnect();
  return manager.getSessionInfo();
}

export async function resetWhatsAppSession() {
  const manager = getWhatsAppClientManager();
  await manager.resetSession();
  return manager.getSessionInfo();
}

export async function sendWhatsAppTextMessage(input: {
  to: string;
  body: string;
}): Promise<SendResult> {
  const to = normalizePhone(input.to);

  if (!to.startsWith(config.whatsappAllowedCountryCode)) {
    throw new ApiError(422, "Telefone fora do pais permitido para o WhatsApp.");
  }

  try {
    const result = await getWhatsAppClientManager().sendTextMessage(to, input.body);
    return {
      delivered: true,
      provider: "baileys",
      externalMessageId: result.externalMessageId,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[whatsapp:mock]", { to, body: input.body, error });
      return {
        delivered: false,
        provider: "development",
      };
    }

    throw error;
  }
}

export async function listWhatsAppConversations() {
  const conversations = await prisma.whatsAppConversation.findMany({
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    include: {
      customerProfile: true,
      owner: {
        select: {
          id: true,
          email: true,
        },
      },
      order: {
        select: {
          code: true,
          totalAmount: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (conversations as WhatsAppInboxConversationRecord[])
    .filter((conversation) => !isGroupThread(conversation.externalThreadId))
    .map(serializeInboxConversation);
}

export async function getWhatsAppConversationById(id: string) {
  return prisma.whatsAppConversation.findUnique({
    where: { id },
    include: {
      customerProfile: true,
      owner: {
        select: {
          id: true,
          email: true,
        },
      },
      order: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
      },
    },
  });
}

export async function updateWhatsAppConversationInbox(
  conversationId: string,
  input: {
    priority?: WhatsAppInboxPriority;
    ownerId?: string | null;
  },
) {
  if (typeof input.ownerId !== "undefined" && input.ownerId !== null) {
    const owner = await prisma.user.findUnique({
      where: { id: input.ownerId },
      select: { id: true, isActive: true, role: true },
    });

    if (!owner || !owner.isActive || !["admin", "atendimento"].includes(owner.role)) {
      throw new ApiError(422, "Responsavel invalido para a conversa.");
    }
  }

  return prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      ...(typeof input.priority !== "undefined" ? { priority: input.priority } : {}),
      ...(typeof input.ownerId !== "undefined" ? { ownerId: input.ownerId } : {}),
    },
    include: {
      customerProfile: true,
      owner: {
        select: {
          id: true,
          email: true,
        },
      },
      order: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function sendManualWhatsAppConversationMessage(
  conversationId: string,
  content: string,
) {
  const conversation = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new ApiError(404, "Conversa nao encontrada.");
  }

  await updateConversationState(
    conversation.id,
    "human_handoff",
    { orderId: conversation.orderId },
  );

  const result = await sendConversationMessage(
    {
      id: conversation.id,
      phone: conversation.phone,
    },
    content,
    {
      source: "dashboard",
    },
  );

  return result;
}
