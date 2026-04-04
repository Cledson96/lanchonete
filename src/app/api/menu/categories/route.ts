import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/http";
import { readRequestBody } from "@/lib/request";
import {
  createCategory,
  updateCategory,
} from "@/lib/services/menu-admin-service";
import { getAdminCategories } from "@/lib/services/menu-service";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    const categories = await getAdminCategories();
    return ok({ categories });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = await readRequestBody(request, createCategorySchema);
    const category = await createCategory(input);
    return ok({ category }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const input = await readRequestBody(request, updateCategorySchema);
    const category = await updateCategory(input);
    return ok({ category });
  } catch (error) {
    return handleRouteError(error);
  }
}
