export type PaymentMethod =
  | "dinheiro"
  | "cartao_credito"
  | "cartao_debito"
  | "pix"
  | "outro";

export type FulfillmentType = "delivery" | "retirada";

export type OrderType = FulfillmentType | "local";

export type OrderChannel = "web" | "whatsapp" | "local";
