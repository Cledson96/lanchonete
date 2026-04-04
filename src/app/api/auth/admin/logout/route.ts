import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth/session";
import { handleRouteError, ok } from "@/lib/http";
import { isFormRequest } from "@/lib/request";

export async function POST(request: Request) {
  try {
    await clearAdminSession();

    if (isFormRequest(request)) {
      return NextResponse.redirect(new URL("/dashboard/login", request.url));
    }

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
