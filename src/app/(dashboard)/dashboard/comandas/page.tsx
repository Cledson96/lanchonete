import { listCommandas } from "@/lib/services/comanda-service";
import { formatMoney } from "@/lib/utils";

export default async function DashboardComandasPage() {
  const commandas = await listCommandas();

  return (
    <main className="panel shadow-sm transition hover:shadow-md hover:border-[var(--brand-orange)]/30 rounded-[2rem] border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--foreground)]">
      <p className="eyebrow mb-3 text-[var(--muted)]">Salao</p>
      <h1 className="text-3xl font-semibold tracking-tight">Comandas</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {commandas.length ? (
          commandas.map((comanda) => (
            <article
              key={comanda.id}
              className="rounded-[1.5rem] border border-[var(--line)] px-4 py-4"
            >
              <p className="text-sm text-[var(--muted)]">Comanda {comanda.code}</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatMoney(comanda.totalAmount)}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {comanda.name || comanda.customerProfile?.fullName || "Mesa sem identificacao"}
              </p>
            </article>
          ))
        ) : (
          <article className="rounded-[1.5rem] border border-[var(--line)] px-4 py-4 text-sm text-[var(--muted)]">
            Nenhuma comanda aberta ainda.
          </article>
        )}
      </div>
    </main>
  );
}
