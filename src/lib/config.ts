const fallbackSecret = "local-dev-secret-change-me";

export const config = {
  authSecret: process.env.APP_AUTH_SECRET || fallbackSecret,
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPhone: process.env.ADMIN_PHONE || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  whatsappSessionPath:
    process.env.WHATSAPP_SESSION_PATH || ".runtime/whatsapp-session",
  whatsappHeadless: process.env.WHATSAPP_HEADLESS !== "false",
  whatsappClientName: process.env.WHATSAPP_CLIENT_NAME || "lanchonete-familia",
  whatsappAllowedCountryCode:
    process.env.WHATSAPP_ALLOWED_COUNTRY_CODE || "55",
  whatsappBotEnabled: process.env.WHATSAPP_BOT_ENABLED !== "false",
};

export const cookieNames = {
  admin: "lanchonete_admin",
  customer: "lanchonete_customer",
};
