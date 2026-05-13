import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth/session";
import { handleRouteError, ok } from "@/lib/api/response";
import { publicRedirectUrl } from "@/lib/redirect-url";
import { isFormRequest } from "@/lib/request";

export async function POST(request: Request) {
  try {
    await clearAdminSession();

    if (isFormRequest(request)) {
      return NextResponse.redirect(publicRedirectUrl("/dashboard/login", request));
    }

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
