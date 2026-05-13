import { requireAdmin } from "@/lib/auth/admin";
import { ApiError } from "@/lib/api/error";
import { handleRouteError, ok } from "@/lib/api/response";
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
