"use client";

export default function Error({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="panel max-w-xl rounded-[2rem] px-8 py-10 text-center">
        <p className="eyebrow mb-3">Ops</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Algo travou nesta etapa.
        </h1>
        <p className="mt-4 text-muted">{error.message || "Erro inesperado."}</p>
        <button
          className="mt-8 rounded-full bg-accent px-6 py-3 font-medium text-white transition hover:bg-accent-strong"
          onClick={reset}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
