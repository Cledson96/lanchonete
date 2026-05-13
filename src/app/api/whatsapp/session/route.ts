import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/api/response";
import { getWhatsAppSession } from "@/lib/services/whatsapp-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const session = await getWhatsAppSession();
    return ok({ session });
  } catch (error) {
    return handleRouteError(error);
  }
}
