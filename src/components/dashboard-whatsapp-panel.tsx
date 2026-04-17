"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/* ═══════════════════════════════════════════════
   Types
═══════════════════════════════════════════════ */

type SessionEvent = { type: string; at: string; detail: string };

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
  customerProfile: { fullName: string };
  order: { code: string } | null;
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
  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || "Não foi possível concluir a ação.");
  return payload;
}

function formatRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/* ═══════════════════════════════════════════════
   Icons
═══════════════════════════════════════════════ */

function RefreshIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.304-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   Status helpers
═══════════════════════════════════════════════ */

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("conect")) return { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
  if (s.includes("qr") || s.includes("pareand") || s.includes("aguard"))
    return { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
  if (s.includes("err") || s.includes("falha"))
    return { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
  return { dot: "bg-gray-400", bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
}

function humanizeConvState(state: string) {
  const map: Record<string, string> = {
    novo: "Novo",
    aguardando: "Aguardando",
    em_atendimento: "Em atendimento",
    finalizado: "Finalizado",
    bot: "Bot",
  };
  return map[state] || state;
}

/* ═══════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════ */

export function DashboardWhatsAppPanel({ initialSession, initialConversations }: Props) {
  const [session, setSession] = useState(initialSession);
  const [conversations, setConversations] = useState(initialConversations);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [convSearch, setConvSearch] = useState("");

  const refresh = useCallback(async () => {
    const [sessionRes, convRes] = await Promise.all([
      fetch("/api/whatsapp/session", { cache: "no-store" }),
      fetch("/api/dashboard/whatsapp/conversations", { cache: "no-store" }),
    ]);
    const sessionPayload = await parseJson<{ session: SessionInfo }>(sessionRes);
    const convPayload = await parseJson<{ conversations: ConversationItem[] }>(convRes);
    setSession(sessionPayload.session);
    setConversations(convPayload.conversations);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh().catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(() => setFeedback(null), 4000);
    return () => window.clearTimeout(id);
  }, [feedback]);

  async function runAction(action: "connect" | "disconnect" | "reset") {
    try {
      setPendingAction(action);
      setError(null);
      setFeedback(null);
      const response = await fetch(`/api/whatsapp/session/${action}`, { method: "POST" });
      const payload = await parseJson<{ session: SessionInfo }>(response);
      setSession(payload.session);
      await refresh();
      setFeedback(
        action === "connect"
          ? "Cliente inicializado. Se aparecer o QR, escaneie com o WhatsApp da loja."
          : action === "disconnect"
          ? "Sessão desconectada."
          : "Sessão apagada. Um novo QR será gerado na próxima conexão."
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Falha ao executar a ação.");
    } finally {
      setPendingAction(null);
    }
  }

  const tone = statusTone(session.status);
  const isConnected = session.status.toLowerCase().includes("conect");

  const filteredConversations = conversations.filter((c) => {
    if (!convSearch.trim()) return true;
    const q = convSearch.trim().toLowerCase();
    return (
      c.customerProfile.fullName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.messages[0]?.content || "").toLowerCase().includes(q)
    );
  });

  return (
    <main className="space-y-4 text-[var(--foreground)]">
      {/* ─── Header ─── */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow text-[var(--muted)]">Canal da loja</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <span className="text-emerald-600">
              <WhatsAppIcon />
            </span>
            WhatsApp
          </h1>
          <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
            Conecte o número da loja, veja mensagens e atenda clientes pelo painel.
          </p>
        </div>
        <button
          aria-label="Atualizar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--muted)] transition hover:bg-[var(--background)]"
          onClick={() => void refresh()}
          type="button"
        >
          <RefreshIcon />
        </button>
      </section>

      {/* ─── Feedback ─── */}
      {feedback ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
          {feedback}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {/* ─── Session + QR ─── */}
      <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
        {/* Sessão */}
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Status da sessão
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`flex h-2 w-2 rounded-full ${tone.dot} ${isConnected ? "animate-pulse" : ""}`} />
                <span className="text-base font-bold capitalize">{session.status}</span>
              </div>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${tone.border} ${tone.bg} ${tone.text}`}>
              {isConnected ? "Online" : "Offline"}
            </span>
          </div>

          <div className="mt-3 grid gap-2 border-t border-[var(--line)] pt-3 sm:grid-cols-2">
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Número</p>
              <p className="mt-0.5 font-mono text-sm font-semibold">{session.connectedPhone || "—"}</p>
            </div>
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Conta</p>
              <p className="mt-0.5 truncate text-sm font-semibold">{session.connectedName || "Aguardando"}</p>
            </div>
          </div>

          <div className="mt-3 grid gap-1.5 rounded-lg bg-[var(--background)] p-2 text-[0.65rem] sm:grid-cols-2">
            <p>
              <span className="font-bold text-[var(--muted)]">Último evento:</span>{" "}
              <span>{session.lastEventAt ? new Date(session.lastEventAt).toLocaleString("pt-BR") : "—"}</span>
            </p>
            <p>
              <span className="font-bold text-[var(--muted)]">Último erro:</span>{" "}
              <span className={session.lastError ? "text-red-600" : ""}>{session.lastError || "Nenhum"}</span>
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
            <button
              className="flex-1 rounded-full bg-[var(--brand-orange)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--brand-orange-dark)] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-initial"
              disabled={pendingAction !== null}
              onClick={() => void runAction("connect")}
              type="button"
            >
              {pendingAction === "connect" ? "Conectando…" : isConnected ? "Reconectar" : "Conectar / Gerar QR"}
            </button>
            <button
              className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pendingAction !== null}
              onClick={() => void runAction("disconnect")}
              type="button"
            >
              {pendingAction === "disconnect" ? "Desconectando…" : "Desconectar"}
            </button>
            <button
              className="rounded-full border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pendingAction !== null}
              onClick={() => void runAction("reset")}
              type="button"
            >
              {pendingAction === "reset" ? "Resetando…" : "Resetar"}
            </button>
          </div>
        </article>

        {/* QR */}
        <article className="flex w-full flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm lg:w-64">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">QR da sessão</p>
          <div className="mt-3 flex h-48 w-48 items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-white p-2">
            {session.qrDataUrl ? (
              <Image
                alt="QR code do WhatsApp"
                className="h-full w-full object-contain"
                height={192}
                src={session.qrDataUrl}
                unoptimized
                width={192}
              />
            ) : (
              <p className="px-3 text-center text-[0.7rem] leading-4 text-[var(--muted)]">
                {isConnected ? "Sessão conectada. Use 'Resetar' para trocar de conta." : "Clique em conectar para gerar o QR."}
              </p>
            )}
          </div>
          <p className="mt-2 text-center text-[0.65rem] text-[var(--muted)]">
            Escaneie com o WhatsApp Business da loja.
          </p>
        </article>
      </section>

      {/* ─── Conversas + Eventos ─── */}
      <section className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        {/* Conversas */}
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold tracking-tight">Conversas</p>
              <p className="mt-0.5 text-[0.65rem] text-[var(--muted)]">{conversations.length} no total</p>
            </div>
            <input
              className="w-40 rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-xs outline-none transition focus:border-[var(--brand-orange)] sm:w-56"
              onChange={(e) => setConvSearch(e.target.value)}
              placeholder="Buscar…"
              value={convSearch}
            />
          </div>

          <div className="mt-3 space-y-2">
            {filteredConversations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--background)] px-4 py-8 text-center text-xs text-[var(--muted)]">
                {conversations.length === 0
                  ? "Ainda não chegaram conversas pelo WhatsApp."
                  : "Nenhuma conversa bate com a busca."}
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const lastMessage = conversation.messages[0];
                return (
                  <Link
                    className="group block overflow-hidden rounded-xl border border-[var(--line)] bg-white transition hover:border-[var(--brand-orange)]/40 hover:shadow-sm"
                    href={`/dashboard/whatsapp/${conversation.id}`}
                    key={conversation.id}
                  >
                    <div className="flex items-start justify-between gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold">{conversation.customerProfile.fullName}</p>
                          <span className="rounded-full bg-[var(--background)] px-1.5 py-0.5 text-[0.6rem] font-semibold text-[var(--muted)]">
                            {humanizeConvState(conversation.state)}
                          </span>
                          {conversation.order ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-green)]/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-[var(--brand-green-dark)]">
                              <LinkIcon />
                              {conversation.order.code}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 font-mono text-[0.65rem] text-[var(--muted)]">{conversation.phone}</p>
                        {lastMessage ? (
                          <p className="mt-1 line-clamp-1 text-xs text-[var(--foreground)]">
                            <span className="text-[var(--muted)]">
                              {lastMessage.direction === "outbound" ? "Você: " : ""}
                            </span>
                            {lastMessage.content}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs italic text-[var(--muted)]">Sem mensagens ainda.</p>
                        )}
                      </div>
                      <span className="shrink-0 text-[0.65rem] text-[var(--muted)]">
                        {formatRelative(conversation.updatedAt)}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </article>

        {/* Eventos */}
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-sm font-bold tracking-tight">Linha do tempo</p>
          <p className="mt-0.5 text-[0.65rem] text-[var(--muted)]">Últimos eventos da sessão</p>

          <div className="mt-3 space-y-2">
            {session.events.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--background)] px-3 py-6 text-center text-[0.65rem] text-[var(--muted)]">
                Nenhum evento ainda.
              </div>
            ) : (
              session.events.slice(0, 12).map((event) => (
                <div
                  className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2"
                  key={`${event.type}-${event.at}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-[var(--background)] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-[var(--foreground)]">
                      {event.type}
                    </span>
                    <span className="text-[0.6rem] text-[var(--muted)]">
                      {new Date(event.at).toLocaleTimeString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[0.7rem] leading-4 text-[var(--foreground)]">{event.detail}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
