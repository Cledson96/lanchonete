import { handleRouteError, ok } from "@/lib/http";
import { readRequestBody } from "@/lib/request";
import { resolveDeliveryFeeRule } from "@/lib/services/delivery-fee-service";
import { deliveryQuoteSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const input = await readRequestBody(request, deliveryQuoteSchema);
    const quote = await resolveDeliveryFeeRule(input);
    return ok(quote);
  } catch (error) {
    return handleRouteError(error);
  }
}
