import { createServer } from "node:http";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { Readable } from "node:stream";
import { Boom } from "@hapi/boom";
import NodeCache from "@cacheable/node-cache";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  getContentType,
  makeCacheableSignalKeyStore,
  normalizeMessageContent,
  useMultiFileAuthState,
  WAMessageStatus,
  type ConnectionState,
  type MessageUpsertType,
  type WAMessage,
  type WAMessageUpdate,
  type WASocket,
} from "@whiskeysockets/baileys";
import P from "pino";
import QRCode from "qrcode";
import type {
  WhatsAppClientStatus,
  WhatsAppConnectionUpdateEvent,
  WhatsAppInboundMessageEvent,
  WhatsAppMessageDeliveryStatus,
  WhatsAppMessageStatusEvent,
  WhatsAppRuntimeEvent,
  WhatsAppRuntimeEventType,
  WhatsAppSendTextResult,
  WhatsAppSessionInfo,
  WhatsAppWebhookEvent,
} from "../../src/lib/whatsapp-contract";

const logger = P({ level: process.env.NODE_ENV === "production" ? "info" : "silent" });
const port = Number(process.env.WHATSAPP_WORKER_PORT || "3001");
const appInternalUrl = process.env.APP_INTERNAL_URL || "http://127.0.0.1:3000";
const workerToken = process.env.WHATSAPP_WORKER_TOKEN || "local-whatsapp-worker-token";
const webhookSecret =
  process.env.WHATSAPP_INTERNAL_WEBHOOK_SECRET || "local-whatsapp-webhook-secret";
const sessionPath = process.env.WHATSAPP_SESSION_PATH || ".runtime/whatsapp-session";
const clientName = process.env.WHATSAPP_CLIENT_NAME || "lanchonete-familia";
const allowedCountryCode = process.env.WHATSAPP_ALLOWED_COUNTRY_CODE || "55";
const autoStart = process.env.WHATSAPP_AUTO_START !== "false";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function fail(status: number, message: string) {
  return json({ error: { message } }, status);
}

function authDir() {
  return resolve(process.cwd(), sessionPath, clientName);
}

function extractPhoneFromJid(jid?: string | null) {
  if (!jid) {
    return null;
  }

  const [user] = jid.split("@");
  return user?.split(":")[0] || null;
}

function buildPhoneVariants(phone: string) {
  const variants = [phone];

  if (
    phone.startsWith(allowedCountryCode) &&
    phone.length === allowedCountryCode.length + 2 + 9
  ) {
    const areaCode = phone.slice(allowedCountryCode.length, allowedCountryCode.length + 2);
    const subscriber = phone.slice(allowedCountryCode.length + 2);

    if (subscriber.startsWith("9") && subscriber.length === 9) {
      variants.push(`${allowedCountryCode}${areaCode}${subscriber.slice(1)}`);
    }
  }

  return variants;
}

function normalizeDeliveryStatus(status?: WAMessageUpdate["update"]["status"] | null) {
  if (typeof status !== "number") {
    return null;
  }

  if (status >= WAMessageStatus.READ) {
    return "read" satisfies WhatsAppMessageDeliveryStatus;
  }

  if (status >= WAMessageStatus.DELIVERY_ACK) {
    return "delivered" satisfies WhatsAppMessageDeliveryStatus;
  }

  if (status >= WAMessageStatus.SERVER_ACK) {
    return "sent" satisfies WhatsAppMessageDeliveryStatus;
  }

  return "pending" satisfies WhatsAppMessageDeliveryStatus;
}

function extractText(message: WAMessage) {
  const content = normalizeMessageContent(message.message);
  const type = getContentType(content);

  if (!content || !type) {
    return { body: null, rawType: null };
  }

  if (type === "conversation") {
    return { body: content.conversation || null, rawType: type };
  }

  if (type === "extendedTextMessage") {
    return { body: content.extendedTextMessage?.text || null, rawType: type };
  }

  if (type === "imageMessage") {
    return { body: content.imageMessage?.caption || null, rawType: type };
  }

  if (type === "videoMessage") {
    return { body: content.videoMessage?.caption || null, rawType: type };
  }

  if (type === "documentMessage") {
    return { body: content.documentMessage?.caption || null, rawType: type };
  }

  return { body: null, rawType: type };
}

async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new Error("JSON invalido.");
  }
}

