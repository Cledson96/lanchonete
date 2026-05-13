import { requireAdmin } from "@/lib/auth/admin";
import { handleRouteError, ok } from "@/lib/api/response";
import { readRequestBody } from "@/lib/request";
import { createComanda, listCommandas } from "@/lib/services/comanda-service";
import { createComandaSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    const commandas = await listCommandas();
    return ok({ commandas });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const input = await readRequestBody(request, createComandaSchema);
    const comanda = await createComanda({
      name: input.name,
      notes: input.notes,
      openedById: admin.sub,
    });
    return ok({ comanda }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
