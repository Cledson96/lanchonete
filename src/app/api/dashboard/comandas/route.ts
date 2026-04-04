import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/http";
import { listCommandas } from "@/lib/services/comanda-service";

export async function GET() {
  try {
    await requireAdmin();
    const commandas = await listCommandas();
    return ok({ commandas });
  } catch (error) {
    return handleRouteError(error);
  }
}
