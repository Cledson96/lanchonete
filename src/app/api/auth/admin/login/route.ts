import { NextResponse } from "next/server";
import { loginAdmin } from "@/lib/auth/admin";
import { ApiError } from "@/lib/api/error";
import { handleRouteError, ok } from "@/lib/api/response";
import { rateLimitByIp } from "@/lib/rate-limit";
import { publicRedirectUrl } from "@/lib/redirect-url";
import { isFormRequest, readRequestBody } from "@/lib/request";
import { adminLoginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const limit = rateLimitByIp(request, 5, 60_000);
    if (!limit.success) {
      throw new ApiError(429, "Muitas tentativas. Tente novamente em alguns segundos.");
    }

    const isForm = isFormRequest(request);
    const input = await readRequestBody(request, adminLoginSchema);
    const admin = await loginAdmin(input.email, input.password);

    if (isForm) {
      return NextResponse.redirect(publicRedirectUrl("/dashboard", request));
    }

    return ok({ admin });
  } catch (error) {
    if (isFormRequest(request)) {
      const url = publicRedirectUrl("/dashboard/login", request);
      url.searchParams.set("error", "Credenciais invalidas");
      return NextResponse.redirect(url);
    }

    return handleRouteError(error);
  }
}
