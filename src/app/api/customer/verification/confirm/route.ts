import { ApiError } from "@/lib/api/error";
import { handleRouteError, ok } from "@/lib/api/response";
import { serializeCheckoutVerificationCustomer } from "@/lib/checkout/serializers";
import { checkRateLimit, rateLimitByIp } from "@/lib/rate-limit";
import { readRequestBody } from "@/lib/request";
import { confirmPhoneVerification } from "@/lib/services/verification-service";
import { verificationConfirmSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const ipLimit = rateLimitByIp(request, 30, 10 * 60_000);
    if (!ipLimit.success) {
      throw new ApiError(429, "Muitas tentativas de confirmacao. Tente novamente em alguns minutos.");
    }

    const input = await readRequestBody(request, verificationConfirmSchema);
    const phoneLimit = checkRateLimit(`otp:confirm:${input.phone}`, 10, 10 * 60_000);
    if (!phoneLimit.success) {
      throw new ApiError(429, "Limite de confirmacoes excedido para este telefone.");
    }

    const customer = await confirmPhoneVerification(input);
    return ok({ customer: serializeCheckoutVerificationCustomer(customer) });
  } catch (error) {
    return handleRouteError(error);
  }
}