class WhatsAppWorkerManager {
  private socket: WASocket | null = null;
  private initPromise: Promise<void> | null = null;
  private status: WhatsAppClientStatus = "desconectado";
  private qrString: string | null = null;
  private connectedPhone: string | null = null;
  private connectedName: string | null = null;
  private startedAt: string | null = null;
  private lastEventAt: string | null = null;
  private lastError: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private currentRunId = 0;
  private manualStop = false;
  private readonly events: WhatsAppRuntimeEvent[] = [];
  private readonly msgRetryCounterStore = new NodeCache();
  private readonly msgRetryCounterCache = {
    get: <T>(key: string) => this.msgRetryCounterStore.get(key) as T | undefined,
    set: <T>(key: string, value: T) => this.msgRetryCounterStore.set(key, value),
    del: (key: string) => this.msgRetryCounterStore.del(key),
    flushAll: () => this.msgRetryCounterStore.flushAll(),
  };

  private recordEvent(type: WhatsAppRuntimeEventType, detail: string) {
    const event = {
      type,
      detail,
      at: new Date().toISOString(),
    } satisfies WhatsAppRuntimeEvent;

    this.lastEventAt = event.at;
    this.events.unshift(event);
    this.events.splice(25);

    if (type === "error" || type === "auth_failure") {
      this.lastError = detail;
    }
  }

  private clearReconnectTimer() {
    if (!this.reconnectTimer) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private resetSessionState(status: WhatsAppClientStatus) {
    this.status = status;
    this.socket = null;
    this.qrString = null;
    this.connectedPhone = null;
    this.connectedName = null;
    this.startedAt = null;
    this.initPromise = null;
  }

  private scheduleReconnect(reason: string) {
    this.clearReconnectTimer();
    this.reconnectAttempts += 1;
    const delayMs = Math.min(30_000, Math.max(2_000, this.reconnectAttempts * 3_000));
    this.recordEvent("init", `Reconexao agendada em ${delayMs / 1000}s: ${reason}`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.ensureStarted().catch((error) => {
        this.recordEvent(
          "error",
          error instanceof Error ? error.message : "Erro ao reconectar o WhatsApp.",
        );
      });
    }, delayMs);
  }

