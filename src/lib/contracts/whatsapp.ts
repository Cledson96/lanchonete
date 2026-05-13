export type WhatsAppInboxPriority = "low" | "normal" | "high";

export type WhatsAppInboxConversationItem = {
  id: string;
  phone: string;
  state: string;
  updatedAt: string;
  lastInboundAt: string | null;
  priority: WhatsAppInboxPriority;
  needsReply: boolean;
  customerProfile: { fullName: string };
  owner: { id: string; email: string } | null;
  order: { code: string; totalAmount: number } | null;
  messages: Array<{
    content: string;
    direction: "inbound" | "outbound";
    createdAt: string;
  }>;
};
