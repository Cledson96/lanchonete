"use client";

import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { Typography } from "@/components/ui/typography";

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

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(iso));
}

function formatDateLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

function SendIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DashboardWhatsAppConversation({ conversationId, initialMessages }: Props) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  async function sendMessage() {
    if (!message.trim()) return;
    try {
      setPending(true);
      setError(null);
      const response = await fetch(
        `/api/dashboard/whatsapp/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: message }),
        }
      );
      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        throw new Error(payload.error?.message || "Não foi possível enviar a mensagem.");
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  // Agrupa mensagens por dia
  const grouped: Array<{ label: string; items: MessageItem[] }> = [];
  for (const msg of messages) {
    const label = formatDateLabel(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.label === label) {
      last.items.push(msg);
    } else {
      grouped.push({ label, items: [msg] });
    }
  }

  return (
    <section className="flex h-[calc(100dvh-18rem)] min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-sm">
      {/* Chat area */}
      <div
        className="flex-1 space-y-3 overflow-y-auto bg-[var(--background)]/40 p-4"
        ref={scrollRef}
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(36,18,8,0.04) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState className="bg-white px-4 py-6 text-xs">
              Nenhuma mensagem ainda. Envie a primeira para iniciar.
            </EmptyState>
          </div>
        ) : (
          grouped.map((group) => (
            <div className="space-y-2" key={group.label}>
              <div className="flex justify-center">
                <Typography
                  as="span"
                  className="rounded-full bg-white/80 px-2.5 py-0.5 shadow-sm"
                  tone="muted"
                  variant="caption-sm"
                >
                  {group.label}
                </Typography>
              </div>
              {group.items.map((item) => {
                const outbound = item.direction === "outbound";
                return (
                  <div
                    className={`flex ${outbound ? "justify-end" : "justify-start"}`}
                    key={item.id}
                  >
                    <div
                      className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-5 shadow-sm ${
                        outbound
                          ? "rounded-br-sm bg-emerald-500 text-white"
                          : "rounded-bl-sm bg-white text-[var(--foreground)]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{item.content}</p>
                      <p
                        className={`mt-1 text-right text-[0.6rem] ${
                          outbound ? "text-emerald-50/80" : "text-[var(--muted)]"
                        }`}
                      >
                        {formatTime(item.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-[var(--line)] bg-[var(--surface)] p-3">
        {error ? <Alert className="mb-2 px-3 py-1.5" tone="error">{error}</Alert> : null}
        <div className="flex items-end gap-2">
          <textarea
            className="min-h-[42px] flex-1 resize-none rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm leading-5 outline-none transition focus:border-[var(--brand-orange)]"
            maxLength={2000}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite a resposta para o cliente…  (Enter envia, Shift+Enter quebra linha)"
            rows={1}
            value={message}
          />
          <IconButton
            disabled={pending || !message.trim()}
            className="h-10 w-10 bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white"
            label="Enviar"
            onClick={() => void sendMessage()}
          >
            {pending ? (
              <Typography as="span" className="text-white" variant="caption-sm">…</Typography>
            ) : (
              <SendIcon />
            )}
          </IconButton>
        </div>
      </div>
    </section>
  );
}
