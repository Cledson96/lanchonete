import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { Client, LocalAuth, type ClientOptions, type Message, type MessageAck } from "whatsapp-web.js";
import QRCode from "qrcode";
import { config } from "@/lib/config";

type WhatsAppClientStatus =
  | "desconectado"
  | "inicializando"
  | "aguardando_qr"
  | "conectado"
  | "erro";

type WhatsAppRuntimeEventType =
  | "init"
  | "qr"
  | "authenticated"
  | "ready"
  | "auth_failure"
  | "disconnected"
  | "loading_screen"
  | "change_state"
  | "message"
  | "message_ack"
  | "send"
  | "error";

type WhatsAppRuntimeEvent = {
  type: WhatsAppRuntimeEventType;
  at: string;
  detail: string;
};

type InboundListener = (message: Message) => void | Promise<void>;
type AckListener = (message: Message, ack: MessageAck) => void | Promise<void>;

export type WhatsAppSessionInfo = {
  status: WhatsAppClientStatus;
  connectedPhone: string | null;
  connectedName: string | null;
  qrAvailable: boolean;
  qrDataUrl: string | null;
  isStarting: boolean;
  startedAt: string | null;
  lastEventAt: string | null;
  lastError: string | null;
  events: WhatsAppRuntimeEvent[];
};

const globalForWhatsApp = globalThis as typeof globalThis & {
  whatsappClientManager?: WhatsAppClientManager;
  whatsappListenersBound?: boolean;
};

function sessionDir() {
  return resolve(process.cwd(), config.whatsappSessionPath);
}

function buildClientOptions(): ClientOptions {
  return {
    authStrategy: new LocalAuth({
      clientId: config.whatsappClientName,
      dataPath: sessionDir(),
    }),
    puppeteer: {
      headless: config.whatsappHeadless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    },
  } satisfies ClientOptions;
}

function buildPhoneVariants(phone: string) {
  const variants = [phone];

  if (
    phone.startsWith(config.whatsappAllowedCountryCode) &&
    phone.length === config.whatsappAllowedCountryCode.length + 2 + 9
  ) {
    const country = config.whatsappAllowedCountryCode;
    const areaCode = phone.slice(country.length, country.length + 2);
    const subscriber = phone.slice(country.length + 2);

    if (subscriber.startsWith("9") && subscriber.length === 9) {
      variants.push(`${country}${areaCode}${subscriber.slice(1)}`);
    }
  }

  return variants;
}

class WhatsAppClientManager {
  private client: Client | null = null;
  private status: WhatsAppClientStatus = "desconectado";
  private qrString: string | null = null;
  private connectedPhone: string | null = null;
  private connectedName: string | null = null;
  private startedAt: string | null = null;
  private lastEventAt: string | null = null;
  private lastError: string | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private initRunId = 0;
  private inboundListeners = new Set<InboundListener>();
  private ackListeners = new Set<AckListener>();
  private readonly events: WhatsAppRuntimeEvent[] = [];

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

  private runInboundListener(listener: InboundListener, message: Message) {
    Promise.resolve(listener(message)).catch((error) => {
      this.recordEvent(
        "error",
        error instanceof Error
          ? error.message
          : "Erro inesperado ao processar mensagem recebida.",
      );
      console.error("[whatsapp:inbound-listener]", error);
    });
  }

  private runAckListener(listener: AckListener, message: Message, ack: MessageAck) {
    Promise.resolve(listener(message, ack)).catch((error) => {
      this.recordEvent(
        "error",
        error instanceof Error
          ? error.message
          : "Erro inesperado ao processar status da mensagem.",
      );
      console.error("[whatsapp:ack-listener]", error);
    });
  }

  private ensureClient() {
    if (this.client) {
      return this.client;
    }

    const client = new Client(buildClientOptions());

    client.on("qr", (qr) => {
      this.status = "aguardando_qr";
      this.qrString = qr;
      this.lastError = null;
      this.recordEvent("qr", "QR atualizado para pareamento.");
    });

    client.on("authenticated", () => {
      this.lastError = null;
      this.recordEvent("authenticated", "Sessao autenticada com sucesso.");
    });

    client.on("ready", async () => {
      this.status = "conectado";
      this.qrString = null;
      this.startedAt = null;
      this.initialized = true;
      this.lastError = null;
      this.recordEvent("ready", "Cliente WhatsApp conectado.");

      try {
        const info = client.info;
        this.connectedPhone = info?.wid?.user || null;
        this.connectedName = info?.pushname || info?.wid?.user || null;
      } catch {
        this.connectedPhone = null;
        this.connectedName = null;
      }
    });

    client.on("auth_failure", (message) => {
      this.status = "erro";
      this.qrString = null;
      this.startedAt = null;
      this.initialized = false;
      this.recordEvent(
        "auth_failure",
        message || "Falha na autenticacao da sessao. Use Resetar para gerar um QR novo.",
      );
    });

    client.on("disconnected", (reason) => {
      this.status = "desconectado";
      this.client = null;
      this.connectedPhone = null;
      this.connectedName = null;
      this.qrString = null;
      this.startedAt = null;
      this.initialized = false;
      this.initPromise = null;
      this.recordEvent("disconnected", String(reason || "Cliente desconectado."));
    });

    client.on("message", (message) => {
      this.recordEvent("message", `Mensagem recebida de ${message.from || "contato"}.`);
      for (const listener of this.inboundListeners) {
        this.runInboundListener(listener, message);
      }
    });

    client.on("message_ack", (message, ack) => {
      this.recordEvent("message_ack", `Atualizacao de entrega ${ack} para ${message.id.id}.`);
      for (const listener of this.ackListeners) {
        this.runAckListener(listener, message, ack);
      }
    });

    client.on("loading_screen", (percent, message) => {
      this.recordEvent(
        "loading_screen",
        `Carregando WhatsApp ${String(percent)}%${message ? `: ${String(message)}` : "."}`,
      );
    });

    client.on("change_state", (state) => {
      this.recordEvent("change_state", `Estado interno do cliente: ${String(state)}.`);
    });

    this.client = client;
    return client;
  }

