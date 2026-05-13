import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/api/response";
import { listWhatsAppConversations } from "@/lib/services/whatsapp-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const conversations = await listWhatsAppConversations();
    return ok({ conversations });
  } catch (error) {
    return handleRouteError(error);
  }
}
