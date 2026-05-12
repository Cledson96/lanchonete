import { config } from "@/lib/config";
import { ApiError, fail, handleRouteError, ok } from "@/lib/http";
import type { WhatsAppWebhookEvent } from "@/lib/whatsapp-contract";
import {
  handleWhatsAppInboundEvent,
  handleWhatsAppMessageStatusEvent,
} from "@/lib/services/whatsapp-service";

export const runtime = "nodejs";

export async function GET() {
  return ok({
    active: true,
    provider: "baileys-worker",
    message: "Webhook interno do worker Baileys ativo.",
  });
}

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-whatsapp-worker-secret");

    if (secret !== config.whatsappInternalWebhookSecret) {
      return fail(401, "Nao autorizado.");
    }

    const event = (await request.json()) as WhatsAppWebhookEvent;

    switch (event.type) {
      case "message.received":
        await handleWhatsAppInboundEvent(event.payload);
        break;
      case "message.status":
        await handleWhatsAppMessageStatusEvent(event.payload);
        break;
      case "connection.update":
        break;
      default:
        throw new ApiError(422, "Evento interno do WhatsApp invalido.");
    }

    return ok({
      received: true,
      provider: "baileys-worker",
      type: event.type,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
