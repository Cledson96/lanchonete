import { getAdminSession } from "@/lib/auth/session";
import { requireCustomer } from "@/lib/auth/customer";
import { ApiError } from "@/lib/api/error";
import { handleRouteError, ok } from "@/lib/api/response";
import { getOrderByCode } from "@/lib/services/order-service";

type OrderCodeRouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(
  _request: Request,
  { params }: OrderCodeRouteContext,
) {
  try {
    const { code } = await params;
    const [adminSession, order] = await Promise.all([
      getAdminSession(),
      getOrderByCode(code),
    ]);

    if (!order) {
      throw new ApiError(404, "Pedido nao encontrado.");
    }

    if (!adminSession) {
      const customerSession = await requireCustomer();

      if (
        customerSession.customerProfileId !== order.customerProfileId &&
        customerSession.phone !== order.customerPhone
      ) {
        throw new ApiError(403, "Pedido indisponivel para esta sessao.");
      }
    }

    return ok({ order });
  } catch (error) {
    return handleRouteError(error);
  }
}
