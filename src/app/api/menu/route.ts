import { ApiError } from "@/lib/api/error";
import { handleRouteError, ok } from "@/lib/api/response";
import { rateLimitByIp } from "@/lib/rate-limit";
import { getPublicMenu } from "@/lib/services/menu-service";

export async function GET(request: Request) {
  try {
    const limit = rateLimitByIp(request);
    if (!limit.success) {
      throw new ApiError(429, "Muitas requisicoes. Tente novamente em alguns segundos.");
    }

    const categories = await getPublicMenu();
    return ok({ categories });
  } catch (error) {
    return handleRouteError(error);
  }
}
