import { ApiError, handleRouteError, ok } from "@/lib/http";
import { checkRateLimit, rateLimitByIp } from "@/lib/rate-limit";
import { readRequestBody } from "@/lib/request";
import { requestPhoneVerification } from "@/lib/services/verification-service";
import { verificationRequestSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const ipLimit = rateLimitByIp(request, 10, 10 * 60_000);
    if (!ipLimit.success) {
      throw new ApiError(429, "Muitas tentativas de codigo. Tente novamente em alguns minutos.");
    }

    const input = await readRequestBody(request, verificationRequestSchema);
    const phoneLimit = checkRateLimit(`otp:request:${input.phone}`, 3, 10 * 60_000);
    if (!phoneLimit.success) {
      throw new ApiError(429, "Limite de codigos excedido para este telefone.");
    }

    const result = await requestPhoneVerification(input);
    return ok(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
