import { DashboardWhatsAppPanel } from "@/components/dashboard/whatsapp-panel";
import { getAdminSession } from "@/lib/auth/session";
import { listWhatsAppMessageTemplates } from "@/lib/services/whatsapp-template-service";
import { getWhatsAppSession, listWhatsAppConversations } from "@/lib/services/whatsapp-service";

export const runtime = "nodejs";

export default async function DashboardWhatsAppPage() {
  const [adminSession, session, conversations, templates] = await Promise.all([
    getAdminSession(),
    getWhatsAppSession(),
    listWhatsAppConversations(),
    listWhatsAppMessageTemplates(),
  ]);

  return (
    <DashboardWhatsAppPanel
      currentAdmin={adminSession ? { id: adminSession.sub, email: adminSession.email } : null}
      initialConversations={conversations}
      initialSession={session}
      initialTemplates={templates}
    />
  );
}
