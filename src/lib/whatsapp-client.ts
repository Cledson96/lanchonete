import { config } from "@/lib/config";
import type { WhatsAppSendTextResult, WhatsAppSessionInfo } from "@/lib/whatsapp-contract";

type WorkerSessionResponse = {
  session: WhatsAppSessionInfo;
};

type WorkerSendResponse = {
  result: WhatsAppSendTextResult;
};

const globalForWhatsApp = globalThis as typeof globalThis & {
  whatsappClientManager?: WhatsAppWorkerClient;
};

function buildUnavailableSession(error: unknown): WhatsAppSessionInfo {
  const message = error instanceof Error ? error.message : "Worker do WhatsApp indisponivel.";

  return {
    status: "erro",
    connectedPhone: null,
    connectedName: null,
    qrAvailable: false,
    qrDataUrl: null,
    isStarting: false,
    startedAt: null,
    lastEventAt: null,
    lastError: message,
    events: [],
  };
}

async function parseWorkerJson<T>(response: Response): Promise<T> {
  let payload: (T & { error?: { message?: string } }) | null = null;

  try {
    payload = (await response.json()) as T & { error?: { message?: string } };
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Falha ao comunicar com o worker do WhatsApp.");
  }

  if (!payload) {
    throw new Error("Resposta invalida do worker do WhatsApp.");
  }

  return payload;
}

class WhatsAppWorkerClient {
  private async request<T>(
    path: string,
    init?: RequestInit,
    timeoutMs = 15_000,
  ): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set("authorization", `Bearer ${config.whatsappWorkerToken}`);

    let response: Response;

    try {
      response = await fetch(new URL(path, config.whatsappWorkerUrl), {
        ...init,
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new Error(
          `Worker do WhatsApp nao respondeu em ${timeoutMs / 1000}s (${config.whatsappWorkerUrl}).`,
        );
      }

      throw new Error(
        `Worker do WhatsApp indisponivel em ${config.whatsappWorkerUrl}. Verifique se o container whatsapp-worker esta rodando no Docker Compose.`,
      );
    }

    return parseWorkerJson<T>(response);
  }

  start() {
    void this.ensureStarted().catch((error) => {
      console.error("[whatsapp:worker:start]", error);
    });
  }

  async ensureStarted() {
    await this.request<WorkerSessionResponse>("/connect", { method: "POST" }, 20_000);
  }

  async disconnect() {
    const payload = await this.request<WorkerSessionResponse>("/disconnect", { method: "POST" });
    return payload.session;
  }

  async resetSession() {
    const payload = await this.request<WorkerSessionResponse>("/reset", { method: "POST" });
    return payload.session;
  }

  async sendTextMessage(phone: string, body: string) {
    const payload = await this.request<WorkerSendResponse>(
      "/send",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ to: phone, body }),
      },
      30_000,
    );

    return payload.result;
  }

  async getSessionInfo(): Promise<WhatsAppSessionInfo> {
    try {
      const payload = await this.request<WorkerSessionResponse>("/session");
      return payload.session;
    } catch (error) {
      return buildUnavailableSession(error);
    }
  }
}

export type { WhatsAppSessionInfo } from "@/lib/whatsapp-contract";

export function getWhatsAppClientManager() {
  if (!globalForWhatsApp.whatsappClientManager) {
    globalForWhatsApp.whatsappClientManager = new WhatsAppWorkerClient();
  }

  return globalForWhatsApp.whatsappClientManager;
}
