export type WhatsAppClientStatus =
  | "desconectado"
  | "inicializando"
  | "aguardando_qr"
  | "conectado"
  | "erro";

export type WhatsAppRuntimeEventType =
  | "init"
  | "qr"
  | "authenticated"
  | "ready"
  | "auth_failure"
  | "disconnected"
  | "loading_screen"
  | "change_state"
  | "message"
  | "message_ack"
  | "send"
  | "error";

export type WhatsAppRuntimeEvent = {
  type: WhatsAppRuntimeEventType;
  at: string;
  detail: string;
};

export type WhatsAppSessionInfo = {
  status: WhatsAppClientStatus;
  connectedPhone: string | null;
  connectedName: string | null;
  qrAvailable: boolean;
  qrDataUrl: string | null;
  isStarting: boolean;
  startedAt: string | null;
  lastEventAt: string | null;
  lastError: string | null;
  events: WhatsAppRuntimeEvent[];
};

export type WhatsAppSendTextResult = {
  externalMessageId?: string;
};

export type WhatsAppInboundMessageEvent = {
  messageId: string;
  from: string;
  fromMe: boolean;
  body: string | null;
  rawType: string | null;
  timestamp: number | null;
  pushName: string | null;
  notifyName: string | null;
};

export type WhatsAppMessageDeliveryStatus = "pending" | "sent" | "delivered" | "read";

export type WhatsAppMessageStatusEvent = {
  messageId: string;
  chatId: string | null;
  status: WhatsAppMessageDeliveryStatus;
  timestamp: string;
};

export type WhatsAppConnectionUpdateEvent = {
  status: WhatsAppClientStatus;
  connectedPhone: string | null;
  connectedName: string | null;
  lastError: string | null;
};

export type WhatsAppWebhookEvent =
  | { type: "message.received"; payload: WhatsAppInboundMessageEvent }
  | { type: "message.status"; payload: WhatsAppMessageStatusEvent }
  | { type: "connection.update"; payload: WhatsAppConnectionUpdateEvent };
