import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/session";

type DashboardLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function DashboardLoginPage({
  searchParams,
}: DashboardLoginPageProps) {
  const session = await getAdminSession();

  if (session) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-orange)]">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
              <circle cx="12" cy="16" r="1" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Entrar no dashboard
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Acesse a área de operação da lanchonete
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 shadow-sm">
          {error ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form action="/api/auth/admin/login" className="space-y-5" method="post">
            <div>
              <label
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]"
                htmlFor="email"
              >
                E-mail
              </label>
              <input
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--brand-orange)]"
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]"
                htmlFor="password"
              >
                Senha
              </label>
              <input
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--brand-orange)]"
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              className="w-full rounded-full bg-[var(--brand-orange)] px-6 py-3.5 font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
              type="submit"
            >
              Entrar
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          Área restrita para administradores
        </p>
      </div>
    </main>
  );
}