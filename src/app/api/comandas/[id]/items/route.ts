import { ApiError } from "@/lib/api/error";
import { handleRouteError, ok } from "@/lib/api/response";
import { rateLimitByIp } from "@/lib/rate-limit";
import { readRequestBody } from "@/lib/request";
import { addItemsToComanda } from "@/lib/services/comanda-service";
import { addComandaItemsSchema } from "@/lib/validators";

type ComandaRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  { params }: ComandaRouteContext,
) {
  try {
    const limit = rateLimitByIp(request);
    if (!limit.success) {
      throw new ApiError(429, "Muitas requisicoes. Tente novamente em alguns segundos.");
    }

    const { id } = await params;
    const input = await readRequestBody(request, addComandaItemsSchema);
    const comanda = await addItemsToComanda(id, input.items);
    return ok({ comanda }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
