import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/http";
import { readRequestBody } from "@/lib/request";
import { createMenuItem, updateMenuItem } from "@/lib/services/menu-admin-service";
import { getAdminMenuItems, invalidatePublicMenuCache } from "@/lib/services/menu-service";
import { createMenuItemSchema, updateMenuItemSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    const items = await getAdminMenuItems();
    return ok({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = await readRequestBody(request, createMenuItemSchema);
    const item = await createMenuItem(input);
    invalidatePublicMenuCache();
    return ok({ item }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const input = await readRequestBody(request, updateMenuItemSchema);
    const item = await updateMenuItem(input);
    invalidatePublicMenuCache();
    return ok({ item });
  } catch (error) {
    return handleRouteError(error);
  }
}
