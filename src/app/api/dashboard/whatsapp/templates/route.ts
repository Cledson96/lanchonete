import { handleRouteError, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/admin";
import { readRequestBody } from "@/lib/request";
import {
  listWhatsAppMessageTemplates,
  updateWhatsAppMessageTemplates,
} from "@/lib/services/whatsapp-template-service";
import { updateWhatsAppMessageTemplatesSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    return ok({ templates: await listWhatsAppMessageTemplates() });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const input = await readRequestBody(request, updateWhatsAppMessageTemplatesSchema);
    const updates = Object.fromEntries(
      input.templates.map((template) => [template.key, template.content]),
    );

    return ok({ templates: await updateWhatsAppMessageTemplates(updates) });
  } catch (error) {
    return handleRouteError(error);
  }
}
