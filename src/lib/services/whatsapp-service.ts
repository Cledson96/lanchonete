import { type Message, type MessageAck } from "whatsapp-web.js";
import { Prisma } from "@prisma/client";
import { config } from "@/lib/config";
import { ApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/lib/services/order-service";
import { getPublicMenu } from "@/lib/services/menu-service";
import { getWhatsAppClientManager } from "@/lib/whatsapp-client";
import { digitsOnly, formatMoney, normalizePhone, normalizeZipCode, optionalTrimmed } from "@/lib/utils";

type BotState =
  | "idle"
  | "menu_categoria"
  | "menu_item"
  | "item_quantidade"
  | "item_observacao"
  | "carrinho"
  | "tipo_pedido"
  | "endereco_cep"
  | "endereco_numero"
  | "pagamento"
  | "confirmacao"
  | "human_handoff"
  | "order_updates";

type CartItem = {
  menuItemId: string;
  quantity: number;
  notes?: string;
  optionItemIds: string[];
};

type BotContext = {
  categoryId?: string;
  itemId?: string;
  cart: CartItem[];
  orderType?: "delivery" | "retirada";
  paymentMethod?: "dinheiro" | "cartao_credito" | "cartao_debito" | "pix" | "outro";
  address?: {
    zipCode?: string;
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    number?: string;
    complement?: string;
  };
};

type SendResult = {
  delivered: boolean;
  provider: "whatsapp-web" | "development";
  externalMessageId?: string;
};

const WELCOME_KEYWORDS = new Set(["oi", "ola", "olá", "menu", "cardapio", "cardápio"]);
const PAYMENT_OPTIONS = [
  { key: "1", value: "pix", label: "Pix" },
  { key: "2", value: "cartao_credito", label: "Cartao de credito" },
  { key: "3", value: "cartao_debito", label: "Cartao de debito" },
  { key: "4", value: "dinheiro", label: "Dinheiro" },
  { key: "5", value: "outro", label: "Outro" },
] as const;

let listenersBound = false;

function getDefaultContext(): BotContext {
  return {
    cart: [],
  };
}

function parseBotContext(value: Prisma.JsonValue | null | undefined): BotContext {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return getDefaultContext();
  }

  const candidate = value as Record<string, unknown>;
  const parsedCart = Array.isArray(candidate.cart)
    ? candidate.cart
        .flatMap((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            return [];
          }

          const current = item as Record<string, unknown>;
          if (typeof current.menuItemId !== "string" || typeof current.quantity !== "number") {
            return [];
          }

          return [
            {
              menuItemId: current.menuItemId,
              quantity: current.quantity,
              notes: typeof current.notes === "string" ? current.notes : undefined,
              optionItemIds: Array.isArray(current.optionItemIds)
                ? current.optionItemIds.filter(
                    (entry): entry is string => typeof entry === "string",
                  )
                : [],
            } satisfies CartItem,
          ];
        })
        .filter(Boolean)
    : [];

  const address =
    candidate.address && typeof candidate.address === "object" && !Array.isArray(candidate.address)
      ? (candidate.address as BotContext["address"])
      : undefined;

  return {
    cart: parsedCart,
    categoryId: typeof candidate.categoryId === "string" ? candidate.categoryId : undefined,
    itemId: typeof candidate.itemId === "string" ? candidate.itemId : undefined,
    orderType:
      candidate.orderType === "delivery" || candidate.orderType === "retirada"
        ? candidate.orderType
        : undefined,
    paymentMethod:
      typeof candidate.paymentMethod === "string"
        ? (candidate.paymentMethod as BotContext["paymentMethod"])
        : undefined,
    address,
  };
}

function serializeBotContext(context: BotContext | null | undefined) {
  return context && context.cart.length
    ? ({
        ...context,
        cart: context.cart,
      } satisfies Prisma.InputJsonValue)
    : context && (context.categoryId || context.itemId || context.orderType || context.paymentMethod || context.address)
      ? (context as Prisma.InputJsonValue)
      : Prisma.JsonNull;
}