  start() {
    void this.ensureStarted().catch((error) => {
      console.error("[whatsapp:start]", error);
    });
  }

  async ensureStarted() {
    if (this.initialized && this.client) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.status = "inicializando";
    this.startedAt = new Date().toISOString();
    this.lastError = null;
    this.recordEvent("init", "Inicializando cliente WhatsApp.");

    const runId = ++this.initRunId;

    this.initPromise = (async () => {
      await mkdir(sessionDir(), { recursive: true });
      const client = this.ensureClient();
      await client.initialize();
      if (runId === this.initRunId) {
        this.initialized = true;
      }
    })()
      .catch((error) => {
        if (runId === this.initRunId) {
          this.status = "erro";
          this.startedAt = null;
          this.initialized = false;
          this.recordEvent(
            "error",
            error instanceof Error
              ? error.message
              : "Erro ao inicializar o cliente WhatsApp.",
          );
        }
        throw error;
      })
      .finally(() => {
        if (runId === this.initRunId) {
          this.initPromise = null;
        }
      });

    return this.initPromise;
  }

  async disconnect() {
    this.initRunId++;

    if (!this.client) {
      this.status = "desconectado";
      this.startedAt = null;
      this.initialized = false;
      this.initPromise = null;
      this.qrString = null;
      this.connectedPhone = null;
      this.connectedName = null;
      this.lastError = null;
      return;
    }

    try {
      await this.client.destroy();
    } finally {
      this.client = null;
      this.initialized = false;
      this.initPromise = null;
      this.status = "desconectado";
      this.startedAt = null;
      this.connectedPhone = null;
      this.connectedName = null;
      this.qrString = null;
      this.lastError = null;
      this.recordEvent("disconnected", "Cliente encerrado manualmente.");
    }
  }

  async resetSession() {
    await this.disconnect();
    const authDir = resolve(sessionDir(), `session-${config.whatsappClientName}`);
    await rm(authDir, { recursive: true, force: true });
    this.recordEvent("init", "Sessao local removida. Novo QR sera gerado ao reconectar.");
  }

  async sendTextMessage(phone: string, body: string) {
    await this.ensureStarted();

    if (!this.client || this.status !== "conectado") {
      throw new Error(
        "WhatsApp desconectado. Escaneie o QR no dashboard antes de enviar mensagens.",
      );
    }

    const variants = buildPhoneVariants(phone);
    let lastError: unknown = null;

    for (const variant of variants) {
      try {
        const isRegistered = await this.client.isRegisteredUser(`${variant}@c.us`);

        if (!isRegistered) {
          throw new Error(
            "Esse numero nao foi encontrado no WhatsApp. Confira o DDD e os digitos do celular.",
          );
        }

        const numberId = await this.client.getNumberId(variant);
        const chatId = numberId?._serialized || `${variant}@c.us`;
        const sent = await this.client.sendMessage(chatId, body);
        const detail =
          variant === phone
            ? `Mensagem enviada para ${phone}.`
            : `Mensagem enviada para ${phone} usando fallback ${variant}.`;

        this.recordEvent("send", detail);

        return {
          externalMessageId: sent.id.id,
        };
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

  onInboundMessage(listener: InboundListener) {
    this.inboundListeners.add(listener);
    return () => this.inboundListeners.delete(listener);
  }

  onMessageAck(listener: AckListener) {
    this.ackListeners.add(listener);
    return () => this.ackListeners.delete(listener);
  }
}

export function getWhatsAppClientManager() {
  if (!globalForWhatsApp.whatsappClientManager) {
    globalForWhatsApp.whatsappClientManager = new WhatsAppClientManager();
  }

  return globalForWhatsApp.whatsappClientManager;
}
