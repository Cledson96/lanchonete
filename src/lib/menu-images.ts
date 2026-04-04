import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { ApiError } from "@/lib/http";
import { MENU_ITEM_PLACEHOLDER_URL, resolveMenuItemImage } from "@/lib/menu-images.shared";
import { slugify } from "@/lib/utils";

const MENU_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "menu");
const MENU_UPLOAD_URL_PREFIX = "/uploads/menu/";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const CONTENT_TYPE_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function ensureManagedMenuPath(url: string) {
  if (!url.startsWith(MENU_UPLOAD_URL_PREFIX)) {
    return null;
  }

  const relativePath = url.slice(1);
  const absolutePath = path.join(process.cwd(), "public", relativePath);
  const normalized = path.normalize(absolutePath);

  if (!normalized.startsWith(MENU_UPLOAD_DIR)) {
    return null;
  }

  return normalized;
}

function getFileExtension(file: File) {
  if (CONTENT_TYPE_TO_EXTENSION[file.type]) {
    return CONTENT_TYPE_TO_EXTENSION[file.type];
  }

  const extension = path.extname(file.name).toLowerCase();

  if ([".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
    return extension === ".jpeg" ? ".jpg" : extension;
  }

  throw new ApiError(422, "Formato de imagem invalido. Use JPG, PNG ou WebP.");
}

export async function saveMenuItemImage(file: File, itemName: string) {
  if (!file.size) {
    throw new ApiError(422, "Selecione uma imagem para enviar.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new ApiError(422, "A imagem precisa ter no maximo 5MB.");
  }

  const extension = getFileExtension(file);
  const safeBaseName = slugify(itemName) || "menu-item";
  const fileName = `${safeBaseName}-${randomUUID()}${extension}`;
  const absolutePath = path.join(MENU_UPLOAD_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(MENU_UPLOAD_DIR, { recursive: true });
  await writeFile(absolutePath, buffer);

  return `${MENU_UPLOAD_URL_PREFIX}${fileName}`;
}

export async function deleteManagedMenuItemImage(imageUrl?: string | null) {
  if (!imageUrl) {
    return;
  }

  const absolutePath = ensureManagedMenuPath(imageUrl);

  if (!absolutePath) {
    return;
  }

  try {
    await unlink(absolutePath);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code !== "ENOENT") {
      throw error;
    }
  }
}

export { MENU_ITEM_PLACEHOLDER_URL, resolveMenuItemImage };
