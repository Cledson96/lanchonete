import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "@/lib/config";

type SendWhatsAppMessageInput = {
  to: string;
  body: string;
};

export type SendWhatsAppMessageResult = {
  delivered: boolean;
  provider: "meta" | "development";
  externalMessageId?: string;
};

export function verifyWhatsAppSignature(rawBody: string, signature?: string | null) {
  if (!config.whatsappAppSecret) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expected = `sha256=${createHmac("sha256", config.whatsappAppSecret)
    .update(rawBody)
    .digest("hex")}`;

  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function sendWhatsAppTextMessage({
  to,
  body,
}: SendWhatsAppMessageInput): Promise<SendWhatsAppMessageResult> {
  if (!config.whatsappAccessToken || !config.whatsappPhoneNumberId) {
    console.info("[whatsapp:mock]", { to, body });
    return {
      delivered: false,
      provider: "development",
    };
  }

  const response = await fetch(
    `https://graph.facebook.com/v23.0/${config.whatsappPhoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.whatsappAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[whatsapp:error]", errorBody);
    return {
      delivered: false,
      provider: "meta",
    };
  }

  const payload = (await response.json()) as {
    messages?: Array<{ id?: string }>;
  };

  return {
    delivered: true,
    provider: "meta",
    externalMessageId: payload.messages?.[0]?.id,
  };
}
