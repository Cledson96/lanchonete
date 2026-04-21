import { requireAdmin } from "@/lib/auth/admin";
import { ApiError, handleRouteError, ok } from "@/lib/http";
import { readRequestBody } from "@/lib/request";
import { getWhatsAppConversationById, updateWhatsAppConversationInbox } from "@/lib/services/whatsapp-service";
import { updateWhatsAppConversationInboxSchema } from "@/lib/validators";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    const conversation = await getWhatsAppConversationById(id);

    if (!conversation) {
      throw new ApiError(404, "Conversa nao encontrada.");
    }

    return ok({ conversation });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    const input = await readRequestBody(request, updateWhatsAppConversationInboxSchema);
    const conversation = await updateWhatsAppConversationInbox(id, input);
    return ok({ conversation });
  } catch (error) {
    return handleRouteError(error);
  }
}
