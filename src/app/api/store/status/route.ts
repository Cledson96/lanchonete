import { handleRouteError, ok } from "@/lib/http";
import { getPublicStoreStatus } from "@/lib/services/store-settings-service";

export async function GET() {
  try {
    return ok(await getPublicStoreStatus());
  } catch (error) {
    return handleRouteError(error);
  }
}
