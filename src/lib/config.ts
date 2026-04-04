const fallbackSecret = "local-dev-secret-change-me";

export const config = {
  authSecret: process.env.APP_AUTH_SECRET || fallbackSecret,
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPhone: process.env.ADMIN_PHONE || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  whatsappAppSecret: process.env.WHATSAPP_APP_SECRET || "",
};

export const cookieNames = {
  admin: "lanchonete_admin",
  customer: "lanchonete_customer",
};
