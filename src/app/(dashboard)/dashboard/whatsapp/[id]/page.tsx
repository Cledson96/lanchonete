import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardWhatsAppConversation } from "@/components/dashboard-whatsapp-conversation";
import { getWhatsAppConversationById } from "@/lib/services/whatsapp-service";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardWhatsAppConversationPage({ params }: PageProps) {
  const { id } = await params;
  const conversation = await getWhatsAppConversationById(id);

  if (!conversation) {
    notFound();
  }

  return (
    <main className="space-y-6 text-[var(--foreground)]">
      <section className="panel shadow-sm transition hover:shadow-md hover:border-[var(--brand-orange)]/30 rounded-[2rem] border-[var(--line)] bg-[var(--surface)] p-6">
        <Link
          className="text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
          href="/dashboard/whatsapp"
        >
          ← Voltar para o painel do WhatsApp
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="eyebrow mb-3 text-[var(--muted)]">Conversa</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {conversation.customerProfile.fullName}
            </h1>
            <p className="mt-3 text-sm text-white/68">{conversation.phone}</p>
          </div>
          <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/6 px-4 py-4 text-sm text-white/76">
            <p>Estado atual: {conversation.state}</p>
            <p className="mt-2">Pedido vinculado: {conversation.order?.code || "Nenhum"}</p>
          </div>
        </div>
      </section>

      <DashboardWhatsAppConversation
        conversationId={conversation.id}
        initialMessages={conversation.messages.map((message) => ({
          id: message.id,
          direction: message.direction,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
