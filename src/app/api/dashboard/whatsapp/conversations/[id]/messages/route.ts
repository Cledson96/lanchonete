import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/http";
import { readRequestBody } from "@/lib/request";
import { sendManualWhatsAppConversationMessage } from "@/lib/services/whatsapp-service";
import { sendWhatsAppConversationMessageSchema } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    const input = await readRequestBody(request, sendWhatsAppConversationMessageSchema);
    const result = await sendManualWhatsAppConversationMessage(id, input.content);
    return ok({ result }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
