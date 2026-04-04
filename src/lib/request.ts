import { z } from "zod";

function formDataToObject(formData: FormData) {
  const result: Record<string, unknown> = {};

  for (const [key, rawValue] of formData.entries()) {
    const value = typeof rawValue === "string" ? rawValue : rawValue.name;
    const existing = result[key];

    if (existing === undefined) {
      result[key] = value;
      continue;
    }

    if (Array.isArray(existing)) {
      existing.push(value);
      continue;
    }

    result[key] = [existing, value];
  }

  return result;
}

export function isFormRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

export async function readRequestBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  if (isFormRequest(request)) {
    const formData = await request.formData();
    return schema.parse(formDataToObject(formData));
  }

  return schema.parse(await request.json());
}
