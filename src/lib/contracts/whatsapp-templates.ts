export const WHATSAPP_MESSAGE_TEMPLATE_KEYS = [
  "public_site_reply",
  "order_out_for_delivery",
  "order_confirmation",
  "phone_verification_code",
] as const;

export type WhatsAppMessageTemplateKey = (typeof WHATSAPP_MESSAGE_TEMPLATE_KEYS)[number];

export type WhatsAppMessageTemplate = {
  key: WhatsAppMessageTemplateKey;
  label: string;
  description: string;
  content: string;
  defaultContent: string;
  variables: string[];
};

export const WHATSAPP_MESSAGE_TEMPLATE_DEFINITIONS: Record<
  WhatsAppMessageTemplateKey,
  Omit<WhatsAppMessageTemplate, "key" | "content">
> = {
  public_site_reply: {
    label: "Mensagem inicial do robo",
    description: "Enviada automaticamente quando o cliente chama a loja pelo WhatsApp.",
    defaultContent: [
      "Oi! Agora os pedidos sao feitos pelo site.",
      "{{cardapioUrl}}",
      "",
      "Se quiser falar com um atendente, responda *atendente*.",
    ].join("\n"),
    variables: ["cardapioUrl"],
  },
  order_out_for_delivery: {
    label: "Pedido saiu para entrega",
    description: "Enviada quando Operacoes move um delivery para saiu para entrega.",
    defaultContent: "Pedido {{codigoPedido}} saiu para entrega. Ja esta a caminho.",
    variables: ["codigoPedido"],
  },
  order_confirmation: {
    label: "Confirmacao de pedido",
    description: "Enviada ao cliente depois que um pedido do site e criado.",
    defaultContent: [
      "✅ Pedido enviado e ja esta a caminho da preparacao.",
      "{{cliente}}",
      "Codigo: *{{codigoPedido}}*",
      "Acompanhe seu pedido: {{linkPedido}}",
      "",
      "*Resumo do pedido*",
      "{{itens}}",
      "",
      "Subtotal: {{subtotal}}",
      "Frete: {{frete}}",
      "Total: {{total}}",
      "Pagamento: {{pagamento}}",
      "{{endereco}}",
      "{{pix}}",
    ].join("\n"),
    variables: [
      "cliente",
      "codigoPedido",
      "linkPedido",
      "itens",
      "subtotal",
      "frete",
      "total",
      "pagamento",
      "endereco",
      "pix",
    ],
  },
  phone_verification_code: {
    label: "Codigo de verificacao",
    description: "Enviada para validar o telefone antes de finalizar o pedido.",
    defaultContent: "Seu codigo da lanchonete: {{codigo}}. Ele vale por 10 minutos.",
    variables: ["codigo"],
  },
};
