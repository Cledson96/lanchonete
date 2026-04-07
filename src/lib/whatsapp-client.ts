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
  lastEventAt: string | null;
  lastError: string | null;
  events: WhatsAppRuntimeEvent[];
};

const globalForWhatsApp = globalThis as typeof globalThis & {
  whatsappClientManager?: WhatsAppClientManager;
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

class WhatsAppClientManager {
  private client: Client | null = null;
  private status: WhatsAppClientStatus = "desconectado";
  private qrString: string | null = null;
  private connectedPhone: string | null = null;
  private connectedName: string | null = null;
  private lastEventAt: string | null = null;
  private lastError: string | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
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

  private ensureClient() {
    if (this.client) {
      return this.client;
    }

    const client = new Client(buildClientOptions());

    client.on("qr", (qr) => {
      this.status = "aguardando_qr";
      this.qrString = qr;
      this.recordEvent("qr", "QR atualizado para pareamento.");
    });

    client.on("authenticated", () => {
      this.recordEvent("authenticated", "Sessao autenticada com sucesso.");
    });

    client.on("ready", async () => {
      this.status = "conectado";
      this.qrString = null;
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
      this.recordEvent("auth_failure", message || "Falha na autenticacao da sessao.");
    });

    client.on("disconnected", (reason) => {
      this.status = "desconectado";
      this.connectedPhone = null;
      this.connectedName = null;
      this.qrString = null;
      this.initialized = false;
      this.initPromise = null;
      this.recordEvent("disconnected", String(reason || "Cliente desconectado."));
    });

    client.on("message", (message) => {
      this.recordEvent("message", `Mensagem recebida de ${message.from || "contato"}.`);
      for (const listener of this.inboundListeners) {
        void listener(message);
      }
    });

    client.on("message_ack", (message, ack) => {
      this.recordEvent("message_ack", `Atualizacao de entrega ${ack} para ${message.id.id}.`);
      for (const listener of this.ackListeners) {
        void listener(message, ack);
      }
    });

    client.on("change_state", (state) => {
      this.recordEvent("init", `Estado interno do cliente: ${String(state)}.`);
    });

    this.client = client;
    return client;
  }

  async ensureStarted() {
    if (this.initialized && this.client) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.status = "inicializando";
    this.recordEvent("init", "Inicializando cliente WhatsApp.");

    this.initPromise = (async () => {
      await mkdir(sessionDir(), { recursive: true });
      const client = this.ensureClient();
      await client.initialize();
      this.initialized = true;
    })()
      .catch((error) => {
        this.status = "erro";
        this.initialized = false;
        this.recordEvent(
          "error",
          error instanceof Error ? error.message : "Erro ao inicializar o cliente WhatsApp.",
        );
        throw error;
      })
      .finally(() => {
        this.initPromise = null;
      });

    return this.initPromise;
  }

  async disconnect() {
    if (!this.client) {
      this.status = "desconectado";
      return;
    }

    try {
      await this.client.destroy();
    } finally {
      this.client = null;
      this.initialized = false;
      this.initPromise = null;
      this.status = "desconectado";
      this.connectedPhone = null;
      this.connectedName = null;
      this.qrString = null;
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

    const chatId = `${phone}@c.us`;
    const sent = await this.client.sendMessage(chatId, body);
    this.recordEvent("send", `Mensagem enviada para ${phone}.`);

    return {
      externalMessageId: sent.id.id,
    };
  }

  async getSessionInfo(): Promise<WhatsAppSessionInfo> {
    return {
      status: this.status,
      connectedPhone: this.connectedPhone,
      connectedName: this.connectedName,
      qrAvailable: Boolean(this.qrString),
      qrDataUrl: this.qrString ? await QRCode.toDataURL(this.qrString) : null,
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
