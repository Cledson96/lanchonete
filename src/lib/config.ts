function resolveAuthSecret(): string {
  const secret = process.env.APP_AUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_AUTH_SECRET e obrigatorio em producao.");
  }

  return "local-dev-secret-change-me";
}

function resolveInternalSecret(name: string, fallback: string) {
  const value = process.env[name];
  if (value) return value;

  return fallback;
}

export const config = {
  authSecret: resolveAuthSecret(),
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPhone: process.env.ADMIN_PHONE || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  publicSiteUrl:
    process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  whatsappSessionPath:
    process.env.WHATSAPP_SESSION_PATH || ".runtime/whatsapp-session",
  whatsappClientName: process.env.WHATSAPP_CLIENT_NAME || "lanchonete-familia",
  whatsappAllowedCountryCode:
    process.env.WHATSAPP_ALLOWED_COUNTRY_CODE || "55",
  whatsappBotEnabled: process.env.WHATSAPP_BOT_ENABLED !== "false",
  whatsappAutoStart: process.env.WHATSAPP_AUTO_START !== "false",
  whatsappWorkerUrl: process.env.WHATSAPP_WORKER_URL || "http://127.0.0.1:3001",
  whatsappWorkerToken: resolveInternalSecret(
    "WHATSAPP_WORKER_TOKEN",
    "local-whatsapp-worker-token",
  ),
  whatsappInternalWebhookSecret: resolveInternalSecret(
    "WHATSAPP_INTERNAL_WEBHOOK_SECRET",
    "local-whatsapp-webhook-secret",
  ),
  appInternalUrl: process.env.APP_INTERNAL_URL || "http://127.0.0.1:3000",
  routingServiceUrl:
    process.env.ROUTING_SERVICE_URL || "https://router.project-osrm.org",
  routingDistanceSafetyFactor: Number(
    process.env.ROUTING_DISTANCE_SAFETY_FACTOR || "1.08",
  ),
  storePixKey: process.env.STORE_PIX_KEY || "",
};
