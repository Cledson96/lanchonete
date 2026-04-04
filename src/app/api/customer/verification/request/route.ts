import { handleRouteError, ok } from "@/lib/http";
import { readRequestBody } from "@/lib/request";
import { requestPhoneVerification } from "@/lib/services/verification-service";
import { verificationRequestSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const input = await readRequestBody(request, verificationRequestSchema);
    const result = await requestPhoneVerification(input);
    return ok(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
