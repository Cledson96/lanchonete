import { requireCustomer } from "@/lib/auth/customer";
import { handleRouteError, ok } from "@/lib/http";
import { getCustomerById } from "@/lib/services/customer-service";

export async function GET() {
  try {
    const session = await requireCustomer();
    const customer = await getCustomerById(session.customerProfileId);

    return ok({
      customer: customer
        ? {
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
          }
        : null,
      orders: customer?.orders || [],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
