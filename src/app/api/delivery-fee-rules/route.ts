import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/http";
import { readRequestBody } from "@/lib/request";
import {
  createDeliveryFeeRule,
  updateDeliveryFeeRule,
} from "@/lib/services/menu-admin-service";
import { getDeliveryFeeRules } from "@/lib/services/delivery-fee-service";
import { serializeStoreDeliveryRule } from "@/lib/store-serializers";
import {
  createDeliveryFeeRuleSchema,
  updateDeliveryFeeRuleSchema,
} from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    const rules = await getDeliveryFeeRules();
    return ok({ rules });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = await readRequestBody(request, createDeliveryFeeRuleSchema);
    const rule = await createDeliveryFeeRule(input);
    return ok({ rule: serializeStoreDeliveryRule(rule) }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const input = await readRequestBody(request, updateDeliveryFeeRuleSchema);
    const rule = await updateDeliveryFeeRule(input);
    return ok({ rule: serializeStoreDeliveryRule(rule) });
  } catch (error) {
    return handleRouteError(error);
  }
}
