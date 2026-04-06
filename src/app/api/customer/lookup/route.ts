import { handleRouteError, ok } from "@/lib/http";
import { readRequestBody } from "@/lib/request";
import { getCustomerCheckoutProfileByPhone } from "@/lib/services/customer-service";
import { customerLookupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const input = await readRequestBody(request, customerLookupSchema);
    const customer = await getCustomerCheckoutProfileByPhone(input.phone);
    const defaultAddress = customer?.defaultAddress || customer?.addresses[0] || null;

    return ok({
      customer: customer
        ? {
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            defaultAddress: defaultAddress
              ? {
                  id: defaultAddress.id,
                  street: defaultAddress.street,
                  number: defaultAddress.number,
                  complement: defaultAddress.complement,
                  neighborhood: defaultAddress.neighborhood,
                  city: defaultAddress.city,
                  state: defaultAddress.state,
                  zipCode: defaultAddress.zipCode,
                  reference: defaultAddress.reference,
                }
              : null,
            lastPaymentMethod: customer.orders[0]?.paymentMethod || null,
            lastOrderType: customer.orders[0]?.type || null,
          }
        : null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
