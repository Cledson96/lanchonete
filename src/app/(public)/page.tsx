import Link from "next/link";

const highlights = [
  "Cardapio e pedido no site",
  "Comanda para consumo no local",
  "Fila operacional no dashboard",
  "WhatsApp integrado com pedidos e status",
];

const sections = [
  {
    title: "Cardapio vivo",
    body: "Categorias, itens e adicionais saem do mesmo backend que abastece site, dashboard e WhatsApp.",
  },
  {
    title: "Pedido com telefone validado",
    body: "O cliente se identifica pelo numero, confirma codigo e segue com historico e recorrencia.",
  },
  {
    title: "Operacao em um painel",
    body: "Atendimento, cozinha, entrega e caixa ficam na mesma espinha dorsal de pedidos e comandas.",
  },
];

export default function HomePage() {
  return (
    <main className="pb-24">
      <section className="shell grid min-h-[calc(100svh-73px)] items-center gap-10 py-14 lg:grid-cols-[1.2fr_0.9fr]">
        <div>
          <p className="eyebrow mb-4">Plataforma da loja</p>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            O balcao, a cozinha e o WhatsApp falando a mesma lingua.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
            Esta base do Next App Router ja nasce preparada para cardapio,
            pedidos, comandas e operacao em tempo real sem espalhar o dominio
            em varios projetos.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 font-medium text-white transition hover:bg-accent-strong"
              href="/pedido"
            >
              Simular pedido
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-line bg-surface px-6 py-3 font-medium"
              href="/dashboard/login"
            >
              Ver operacao
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-line/60 bg-transparent px-6 py-3 font-medium text-muted transition hover:border-line hover:text-foreground"
              href="/api-docs"
            >
              Ver Swagger
            </Link>
          </div>
        </div>
        <div className="panel rounded-[2rem] p-6 lg:p-8">
          <div className="rounded-[1.5rem] bg-[linear-gradient(160deg,#422312_0%,#8b3614_55%,#d56b2b_100%)] p-6 text-white shadow-2xl">
            <p className="eyebrow mb-6 text-white/70">Fluxo principal</p>
            <div className="space-y-4">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/12 bg-white/10 px-4 py-4"
                >
                  <p className="font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="shell grid gap-6 lg:grid-cols-3">
        {sections.map((section) => (
          <article key={section.title} className="panel rounded-[2rem] p-6">
            <p className="eyebrow mb-3">Base v1</p>
            <h2 className="text-2xl font-semibold tracking-tight">
              {section.title}
            </h2>
            <p className="mt-4 leading-7 text-muted">{section.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
