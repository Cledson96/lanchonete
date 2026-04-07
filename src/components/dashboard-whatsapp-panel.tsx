"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type SessionEvent = {
  type: string;
  at: string;
  detail: string;
};

type SessionInfo = {
  status: string;
  connectedPhone: string | null;
  connectedName: string | null;
  qrAvailable: boolean;
  qrDataUrl: string | null;
  lastEventAt: string | null;
  lastError: string | null;
  events: SessionEvent[];
};

type ConversationItem = {
  id: string;
  phone: string;
  state: string;
  updatedAt: string;
  customerProfile: {
    fullName: string;
  };
  order: {
    code: string;
  } | null;
  messages: Array<{
    content: string;
    direction: "inbound" | "outbound";
    createdAt: string;
  }>;
};

type Props = {
  initialSession: SessionInfo;
  initialConversations: ConversationItem[];
};

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & {
    error?: {
      message?: string;
    };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || "Nao foi possivel concluir a acao.");
  }

  return payload;
}

export function DashboardWhatsAppPanel({ initialSession, initialConversations }: Props) {
  const [session, setSession] = useState(initialSession);
  const [conversations, setConversations] = useState(initialConversations);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [sessionResponse, conversationsResponse] = await Promise.all([
      fetch("/api/whatsapp/session", { cache: "no-store" }),
      fetch("/api/dashboard/whatsapp/conversations", { cache: "no-store" }),
    ]);

    const sessionPayload = await parseJson<{ session: SessionInfo }>(sessionResponse);
    const conversationsPayload = await parseJson<{ conversations: ConversationItem[] }>(
      conversationsResponse,
    );

    setSession(sessionPayload.session);
    setConversations(conversationsPayload.conversations);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh().catch(() => undefined);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  async function runAction(action: "connect" | "disconnect" | "reset") {
    try {
      setPendingAction(action);
      setError(null);
      setFeedback(null);

      const response = await fetch(`/api/whatsapp/session/${action}`, {
        method: "POST",
      });
      const payload = await parseJson<{ session: SessionInfo }>(response);
      setSession(payload.session);
      await refresh();
      setFeedback(
        action === "connect"
          ? "Cliente inicializado. Se aparecer o QR, escaneie com o WhatsApp da loja."
          : action === "disconnect"
            ? "Sessao desconectada."
            : "Sessao apagada. Um novo QR sera gerado na proxima conexao.",
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Falha ao executar a acao.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main className="space-y-6 text-white">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <article className="panel rounded-[2rem] border-white/10 bg-white/7 p-6">
          <p className="eyebrow mb-3 text-white/60">Canal da loja</p>
          <h1 className="text-3xl font-semibold tracking-tight">WhatsApp Web</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
            Conecte o numero da loja por QR code, acompanhe o estado da sessao e veja
            os ultimos eventos do cliente em tempo real.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
              <p className="text-sm text-white/56">Status</p>
              <p className="mt-3 text-lg font-semibold capitalize">{session.status}</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
              <p className="text-sm text-white/56">Numero conectado</p>
              <p className="mt-3 text-lg font-semibold">{session.connectedPhone || "Sem conexao"}</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
              <p className="text-sm text-white/56">Conta</p>
              <p className="mt-3 text-lg font-semibold">{session.connectedName || "Aguardando leitura"}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
              disabled={pendingAction !== null}
              onClick={() => void runAction("connect")}
              type="button"
            >
              {pendingAction === "connect" ? "Conectando..." : "Conectar / gerar QR"}
            </button>
            <button
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/86 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={pendingAction !== null}
              onClick={() => void runAction("disconnect")}
              type="button"
            >
              Desconectar
            </button>
            <button
              className="rounded-full border border-red-300/30 px-5 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={pendingAction !== null}
              onClick={() => void runAction("reset")}
              type="button"
            >
              Resetar sessao
            </button>
          </div>

          {feedback ? (
            <div className="mt-4 rounded-[1.3rem] border border-emerald-300/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
              {feedback}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-[1.3rem] border border-red-300/20 bg-red-500/10 px-4 py-4 text-sm text-red-100">
              {error}
            </div>
          ) : null}
        </article>

        <article className="panel rounded-[2rem] border-white/10 bg-white/7 p-6">
          <p className="eyebrow mb-3 text-white/60">Pareamento</p>
          <h2 className="text-2xl font-semibold tracking-tight">QR code da sessao</h2>
          <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-[1.6rem] border border-dashed border-white/12 bg-[#120c09] p-5">
            {session.qrDataUrl ? (
              <Image
                alt="QR code do WhatsApp"
                className="w-full max-w-[280px] rounded-[1.25rem] bg-white p-3"
                height={280}
                src={session.qrDataUrl}
                unoptimized
                width={280}
              />
            ) : (
              <div className="max-w-xs text-center text-sm leading-6 text-white/62">
                {session.status === "conectado"
                  ? "Sessao conectada. Se quiser trocar de conta, use resetar sessao."
                  : "Clique em conectar para gerar o QR e escaneie com o WhatsApp Business da loja."}
              </div>
            )}
          </div>

          <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/6 p-4 text-sm text-white/72">
            <p>
              Ultimo evento: {session.lastEventAt ? new Date(session.lastEventAt).toLocaleString("pt-BR") : "—"}
            </p>
            <p className="mt-2">Ultimo erro: {session.lastError || "Nenhum"}</p>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]">
        <article className="panel rounded-[2rem] border-white/10 bg-white/7 p-6">
          <p className="eyebrow mb-3 text-white/60">Eventos</p>
          <h2 className="text-2xl font-semibold tracking-tight">Linha do tempo</h2>
          <div className="mt-5 space-y-3">
            {session.events.length ? (
              session.events.map((event) => (
                <div
                  key={`${event.type}-${event.at}`}
                  className="rounded-[1.3rem] border border-white/10 bg-white/6 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold capitalize text-white">{event.type}</span>
                    <span className="text-xs text-white/50">
                      {new Date(event.at).toLocaleTimeString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/70">{event.detail}</p>
                </div>
              ))
            ) : (
              <p className="rounded-[1.3rem] border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/62">
                Nenhum evento do cliente ainda.
              </p>
            )}
          </div>
        </article>

        <article className="panel rounded-[2rem] border-white/10 bg-white/7 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow mb-3 text-white/60">Inbox</p>
              <h2 className="text-2xl font-semibold tracking-tight">Conversas</h2>
            </div>
            <button
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/78 transition hover:bg-white/8"
              onClick={() => void refresh()}
              type="button"
            >
              Atualizar
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {conversations.length ? (
              conversations.map((conversation) => {
                const lastMessage = conversation.messages[0];
                return (
                  <Link
                    key={conversation.id}
                    className="block rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4 transition hover:bg-white/10"
                    href={`/dashboard/whatsapp/${conversation.id}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">
                          {conversation.customerProfile.fullName}
                        </p>
                        <p className="mt-1 text-sm text-white/54">{conversation.phone}</p>
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/70">
                        {conversation.state}
                      </span>
                    </div>
                    {conversation.order ? (
                      <p className="mt-3 text-xs text-emerald-100/80">Pedido vinculado: {conversation.order.code}</p>
                    ) : null}
                    <p className="mt-3 text-sm leading-6 text-white/70">
                      {lastMessage ? lastMessage.content : "Sem mensagens registradas ainda."}
                    </p>
                  </Link>
                );
              })
            ) : (
              <p className="rounded-[1.3rem] border border-white/10 bg-white/6 px-4 py-4 text-sm text-white/62">
                Ainda nao chegaram conversas pelo WhatsApp.
              </p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
