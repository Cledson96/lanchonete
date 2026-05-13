import { ApiError } from "@/lib/api/error";
import { handleRouteError, ok } from "@/lib/api/response";
import { getComandaById } from "@/lib/services/comanda-service";

type ComandaRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: ComandaRouteContext) {
  try {
    const { id } = await params;
    const comanda = await getComandaById(id);

    if (!comanda) {
      throw new ApiError(404, "Comanda nao encontrada.");
    }

    return ok({ comanda });
  } catch (error) {
    return handleRouteError(error);
  }
}
