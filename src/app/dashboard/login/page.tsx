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
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="panel w-full max-w-md rounded-[2rem] p-8">
        <p className="eyebrow mb-3">Operacao</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Entrar no dashboard
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          O login do admin e criado pelo seed do Prisma usando `ADMIN_EMAIL` e
          `ADMIN_PASSWORD`.
        </p>
        {error ? (
          <p className="mt-4 rounded-2xl border border-[#d9734c]/30 bg-[#d9734c]/12 px-4 py-3 text-sm text-[#9c2f0b]">
            {error}
          </p>
        ) : null}
        <form action="/api/auth/admin/login" className="mt-8 space-y-4" method="post">
          <input
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            name="email"
            type="email"
            placeholder="admin@lanchonete.com"
          />
          <input
            className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3"
            name="password"
            type="password"
            placeholder="Senha"
          />
          <button
            className="w-full rounded-full bg-accent px-6 py-3 font-medium text-white transition hover:bg-accent-strong"
            type="submit"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
