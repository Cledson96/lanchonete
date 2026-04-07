import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError } from "@/lib/http";
import { getWhatsAppSession } from "@/lib/services/whatsapp-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const session = await getWhatsAppSession();

    if (!session.qrDataUrl) {
      return new Response(null, { status: 204 });
    }

    return new Response(session.qrDataUrl, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
