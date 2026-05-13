import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardWhatsAppConversation } from "@/components/dashboard/whatsapp-conversation";
import { getWhatsAppConversationById } from "@/lib/services/whatsapp-service";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
};

function humanizeState(state: string) {
  const map: Record<string, string> = {
    novo: "Novo",
    aguardando: "Aguardando",
    em_atendimento: "Em atendimento",
    finalizado: "Finalizado",
    bot: "Bot",
    human_handoff: "Atendente",
  };
  return map[state] || state;
}

export default async function DashboardWhatsAppConversationPage({ params }: PageProps) {
  const { id } = await params;
  const conversation = await getWhatsAppConversationById(id);

  if (!conversation) {
    notFound();
  }

  return (
    <main className="space-y-4 text-[var(--foreground)]">
      {/* Breadcrumb + Header */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--brand-orange)]"
            href="/dashboard/whatsapp"
          >
            ← Voltar para conversas
          </Link>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">
            {conversation.customerProfile.fullName}
          </h1>
          <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">{conversation.phone}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-[var(--foreground)]">
            {humanizeState(conversation.state)}
          </span>
          {conversation.order ? (
            <Link
              className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-green)]/30 bg-[var(--brand-green)]/10 px-2.5 py-1 text-[0.65rem] font-semibold text-[var(--brand-green-dark)] transition hover:bg-[var(--brand-green)]/20"
              href={`/dashboard/operacao`}
            >
              Pedido {conversation.order.code}
            </Link>
          ) : (
            <span className="rounded-full bg-[var(--background)] px-2.5 py-1 text-[0.65rem] font-semibold text-[var(--muted)]">
              Sem pedido vinculado
            </span>
          )}
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
