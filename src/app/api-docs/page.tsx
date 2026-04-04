import type { Metadata } from "next";
import Link from "next/link";
import { SwaggerClient } from "@/app/api-docs/swagger-client";

export const metadata: Metadata = {
  title: "Swagger",
  description: "Documentacao OpenAPI e Swagger da lanchonete.",
};

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-[#1d130f] text-white">
      <div className="shell py-8">
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/8 px-6 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow mb-3 text-white/55">API Docs</p>
            <h1 className="text-4xl font-semibold tracking-tight">
              Swagger da lanchonete
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
              Aqui ficam as rotas publicas, internas e de integracao em formato
              OpenAPI. O JSON fonte esta em <code>/api/openapi.json</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-[#d56b2b] px-5 py-3 font-medium text-white transition hover:bg-[#b3471f]"
              href="/api/openapi.json"
              target="_blank"
            >
              Abrir JSON
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-white/14 px-5 py-3 font-medium text-white/88 transition hover:bg-white/8"
              href="/"
            >
              Voltar para o site
            </Link>
          </div>
        </div>
      </div>
      <div className="swagger-shell pb-10">
        <SwaggerClient />
      </div>
    </main>
  );
}
