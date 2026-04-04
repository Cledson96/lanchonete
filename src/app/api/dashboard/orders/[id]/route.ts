import { requireAdmin } from "@/lib/auth/admin";
import { ApiError, handleRouteError, ok } from "@/lib/http";
import { getOrderById } from "@/lib/services/order-admin-service";

type DashboardOrderRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: DashboardOrderRouteContext,
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      throw new ApiError(404, "Pedido nao encontrado.");
    }

    return ok({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
