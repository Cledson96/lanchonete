import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/http";
import { readRequestBody } from "@/lib/request";
import {
  createOptionGroup,
  updateOptionGroup,
} from "@/lib/services/menu-admin-service";
import { getAdminOptionGroups } from "@/lib/services/menu-service";
import {
  createOptionGroupSchema,
  updateOptionGroupSchema,
} from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    const optionGroups = await getAdminOptionGroups();
    return ok({ optionGroups });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = await readRequestBody(request, createOptionGroupSchema);
    const optionGroup = await createOptionGroup(input);
    return ok({ optionGroup }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const input = await readRequestBody(request, updateOptionGroupSchema);
    const optionGroup = await updateOptionGroup(input);
    return ok({ optionGroup });
  } catch (error) {
    return handleRouteError(error);
  }
}