  private async emitWebhook(event: WhatsAppWebhookEvent) {
    try {
      const response = await fetch(new URL("/api/whatsapp/webhook", appInternalUrl), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-whatsapp-worker-secret": webhookSecret,
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Webhook retornou ${response.status}.`);
      }
    } catch (error) {
      this.recordEvent(
        "error",
        error instanceof Error
          ? `Falha ao entregar evento interno: ${error.message}`
          : "Falha ao entregar evento interno.",
      );
    }
  }

  private async emitConnectionUpdate() {
    const payload = {
      status: this.status,
      connectedPhone: this.connectedPhone,
      connectedName: this.connectedName,
      lastError: this.lastError,
    } satisfies WhatsAppConnectionUpdateEvent;

    await this.emitWebhook({ type: "connection.update", payload });
  }

  private async handleMessagesUpsert(type: MessageUpsertType, messages: WAMessage[]) {
    if (type !== "notify") {
      return;
    }

    for (const message of messages) {
      const messageId = message.key.id;
      const from = message.key.remoteJid;

      if (!messageId || !from || message.key.fromMe) {
        continue;
      }

      const { body, rawType } = extractText(message);
      const payload = {
        messageId,
        from,
        fromMe: Boolean(message.key.fromMe),
        body,
        rawType,
        timestamp: message.messageTimestamp ? Number(message.messageTimestamp) : null,
        pushName: message.pushName || null,
        notifyName: null,
      } satisfies WhatsAppInboundMessageEvent;

      this.recordEvent("message", `Mensagem recebida de ${from}.`);
      await this.emitWebhook({ type: "message.received", payload });
    }
  }

  private async handleMessagesUpdate(updates: WAMessageUpdate[]) {
    for (const update of updates) {
      if (!update.key.id || !update.key.fromMe) {
        continue;
      }

      const status = normalizeDeliveryStatus(update.update.status);
      if (!status) {
        continue;
      }

      const payload = {
        messageId: update.key.id,
        chatId: update.key.remoteJid || null,
        status,
        timestamp: new Date().toISOString(),
      } satisfies WhatsAppMessageStatusEvent;

      this.recordEvent("message_ack", `Atualizacao de entrega ${status} para ${payload.messageId}.`);
      await this.emitWebhook({ type: "message.status", payload });
    }
  }

  private async handleConnectionUpdate(
    sock: WASocket,
    runId: number,
    update: Partial<ConnectionState>,
  ) {
    if (runId !== this.currentRunId || sock !== this.socket) {
      return;
    }

    if (update.qr) {
      this.status = "aguardando_qr";
      this.qrString = update.qr;
      this.lastError = null;
      this.recordEvent("qr", "QR atualizado para pareamento.");
      await this.emitConnectionUpdate();
    }

    if (update.connection === "connecting") {
      this.status = "inicializando";
      this.recordEvent("change_state", "Conexao com WhatsApp em andamento.");
      await this.emitConnectionUpdate();
    }

    if (update.connection === "open") {
      this.status = "conectado";
      this.qrString = null;
      this.startedAt = null;
      this.lastError = null;
      this.reconnectAttempts = 0;
      this.connectedPhone = extractPhoneFromJid(sock.user?.id);
      this.connectedName = sock.user?.verifiedName || sock.user?.name || this.connectedPhone;
      this.recordEvent("ready", "Cliente WhatsApp conectado.");
      await this.emitConnectionUpdate();
    }

    if (update.connection === "close") {
      const statusCode = (update.lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const detail =
        update.lastDisconnect?.error instanceof Error
          ? update.lastDisconnect.error.message
          : "Cliente desconectado.";
      const shouldReconnect = !this.manualStop && statusCode !== DisconnectReason.loggedOut;

      this.resetSessionState(statusCode === DisconnectReason.loggedOut ? "erro" : "desconectado");
      this.lastError =
        statusCode === DisconnectReason.loggedOut
          ? "Sessao encerrada pelo WhatsApp. Use resetar para gerar um novo QR."
          : shouldReconnect
            ? null
            : detail;
      this.recordEvent("disconnected", detail);
      await this.emitConnectionUpdate();

      if (shouldReconnect) {
        this.scheduleReconnect(detail);
      }
    }
  }

  async ensureStarted() {
    if (this.socket && this.status === "conectado") {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.manualStop = false;
    this.clearReconnectTimer();
    this.status = "inicializando";
    this.startedAt = new Date().toISOString();
    this.lastError = null;
    this.recordEvent("init", "Inicializando cliente WhatsApp.");

    const runId = ++this.currentRunId;

    this.initPromise = (async () => {
      await mkdir(authDir(), { recursive: true });
      const { state, saveCreds } = await useMultiFileAuthState(authDir());
      const { version } = await fetchLatestBaileysVersion();
      const sock = makeWASocket({
        version,
        logger,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: true,
        msgRetryCounterCache: this.msgRetryCounterCache,
        getMessage: async () => undefined,
      });

      if (runId !== this.currentRunId) {
        await sock.end(undefined);
        return;
      }

      this.socket = sock;
      sock.ev.on("creds.update", saveCreds);
      sock.ev.on("messages.upsert", ({ messages, type }) => {
        void this.handleMessagesUpsert(type, messages);
      });
      sock.ev.on("messages.update", (updates) => {
        void this.handleMessagesUpdate(updates);
      });
      sock.ev.on("connection.update", (update) => {
        void this.handleConnectionUpdate(sock, runId, update);
      });
    })()
      .catch((error) => {
        if (runId === this.currentRunId) {
          this.resetSessionState("erro");
          this.recordEvent(
            "error",
            error instanceof Error ? error.message : "Erro ao inicializar o cliente WhatsApp.",
          );
        }

        throw error;
      })
      .finally(() => {
        if (runId === this.currentRunId) {
          this.initPromise = null;
        }
      });

    return this.initPromise;
  }

  async disconnect() {
    this.manualStop = true;
    this.currentRunId += 1;
    this.clearReconnectTimer();

    const current = this.socket;
    this.resetSessionState("desconectado");
    this.lastError = null;
    this.recordEvent("disconnected", "Cliente encerrado manualmente.");
    await this.emitConnectionUpdate();

    if (current) {
      await current.end(undefined);
    }
  }

  async resetSession() {
    await this.disconnect();
    await rm(authDir(), { recursive: true, force: true });
    this.recordEvent("init", "Sessao local removida. Novo QR sera gerado ao reconectar.");
  }

  async sendTextMessage(phone: string, body: string): Promise<WhatsAppSendTextResult> {
    await this.ensureStarted();

    if (!this.socket || this.status !== "conectado") {
      throw new Error(
        "WhatsApp desconectado. Escaneie o QR no dashboard antes de enviar mensagens.",
      );
    }

    let lastError: unknown = null;

    for (const variant of buildPhoneVariants(phone)) {
      try {
        const targetJid = `${variant}@s.whatsapp.net`;
        const lookup = await this.socket.onWhatsApp(targetJid);
        const target = lookup?.find((entry) => entry.exists)?.jid;

        if (!target) {
          throw new Error(
            "Esse numero nao foi encontrado no WhatsApp. Confira o DDD e os digitos do celular.",
          );
        }

        const sent = await this.socket.sendMessage(target, { text: body });
        this.recordEvent(
          "send",
          variant === phone
            ? `Mensagem enviada para ${phone}.`
            : `Mensagem enviada para ${phone} usando fallback ${variant}.`,
        );

        const externalMessageId = sent?.key?.id;
        return { externalMessageId: externalMessageId || undefined };
      } catch (error) {
        lastError = error;
      }
    }

    throw (
      lastError instanceof Error
        ? lastError
        : new Error("Nao foi possivel enviar a mensagem pelo WhatsApp.")
    );
  }

  async getSessionInfo(): Promise<WhatsAppSessionInfo> {
    return {
      status: this.status,
      connectedPhone: this.connectedPhone,
      connectedName: this.connectedName,
      qrAvailable: Boolean(this.qrString),
      qrDataUrl: this.qrString ? await QRCode.toDataURL(this.qrString) : null,
      isStarting: Boolean(
        this.initPromise || this.status === "inicializando" || this.status === "aguardando_qr",
      ),
      startedAt: this.startedAt,
      lastEventAt: this.lastEventAt,
      lastError: this.lastError,
      events: [...this.events],
    };
  }
}

const manager = new WhatsAppWorkerManager();

async function handleRequest(request: Request) {
  const url = new URL(request.url);
  const isAuthorized = request.headers.get("authorization") === `Bearer ${workerToken}`;

  if (url.pathname === "/health") {
    return json({ ok: true, status: (await manager.getSessionInfo()).status });
  }

  if (!isAuthorized) {
    return fail(401, "Nao autorizado.");
  }

  if (request.method === "GET" && url.pathname === "/session") {
    return json({ session: await manager.getSessionInfo() });
  }

  if (request.method === "POST" && url.pathname === "/connect") {
    await manager.ensureStarted();
    return json({ session: await manager.getSessionInfo() });
  }

  if (request.method === "POST" && url.pathname === "/disconnect") {
    await manager.disconnect();
    return json({ session: await manager.getSessionInfo() });
  }

  if (request.method === "POST" && url.pathname === "/reset") {
    await manager.resetSession();
    return json({ session: await manager.getSessionInfo() });
  }

  if (request.method === "POST" && url.pathname === "/send") {
    const body = await readJsonBody(request);
    const to = typeof body.to === "string" ? body.to.trim() : "";
    const text = typeof body.body === "string" ? body.body : "";

    if (!to || !text) {
      return fail(422, "Os campos 'to' e 'body' sao obrigatorios.");
    }

    const result = await manager.sendTextMessage(to, text);
    return json({ result });
  }

  return fail(404, "Rota nao encontrada.");
}

const server = createServer((req, res) => {
  const origin = `http://${req.headers.host || `127.0.0.1:${port}`}`;
  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : (Readable.toWeb(req) as BodyInit);
  const requestInit = {
    method: req.method,
    headers: req.headers as HeadersInit,
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" };
  const request = new Request(new URL(req.url || "/", origin), requestInit);

  void handleRequest(request)
    .catch((error) => {
      console.error("[whatsapp-worker]", error);
      return fail(500, error instanceof Error ? error.message : "Erro inesperado.");
    })
    .then(async (response) => {
      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      res.end(buffer);
    });
});

if (autoStart) {
  void manager.ensureStarted().catch((error) => {
    console.error("[whatsapp-worker:auto-start]", error);
  });
}

server.listen(port, () => {
  console.info(`[whatsapp-worker] ouvindo na porta ${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void manager.disconnect().finally(() => {
      server.close(() => process.exit(0));
    });
  });
}
