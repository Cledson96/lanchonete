import { ApiError } from "@/lib/api/error";
import { handleRouteError, ok } from "@/lib/api/response";
import { getComandaBySlug } from "@/lib/services/comanda-service";

type ComandaSlugRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _request: Request,
  { params }: ComandaSlugRouteContext,
) {
  try {
    const { slug } = await params;
    const comanda = await getComandaBySlug(slug);

    if (!comanda) {
      throw new ApiError(404, "Comanda nao encontrada.");
    }

    return ok({ comanda });
  } catch (error) {
    return handleRouteError(error);
  }
}
