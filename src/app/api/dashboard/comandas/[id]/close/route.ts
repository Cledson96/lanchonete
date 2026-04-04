import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/http";
import { readRequestBody } from "@/lib/request";
import { closeComanda } from "@/lib/services/comanda-service";
import { closeComandaSchema } from "@/lib/validators";

type DashboardComandaCloseRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  { params }: DashboardComandaCloseRouteContext,
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const input = await readRequestBody(request, closeComandaSchema);
    const comanda = await closeComanda(id, input.paymentMethod);
    return ok({ comanda });
  } catch (error) {
    return handleRouteError(error);
  }
}
