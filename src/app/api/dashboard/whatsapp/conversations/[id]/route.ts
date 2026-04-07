import { requireAdmin } from "@/lib/auth/admin";
import { ApiError, handleRouteError, ok } from "@/lib/http";
import { getWhatsAppConversationById } from "@/lib/services/whatsapp-service";

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