function categoryMenuText(categories: Awaited<ReturnType<typeof getPublicMenu>>) {
  const lines = categories.map((category, index) => `${index + 1}. ${category.name}`);
  return [
    "🍔 *Cardapio da Lanchonete Familia*",
    "Escolha uma categoria digitando o numero:",
    ...lines,
    "",
    "Digite *cancelar* para limpar a conversa ou *atendente* para falar com a equipe.",
  ].join("\n");
}

function paymentMenuText() {
  return [
    "Como voce vai pagar? Digite o numero:",
    ...PAYMENT_OPTIONS.map((option) => `${option.key}. ${option.label}`),
  ].join("\n");
}

function normalizeInboundText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function getSelectionNumber(text: string) {
  const digits = digitsOnly(text);
  if (!digits) {
    return null;
  }

  return Number.parseInt(digits, 10);
}

async function fetchCepAddress(zipCode: string) {
  const normalized = normalizeZipCode(zipCode);

  if (!normalized || normalized.length !== 8) {
    throw new ApiError(422, "CEP invalido. Digite os 8 numeros do CEP.");
  }

  const response = await fetch(`https://viacep.com.br/ws/${normalized}/json/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(502, "Nao conseguimos consultar esse CEP agora.");
  }

  const payload = (await response.json()) as {
    erro?: boolean;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
    complemento?: string;
  };

  if (payload.erro || !payload.logradouro || !payload.bairro || !payload.localidade || !payload.uf) {
    throw new ApiError(
      422,
      "Nao conseguimos localizar esse CEP com rua e bairro completos. Digite outro CEP ou fale com um atendente.",
    );
  }

  return {
    zipCode: normalized,
    street: payload.logradouro,
    neighborhood: payload.bairro,
    city: payload.localidade,
    state: payload.uf,
    complement: optionalTrimmed(payload.complemento),
  };
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

async function getOrCreateConversation(phone: string, customerName?: string) {
  const customer = await ensureCustomer(phone, customerName);
  const existing = await prisma.whatsAppConversation.findFirst({
    where: {
      customerProfileId: customer.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (existing) {
    return {
      customer,
      conversation: existing,
    };
  }

  const conversation = await prisma.whatsAppConversation.create({
    data: {
      customerProfileId: customer.id,
      phone,
      externalThreadId: `${phone}@c.us`,
      state: "idle",
      botContext: serializeBotContext(getDefaultContext()),
      lastMessageAt: new Date(),
    },
  });

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
  context: BotContext,
  extra?: { orderId?: string | null },
) {
  return prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      state,
      botContext: serializeBotContext(context),
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

function summarizeCartLines(lines: Array<{ name: string; quantity: number; subtotal: number; notes?: string }>) {
  return lines.map((line, index) => {
    const note = line.notes ? ` (${line.notes})` : "";
    return `${index + 1}. ${line.quantity}x ${line.name}${note} — ${formatMoney(line.subtotal)}`;
  });
}

async function cartSummary(context: BotContext) {
  if (!context.cart.length) {
    return "Seu carrinho esta vazio.";
  }

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: {
        in: context.cart.map((item) => item.menuItemId),
      },
    },
  });
  const itemMap = new Map(menuItems.map((item) => [item.id, item]));
  const lines = context.cart.map((item) => {
    const menuItem = itemMap.get(item.menuItemId);
    const unitPrice = Number(menuItem?.price || 0);
    return {
      name: menuItem?.name || "Item",
      quantity: item.quantity,
      notes: item.notes,
      subtotal: unitPrice * item.quantity,
    };
  });
  const total = lines.reduce((sum, line) => sum + line.subtotal, 0);

  return [
    "🧾 *Seu carrinho*",
    ...summarizeCartLines(lines),
    "",
    `Subtotal: ${formatMoney(total)}`,
  ].join("\n");
}

async function createWhatsAppOrder(params: {
  conversation: { id: string; phone: string };
  customer: { id: string; fullName: string; phone: string };
  context: BotContext;
}) {
  if (!params.context.paymentMethod) {
    throw new ApiError(422, "Forma de pagamento ainda nao escolhida.");
  }

  if (!params.context.orderType) {
    throw new ApiError(422, "Tipo de pedido ainda nao escolhido.");
  }

  if (params.context.orderType === "delivery") {
    if (
      !params.context.address?.street ||
      !params.context.address?.number ||
      !params.context.address?.neighborhood ||
      !params.context.address?.city ||
      !params.context.address?.state
    ) {
      throw new ApiError(422, "Endereco incompleto para entrega.");
    }
  }

  return createOrder({
    customerName: params.customer.fullName,
    customerPhone: params.customer.phone,
    customerProfileId: params.customer.id,
    channel: "whatsapp",
    type: params.context.orderType,
    paymentMethod: params.context.paymentMethod,
    notes: "Pedido criado pelo bot do WhatsApp.",
    items: params.context.cart,
    address:
      params.context.orderType === "delivery"
        ? {
            street: params.context.address?.street || "",
            number: params.context.address?.number || "",
            complement: params.context.address?.complement,
            neighborhood: params.context.address?.neighborhood || "",
            city: params.context.address?.city || "",
            state: params.context.address?.state || "",
            zipCode: params.context.address?.zipCode,
          }
        : undefined,
  });
}

async function handleMenuCategorySelection(
  conversation: { id: string; phone: string },
  context: BotContext,
  selection: number | null,
) {
  const categories = await getPublicMenu();

  if (!selection || selection < 1 || selection > categories.length) {
    await sendConversationMessage(conversation, "Nao entendi a categoria. Responda com o numero da categoria desejada.");
    return;
  }

  const category = categories[selection - 1];

  if (!category.menuItems.length) {
    await sendConversationMessage(
      conversation,
      "Essa categoria esta sem itens disponiveis agora. Escolha outra categoria.",
    );
    await updateConversationState(conversation.id, "menu_categoria", context);
    return;
  }

  const nextContext = {
    ...context,
    categoryId: category.id,
    itemId: undefined,
  } satisfies BotContext;

  await updateConversationState(conversation.id, "menu_item", nextContext);

  await sendConversationMessage(
    conversation,
    [
      `Categoria: *${category.name}*`,
      "Escolha um item digitando o numero:",
      ...category.menuItems.map((item, index) => `${index + 1}. ${item.name} — ${formatMoney(item.price)}`),
    ].join("\n"),
  );
}

async function handleMenuItemSelection(
  conversation: { id: string; phone: string },
  context: BotContext,
  selection: number | null,
) {
  const categories = await getPublicMenu();
  const category = categories.find((entry) => entry.id === context.categoryId);

  if (!category) {
    await updateConversationState(conversation.id, "menu_categoria", {
      ...context,
      categoryId: undefined,
      itemId: undefined,
    });
    await sendConversationMessage(conversation, categoryMenuText(categories));
    return;
  }

  if (!selection || selection < 1 || selection > category.menuItems.length) {
    await sendConversationMessage(conversation, "Escolha um item valido da lista dessa categoria.");
    return;
  }

  const item = category.menuItems[selection - 1];
  const nextContext = {
    ...context,
    itemId: item.id,
  } satisfies BotContext;

  await updateConversationState(conversation.id, "item_quantidade", nextContext);

  await sendConversationMessage(
    conversation,
    [
      `*${item.name}*`,
      item.description || "Sem descricao detalhada no momento.",
      `Preco: ${formatMoney(item.price)}`,
      "\nDigite a quantidade desejada.",
    ].join("\n"),
  );
}

async function handleQuantitySelection(
  conversation: { id: string; phone: string },
  context: BotContext,
  selection: number | null,
) {
  if (!context.itemId) {
    await updateConversationState(conversation.id, "menu_categoria", context);
    return;
  }

  if (!selection || selection < 1 || selection > 20) {
    await sendConversationMessage(conversation, "Digite uma quantidade entre 1 e 20.");
    return;
  }

  const nextContext = {
    ...context,
    cart: [
      ...context.cart,
      {
        menuItemId: context.itemId,
        quantity: selection,
        optionItemIds: [],
      },
    ],
  } satisfies BotContext;

  await updateConversationState(conversation.id, "item_observacao", nextContext);
  await sendConversationMessage(
    conversation,
    "Se quiser, envie uma observacao para este item agora. Ex.: sem cebola.\nDigite *0* para continuar sem observacao.",
  );
}

async function handleItemNote(
  conversation: { id: string; phone: string },
  context: BotContext,
  text: string,
) {
  const currentItem = context.cart.at(-1);

  if (!currentItem) {
    await updateConversationState(conversation.id, "menu_categoria", context);
    return;
  }

  if (text !== "0") {
    currentItem.notes = optionalTrimmed(text);
  }

  const nextContext = {
    ...context,
    itemId: undefined,
  } satisfies BotContext;

  await updateConversationState(conversation.id, "carrinho", nextContext);

  await sendConversationMessage(
    conversation,
    [
      await cartSummary(nextContext),
      "",
      "Digite:",
      "1 para adicionar mais itens",
      "2 para continuar o pedido",
      "3 para cancelar tudo",
    ].join("\n"),
  );
}

async function handleCartMenu(
  conversation: { id: string; phone: string },
  context: BotContext,
  selection: number | null,
) {
  if (selection === 1) {
    await updateConversationState(conversation.id, "menu_categoria", {
      ...context,
      categoryId: undefined,
      itemId: undefined,
    });
    await sendConversationMessage(conversation, categoryMenuText(await getPublicMenu()));
    return;
  }

  if (selection === 2) {
    await updateConversationState(conversation.id, "tipo_pedido", context);
    await sendConversationMessage(
      conversation,
      "Como voce quer receber?\n1. Entrega\n2. Retirada",
    );
    return;
  }

  if (selection === 3) {
    const emptyContext = getDefaultContext();
    await updateConversationState(conversation.id, "idle", emptyContext);
    await sendConversationMessage(conversation, "Pedido cancelado. Quando quiser, digite *menu* para começar de novo.");
    return;
  }

  await sendConversationMessage(conversation, "Digite 1, 2 ou 3 para continuar.");
}

async function handleOrderType(
  conversation: { id: string; phone: string },
  context: BotContext,
  selection: number | null,
) {
  if (selection === 1) {
    await updateConversationState(conversation.id, "endereco_cep", {
      ...context,
      orderType: "delivery",
    });
    await sendConversationMessage(conversation, "Digite o CEP da entrega com 8 numeros.");
    return;
  }

  if (selection === 2) {
    await updateConversationState(conversation.id, "pagamento", {
      ...context,
      orderType: "retirada",
    });
    await sendConversationMessage(conversation, paymentMenuText());
    return;
  }

  await sendConversationMessage(conversation, "Digite 1 para entrega ou 2 para retirada.");
}

async function handleCepInput(
  conversation: { id: string; phone: string },
  context: BotContext,
  text: string,
) {
  try {
    const address = await fetchCepAddress(text);
    const nextContext = {
      ...context,
      address: {
        ...context.address,
        ...address,
      },
    } satisfies BotContext;

    await updateConversationState(conversation.id, "endereco_numero", nextContext);
    await sendConversationMessage(
      conversation,
      [
        `Endereco localizado: ${address.street}, ${address.neighborhood} - ${address.city}/${address.state}`,
        "Agora digite o numero do endereco.",
      ].join("\n"),
    );
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Nao conseguimos localizar esse CEP agora.";
    await sendConversationMessage(conversation, message);
  }
}

async function handleAddressNumber(
  conversation: { id: string; phone: string },
  context: BotContext,
  text: string,
) {
  const number = optionalTrimmed(text);

  if (!number) {
    await sendConversationMessage(conversation, "Digite o numero da entrega para continuar.");
    return;
  }

  const nextContext = {
    ...context,
    address: {
      ...context.address,
      number,
    },
  } satisfies BotContext;

  await updateConversationState(conversation.id, "pagamento", nextContext);
  await sendConversationMessage(conversation, paymentMenuText());
}

async function handlePayment(
  conversation: { id: string; phone: string },
  context: BotContext,
  selection: number | null,
) {
  const option = PAYMENT_OPTIONS.find((entry) => Number(entry.key) === selection);

  if (!option) {
    await sendConversationMessage(conversation, "Escolha uma forma de pagamento valida pelo numero.");
    return;
  }

  const nextContext = {
    ...context,
    paymentMethod: option.value,
  } satisfies BotContext;

  await updateConversationState(conversation.id, "confirmacao", nextContext);

  const summary = await cartSummary(nextContext);
  const addressText =
    nextContext.orderType === "delivery"
      ? `Entrega em: ${nextContext.address?.street}, ${nextContext.address?.number} - ${nextContext.address?.neighborhood}`
      : "Retirada na loja";

  await sendConversationMessage(
    conversation,
    [
      summary,
      "",
      `Tipo: ${nextContext.orderType === "delivery" ? "Entrega" : "Retirada"}`,
      addressText,
      `Pagamento: ${option.label}`,
      "",
      "Digite 1 para confirmar o pedido ou 2 para voltar para o carrinho.",
    ].join("\n"),
  );
}

async function handleConfirmation(
  conversation: { id: string; phone: string },
  customer: { id: string; fullName: string; phone: string },
  context: BotContext,
  selection: number | null,
) {
  if (selection === 2) {
    await updateConversationState(conversation.id, "carrinho", context);
    await sendConversationMessage(
      conversation,
      [await cartSummary(context), "", "Voltamos para o carrinho. Digite 1 para adicionar mais itens, 2 para continuar ou 3 para cancelar."].join("\n"),
    );
    return;
  }

  if (selection !== 1) {
    await sendConversationMessage(conversation, "Digite 1 para confirmar ou 2 para voltar.");
    return;
  }

  try {
    const order = await createWhatsAppOrder({
      conversation,
      customer,
      context,
    });

    await updateConversationState(conversation.id, "order_updates", getDefaultContext(), {
      orderId: order.id,
    });

    await sendConversationMessage(
      conversation,
      [
        `✅ Pedido criado com sucesso!`,
        `Codigo: *${order.code}*`,
        `Total: ${formatMoney(order.totalAmount)}`,
        "A equipe ja recebeu seu pedido e vai atualizar voce por aqui.",
      ].join("\n"),
    );
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Nao foi possivel criar o pedido agora.";
    await sendConversationMessage(conversation, `${message}\nDigite *atendente* se quiser ajuda da equipe.`);
  }
}

async function handleBotMessage(message: Message) {
  if (message.fromMe) {
    return;
  }

  const body = message.body?.trim();

  if (!body) {
    return;
  }

  const phone = normalizePhone(message.from.replace(/@c\.us$/, ""));
  const rawMessage = message as Message & {
    _data?: {
      notifyName?: string;
      pushname?: string;
    };
  };
  const name = rawMessage._data?.notifyName || rawMessage._data?.pushname;

  if (!phone.startsWith(config.whatsappAllowedCountryCode)) {
    return;
  }

  const { customer, conversation } = await getOrCreateConversation(phone, name);

  await recordInboundMessage({
    conversationId: conversation.id,
    externalMessageId: message.id.id,
    content: body,
    payload: {
      from: message.from,
      rawType: message.type,
      timestamp: message.timestamp,
    },
  });

  const normalized = normalizeInboundText(body);
  const context = parseBotContext(conversation.botContext);

  await prisma.whatsAppConversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      phone,
      externalThreadId: message.from,
    },
  });

  if (normalized === "atendente") {
    await updateConversationState(conversation.id, "human_handoff", context);
    await sendConversationMessage(
      conversation,
      "Tudo certo. A conversa foi passada para atendimento humano. Quando quiser retomar o bot, digite *menu*.",
    );
    return;
  }

  if (normalized === "cancelar") {
    await updateConversationState(conversation.id, "idle", getDefaultContext());
    await sendConversationMessage(conversation, "Pedido cancelado. Digite *menu* para começar novamente.");
    return;
  }

  if (conversation.state === "human_handoff" && !WELCOME_KEYWORDS.has(normalized)) {
    return;
  }

  if (WELCOME_KEYWORDS.has(normalized)) {
    await updateConversationState(conversation.id, "menu_categoria", getDefaultContext());
    await sendConversationMessage(conversation, categoryMenuText(await getPublicMenu()));
    return;
  }

  if (!config.whatsappBotEnabled) {
    return;
  }

  const selection = getSelectionNumber(normalized);
  const currentState = (conversation.state || "idle") as BotState;

  switch (currentState) {
    case "idle":
      await updateConversationState(conversation.id, "menu_categoria", getDefaultContext());
      await sendConversationMessage(conversation, categoryMenuText(await getPublicMenu()));
      break;
    case "menu_categoria":
      await handleMenuCategorySelection(conversation, context, selection);
      break;
    case "menu_item":
      await handleMenuItemSelection(conversation, context, selection);
      break;
    case "item_quantidade":
      await handleQuantitySelection(conversation, context, selection);
      break;
    case "item_observacao":
      await handleItemNote(conversation, context, body);
      break;
    case "carrinho":
      await handleCartMenu(conversation, context, selection);
      break;
    case "tipo_pedido":
      await handleOrderType(conversation, context, selection);
      break;
    case "endereco_cep":
      await handleCepInput(conversation, context, body);
      break;
    case "endereco_numero":
      await handleAddressNumber(conversation, context, body);
      break;
    case "pagamento":
      await handlePayment(conversation, context, selection);
      break;
    case "confirmacao":
      await handleConfirmation(conversation, customer, context, selection);
      break;
    case "order_updates":
      await sendConversationMessage(
        conversation,
        "Seu pedido ja esta em andamento. Se precisar de ajuda, digite *atendente*.",
      );
      break;
    case "human_handoff":
      break;
    default:
      await updateConversationState(conversation.id, "menu_categoria", getDefaultContext());
      await sendConversationMessage(conversation, categoryMenuText(await getPublicMenu()));
      break;
  }
}

async function updateMessageAck(message: Message, ack: MessageAck) {
  await prisma.whatsAppMessage.updateMany({
    where: {
      externalMessageId: message.id.id,
    },
    data: {
      status:
        ack >= 3
          ? "read"
          : ack >= 2
            ? "delivered"
            : ack >= 1
              ? "sent"
              : "pending",
      deliveredAt: ack >= 2 ? new Date() : undefined,
      readAt: ack >= 3 ? new Date() : undefined,
    },
  });
}

function ensureListenersBound() {
  if (listenersBound) {
    return;
  }

  const manager = getWhatsAppClientManager();
  manager.onInboundMessage((message) => void handleBotMessage(message));
  manager.onMessageAck((message, ack) => void updateMessageAck(message, ack));
  listenersBound = true;
}

export async function getWhatsAppSession() {
  ensureListenersBound();
  return getWhatsAppClientManager().getSessionInfo();
}

export async function connectWhatsAppSession() {
  ensureListenersBound();
  const manager = getWhatsAppClientManager();
  await manager.ensureStarted();
  return manager.getSessionInfo();
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
  ensureListenersBound();

  const to = normalizePhone(input.to);

  if (!to.startsWith(config.whatsappAllowedCountryCode)) {
    throw new ApiError(422, "Telefone fora do pais permitido para o WhatsApp.");
  }

  try {
    const result = await getWhatsAppClientManager().sendTextMessage(to, input.body);
    return {
      delivered: true,
      provider: "whatsapp-web",
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
  return prisma.whatsAppConversation.findMany({
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    include: {
      customerProfile: true,
      order: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function getWhatsAppConversationById(id: string) {
  return prisma.whatsAppConversation.findUnique({
    where: { id },
    include: {
      customerProfile: true,
      order: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
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
    parseBotContext(conversation.botContext),
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
