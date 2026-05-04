function resolveAuthSecret(): string {
  const secret = process.env.APP_AUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_AUTH_SECRET e obrigatorio em producao.");
  }

  return "local-dev-secret-change-me";
}

export const config = {
  authSecret: resolveAuthSecret(),
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPhone: process.env.ADMIN_PHONE || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  publicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  whatsappSessionPath:
    process.env.WHATSAPP_SESSION_PATH || ".runtime/whatsapp-session",
  whatsappHeadless: process.env.WHATSAPP_HEADLESS !== "false",
  whatsappClientName: process.env.WHATSAPP_CLIENT_NAME || "lanchonete-familia",
  whatsappAllowedCountryCode:
    process.env.WHATSAPP_ALLOWED_COUNTRY_CODE || "55",
  whatsappBotEnabled: process.env.WHATSAPP_BOT_ENABLED !== "false",
  routingServiceUrl:
    process.env.ROUTING_SERVICE_URL || "https://router.project-osrm.org",
  routingDistanceSafetyFactor: Number(
    process.env.ROUTING_DISTANCE_SAFETY_FACTOR || "1.08",
  ),
  storePixKey: process.env.STORE_PIX_KEY || "",
};

export const cookieNames = {
  admin: "lanchonete_admin",
  customer: "lanchonete_customer",
};
