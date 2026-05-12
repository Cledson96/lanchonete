import { requireAdmin } from "@/lib/auth/admin";
import { ApiError, handleRouteError, ok } from "@/lib/http";
import { removeMenuItemImage, uploadMenuItemImage } from "@/lib/services/menu-admin-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const itemId = String(formData.get("itemId") || "").trim();
    const rawFile = formData.get("file");

    if (!itemId) {
      throw new ApiError(422, "Selecione um item do cardapio.");
    }

    if (!(rawFile instanceof File)) {
      throw new ApiError(422, "Envie um arquivo de imagem.");
    }

    const item = await uploadMenuItemImage(itemId, rawFile);

    return ok({
      item,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();

    const { itemId } = (await request.json()) as { itemId?: string };

    if (!itemId) {
      throw new ApiError(422, "Selecione um item do cardapio.");
    }

    const item = await removeMenuItemImage(itemId);

    return ok({
      item,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
