import { requireCustomer } from "@/lib/auth/customer";
import { handleRouteError, ok } from "@/lib/http";
import { serializeCheckoutCustomerSnapshot } from "@/lib/checkout/serializers";
import { getCustomerById } from "@/lib/services/customer-service";

export async function GET() {
  try {
    const session = await requireCustomer();
    const customer = await getCustomerById(session.customerProfileId);

    return ok({
      customer: customer ? serializeCheckoutCustomerSnapshot(customer) : null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
