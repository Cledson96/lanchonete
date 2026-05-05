import { config } from "@/lib/config";

function getHeader(request: Request, name: string) {
  return request.headers.get(name)?.split(",")[0]?.trim();
}

function getPublicOrigin(request: Request) {
  const forwardedHost = getHeader(request, "x-forwarded-host");
  const forwardedProto = getHeader(request, "x-forwarded-proto");

  if (forwardedHost) {
    return `${forwardedProto || "https"}://${forwardedHost}`;
  }

  const host = getHeader(request, "host");
  if (host && !host.startsWith("localhost") && !host.startsWith("127.0.0.1")) {
    const proto =
      getHeader(request, "x-forwarded-proto") ||
      new URL(request.url).protocol.replace(":", "");
    return `${proto}://${host}`;
  }

  return process.env.APP_URL || config.publicSiteUrl;
}

export function publicRedirectUrl(path: string, request: Request) {
  return new URL(path, getPublicOrigin(request));
}
