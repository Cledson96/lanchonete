import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/http";
import { readRequestBody } from "@/lib/request";
import {
  getStoreSettings,
  updateStoreSettings,
} from "@/lib/services/store-settings-service";
import { updateStoreSettingsSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    return ok(await getStoreSettings());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const input = await readRequestBody(request, updateStoreSettingsSchema);
    return ok(await updateStoreSettings(input));
  } catch (error) {
    return handleRouteError(error);
  }
}
