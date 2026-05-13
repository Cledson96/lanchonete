import { requireCustomer } from "@/lib/auth/customer";
import { serializeCheckoutCustomerSnapshot } from "@/lib/checkout/serializers";
import { ApiError } from "@/lib/api/error";
import { handleRouteError, ok } from "@/lib/api/response";
import { readRequestBody } from "@/lib/request";
import { getCustomerCheckoutProfileByPhone } from "@/lib/services/customer-service";
import { customerLookupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const session = await requireCustomer();
    const input = await readRequestBody(request, customerLookupSchema);

    if (session.phone !== input.phone) {
      throw new ApiError(403, "Telefone fora da sessao validada.");
    }

    const customer = await getCustomerCheckoutProfileByPhone(input.phone);

    return ok({
      customer: customer ? serializeCheckoutCustomerSnapshot(customer) : null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
