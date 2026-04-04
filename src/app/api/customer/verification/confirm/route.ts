import { handleRouteError, ok } from "@/lib/http";
import { readRequestBody } from "@/lib/request";
import { confirmPhoneVerification } from "@/lib/services/verification-service";
import { verificationConfirmSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const input = await readRequestBody(request, verificationConfirmSchema);
    const customer = await confirmPhoneVerification(input);
    return ok({ customer });
  } catch (error) {
    return handleRouteError(error);
  }
}
