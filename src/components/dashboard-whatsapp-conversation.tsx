"use client";

import { useState } from "react";

type MessageItem = {
  id: string;
  direction: "inbound" | "outbound";
  content: string;
  createdAt: string;
};

type Props = {
  conversationId: string;
  initialMessages: MessageItem[];
};

export function DashboardWhatsAppConversation({ conversationId, initialMessages }: Props) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage() {
    try {
      setPending(true);
      setError(null);

      const response = await fetch(`/api/dashboard/whatsapp/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ content: message }),
      });

      const payload = (await response.json()) as {
        error?: {
          message?: string;
        };
      };

      if (!response.ok) {
        throw new Error(payload.error?.message || "Nao foi possivel enviar a mensagem.");
      }

      setMessages((current) => [
        ...current,
        {
          id: `temp-${Date.now()}`,
          direction: "outbound",
          content: message,
          createdAt: new Date().toISOString(),
        },
      ]);
      setMessage("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Falha ao enviar mensagem.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel shadow-sm transition hover:shadow-md hover:border-[var(--brand-orange)]/30 rounded-[2rem] border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--foreground)]">
      <p className="eyebrow mb-3 text-[var(--muted)]">Atendimento</p>
      <h2 className="text-2xl font-semibold tracking-tight">Mensagens</h2>

      <div className="mt-5 space-y-3">
        {messages.map((item) => (
          <div
            key={item.id}
            className={`max-w-[85%] rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${
              item.direction === "outbound"
                ? "ml-auto bg-accent text-[var(--foreground)]"
                : "bg-white/10 text-white/86"
            }`}
          >
            <p>{item.content}</p>
            <p className="mt-2 text-xs opacity-70">
              {new Date(item.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[1.4rem] border border-[var(--line)] bg-[var(--surface)] p-4">
        <label className="block text-sm font-semibold text-white/86">Responder manualmente</label>
        <textarea
          className="mt-3 min-h-28 w-full rounded-[1rem] border border-[var(--line)] bg-[#120c09] px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)]/50 focus:border-[var(--brand-orange)]/40"
          maxLength={2000}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Digite a resposta para o cliente..."
          value={message}
        />
        {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
        <div className="mt-4 flex justify-end">
          <button
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
            disabled={pending || !message.trim()}
            onClick={() => void sendMessage()}
            type="button"
          >
            {pending ? "Enviando..." : "Enviar mensagem"}
          </button>
        </div>
      </div>
    </section>
  );
}
