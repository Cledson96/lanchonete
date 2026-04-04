import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { ApiError, handleRouteError, ok } from "@/lib/http";
import {
  deleteManagedMenuItemImage,
  saveMenuItemImage,
} from "@/lib/menu-images";

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

    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        name: true,
        imageUrl: true,
      },
    });

    if (!item) {
      throw new ApiError(404, "Item do cardapio nao encontrado.");
    }

    const imageUrl = await saveMenuItemImage(rawFile, item.name);

    await prisma.menuItem.update({
      where: { id: item.id },
      data: {
        imageUrl,
      },
    });

    await deleteManagedMenuItemImage(item.imageUrl);

    return ok({
      item: {
        id: item.id,
        imageUrl,
      },
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

    const item = await prisma.menuItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        imageUrl: true,
      },
    });

    if (!item) {
      throw new ApiError(404, "Item do cardapio nao encontrado.");
    }

    await prisma.menuItem.update({
      where: { id: item.id },
      data: {
        imageUrl: null,
      },
    });

    await deleteManagedMenuItemImage(item.imageUrl);

    return ok({
      item: {
        id: item.id,
        imageUrl: null,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
