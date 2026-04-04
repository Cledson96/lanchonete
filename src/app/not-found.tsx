import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="panel max-w-xl rounded-[2rem] px-8 py-10 text-center">
        <p className="eyebrow mb-3">Nao encontrado</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Esta rota nao existe na lanchonete.
        </h1>
        <p className="mt-4 text-muted">
          Pode ser uma comanda invalida, um link antigo ou uma rota ainda nao
          publicada.
        </p>
        <Link
          className="mt-8 inline-flex rounded-full bg-accent px-6 py-3 font-medium text-white transition hover:bg-accent-strong"
          href="/"
        >
          Voltar para a pagina inicial
        </Link>
      </div>
    </div>
  );
}
