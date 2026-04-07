import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/http";
import { resetWhatsAppSession } from "@/lib/services/whatsapp-service";

export const runtime = "nodejs";

export async function POST() {
  try {
    await requireAdmin();
    const session = await resetWhatsAppSession();
    return ok({ session });
  } catch (error) {
    return handleRouteError(error);
  }
}
