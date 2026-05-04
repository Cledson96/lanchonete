import { requireCustomer } from "@/lib/auth/customer";
import { handleRouteError, ok } from "@/lib/http";
import { readRequestBody } from "@/lib/request";
import { getCustomerCheckoutProfileByPhone } from "@/lib/services/customer-service";
import { customerLookupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const session = await requireCustomer();
    const input = await readRequestBody(request, customerLookupSchema);

    if (session.phone !== input.phone) {
      return new Response(
        JSON.stringify({ error: { message: "Telefone fora da sessao validada." } }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

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
