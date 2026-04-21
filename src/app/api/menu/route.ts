import { ApiError, handleRouteError, ok } from "@/lib/http";
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
