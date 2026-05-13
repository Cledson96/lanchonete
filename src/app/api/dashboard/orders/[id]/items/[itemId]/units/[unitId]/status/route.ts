import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/api/response";
import { readRequestBody } from "@/lib/request";
import { transitionOrderItemUnitStatus } from "@/lib/services/order-admin-service";
import { updateOrderItemUnitStatusSchema } from "@/lib/validators";

type DashboardOrderItemUnitStatusRouteContext = {
  params: Promise<{
    id: string;
    itemId: string;
    unitId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: DashboardOrderItemUnitStatusRouteContext,
) {
  try {
    await requireAdmin();
    const { id, itemId, unitId } = await params;
    const input = await readRequestBody(request, updateOrderItemUnitStatusSchema);

    const order = await transitionOrderItemUnitStatus({
      orderId: id,
      orderItemId: itemId,
      unitId,
      toStatus: input.toStatus,
    });

    return ok({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
