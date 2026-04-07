import { ok } from "@/lib/http";

export async function GET() {
  return ok({
    active: false,
    provider: "whatsapp-web.js",
    message:
      "O canal WhatsApp agora funciona por sessao direta com whatsapp-web.js. Use /api/whatsapp/session para conectar o numero.",
  });
}

export async function POST() {
  return ok({
    received: false,
    provider: "whatsapp-web.js",
    message:
      "Webhook externo desativado. O recebimento de mensagens agora acontece pela sessao conectada do WhatsApp Web.",
  });
}
