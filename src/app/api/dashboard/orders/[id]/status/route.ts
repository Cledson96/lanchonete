import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/api/response";
import { readRequestBody } from "@/lib/request";
import { transitionOrderStatus } from "@/lib/services/order-admin-service";
import { updateOrderStatusSchema } from "@/lib/validators";

type DashboardOrderStatusRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  { params }: DashboardOrderStatusRouteContext,
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const input = await readRequestBody(request, updateOrderStatusSchema);
    const order = await transitionOrderStatus({
      orderId: id,
      changedById: admin.sub,
      ...input,
    });

    return ok({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
