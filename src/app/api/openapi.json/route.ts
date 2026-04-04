import { getOpenApiDocument } from "@/lib/openapi";

export async function GET(request: Request) {
  const url = new URL(request.url);

  return Response.json(getOpenApiDocument(url.origin));
}
