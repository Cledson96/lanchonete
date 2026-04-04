type ComandaPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

export default async function ComandaPage({ params }: ComandaPageProps) {
  const { slug } = await params;

  return (
    <main className="shell py-12">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="panel rounded-[2rem] p-6">
          <p className="eyebrow mb-3">Comanda local</p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Comanda ativa: {slug}
          </h1>
          <p className="mt-4 leading-7 text-muted">
            O slug da rota identifica a comanda do QR code. Aqui o cliente ve
            saldo parcial, adiciona itens e acompanha o que ja foi enviado para
            a cozinha.
          </p>
        </section>

        <section className="panel rounded-[2rem] p-6">
          <p className="eyebrow mb-3">Parcial da mesa</p>
          <div className="space-y-3">
            <div className="rounded-2xl border border-line px-4 py-4">
              <div className="flex items-center justify-between">
                <span>2x Smash cheddar</span>
                <strong>R$ 38,00</strong>
              </div>
            </div>
            <div className="rounded-2xl border border-line px-4 py-4">
              <div className="flex items-center justify-between">
                <span>1x Batata rustica</span>
                <strong>R$ 16,00</strong>
              </div>
            </div>
            <div className="rounded-2xl bg-background-strong px-4 py-4">
              <div className="flex items-center justify-between text-lg">
                <span>Total acumulado</span>
                <strong>R$ 54,00</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
