import { handleRouteError, ok } from "@/lib/http";
import { getPublicMenu } from "@/lib/services/menu-service";

export async function GET() {
  try {
    const categories = await getPublicMenu();
    return ok({ categories });
  } catch (error) {
    return handleRouteError(error);
  }
}
