import { DashboardWhatsAppPanel } from "@/components/dashboard-whatsapp-panel";
import { getWhatsAppSession, listWhatsAppConversations } from "@/lib/services/whatsapp-service";

export const runtime = "nodejs";

export default async function DashboardWhatsAppPage() {
  const [session, conversations] = await Promise.all([
    getWhatsAppSession(),
    listWhatsAppConversations(),
  ]);

  return (
    <DashboardWhatsAppPanel
      initialConversations={conversations.map((conversation) => ({
        id: conversation.id,
        phone: conversation.phone,
        state: conversation.state,
        updatedAt: conversation.updatedAt.toISOString(),
        customerProfile: {
          fullName: conversation.customerProfile.fullName,
        },
        order: conversation.order ? { code: conversation.order.code } : null,
        messages: conversation.messages.map((message) => ({
          content: message.content,
          direction: message.direction,
          createdAt: message.createdAt.toISOString(),
        })),
      }))}
      initialSession={session}
    />
  );
}
