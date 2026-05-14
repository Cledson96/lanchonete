import { ApiError } from "@/lib/api/error";
import {
  WHATSAPP_MESSAGE_TEMPLATE_DEFINITIONS,
  WHATSAPP_MESSAGE_TEMPLATE_KEYS,
  type WhatsAppMessageTemplate,
  type WhatsAppMessageTemplateKey,
} from "@/lib/contracts/whatsapp-templates";
import { prisma } from "@/lib/prisma";

const STORE_SLUG = "loja-principal";

const templateFields = {
  public_site_reply: "whatsappPublicSiteReplyMessage",
  order_out_for_delivery: "whatsappOutForDeliveryMessage",
  order_confirmation: "whatsappOrderConfirmationMessage",
  phone_verification_code: "whatsappVerificationCodeMessage",
} as const satisfies Record<WhatsAppMessageTemplateKey, string>;

type StoreTemplateValues = Record<(typeof templateFields)[WhatsAppMessageTemplateKey], string | null>;

function renderTemplate(content: string, variables: Record<string, string | number | null | undefined>) {
  return content
    .replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => String(variables[key] ?? ""))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function getStoreTemplateValues() {
  const store = await prisma.storeProfile.findUnique({
    where: { slug: STORE_SLUG },
    select: {
      whatsappPublicSiteReplyMessage: true,
      whatsappOutForDeliveryMessage: true,
      whatsappOrderConfirmationMessage: true,
      whatsappVerificationCodeMessage: true,
    },
  });

  if (!store) {
    throw new ApiError(500, "Loja principal nao configurada.");
  }

  return store satisfies StoreTemplateValues;
}

export async function listWhatsAppMessageTemplates(): Promise<WhatsAppMessageTemplate[]> {
  const store = await getStoreTemplateValues();

  return WHATSAPP_MESSAGE_TEMPLATE_KEYS.map((key) => {
    const definition = WHATSAPP_MESSAGE_TEMPLATE_DEFINITIONS[key];
    const field = templateFields[key];

    return {
      key,
      ...definition,
      content: store[field] || definition.defaultContent,
    };
  });
}

export async function updateWhatsAppMessageTemplates(
  templates: Partial<Record<WhatsAppMessageTemplateKey, string>>,
) {
  const data = Object.fromEntries(
    Object.entries(templates).map(([key, content]) => [
      templateFields[key as WhatsAppMessageTemplateKey],
      content?.trim() || null,
    ]),
  );

  await prisma.storeProfile.update({
    where: { slug: STORE_SLUG },
    data,
  });

  return listWhatsAppMessageTemplates();
}

export async function renderWhatsAppMessageTemplate(
  key: WhatsAppMessageTemplateKey,
  variables: Record<string, string | number | null | undefined>,
) {
  const store = await getStoreTemplateValues();
  const definition = WHATSAPP_MESSAGE_TEMPLATE_DEFINITIONS[key];
  const content = store[templateFields[key]] || definition.defaultContent;

  return renderTemplate(content, variables);
}
