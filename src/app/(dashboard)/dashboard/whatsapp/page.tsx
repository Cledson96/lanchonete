import { DashboardWhatsAppPanel } from "@/components/dashboard-whatsapp-panel";
import { getAdminSession } from "@/lib/auth/session";
import { getWhatsAppSession, listWhatsAppConversations } from "@/lib/services/whatsapp-service";

export const runtime = "nodejs";

export default async function DashboardWhatsAppPage() {
  const [adminSession, session, conversations] = await Promise.all([
    getAdminSession(),
    getWhatsAppSession(),
    listWhatsAppConversations(),
  ]);

  return (
    <DashboardWhatsAppPanel
      currentAdmin={adminSession ? { id: adminSession.sub, email: adminSession.email } : null}
      initialConversations={conversations}
      initialSession={session}
    />
  );
}
