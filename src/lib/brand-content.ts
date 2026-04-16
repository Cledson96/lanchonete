const fallbackWhatsAppUrl =
  "https://wa.me/5511999990000?text=Oi%2C+quero+pedir+na+Lanchonete%20Familia";

export const brandContent = {
  name: "Lanchonete Familia",
  shortName: "Familia",
  whatsappUrl: process.env.NEXT_PUBLIC_WHATSAPP_URL || fallbackWhatsAppUrl,
  location: "R. Gilberto Kaminski, 170 - Cidade Industrial de Curitiba, Curitiba - PR, 81170-260",
  hours: "Seg a Dom, das 18h as 23h30",
  eyebrow: "Cardapio da casa",
  headline: "Escolha sua categoria e monte seu pedido.",
  subheadline:
    "Lanches, combos, pasteis, tapiocas e acai em uma vitrine simples, rapida e feita para pedir.",
};
