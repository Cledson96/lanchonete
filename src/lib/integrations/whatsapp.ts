import { sendWhatsAppTextMessage as sendThroughWhatsAppService } from "@/lib/services/whatsapp-service";

export type SendWhatsAppMessageResult = {
  delivered: boolean;
  provider: "whatsapp-web" | "development";
  externalMessageId?: string;
};

export function verifyWhatsAppSignature() {
  return true;
}

export async function sendWhatsAppTextMessage(input: {
  to: string;
  body: string;
}): Promise<SendWhatsAppMessageResult> {
  return sendThroughWhatsAppService(input);
}
