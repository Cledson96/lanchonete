const steps = [
  "Validar telefone pelo WhatsApp",
  "Selecionar itens e adicionais",
  "Calcular frete por bairro ou CEP",
  "Concluir com forma de pagamento",
];

export default function PedidoPage() {
  return (
    <main className="shell py-12">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="panel rounded-[2rem] p-6">
          <p className="eyebrow mb-3">Fluxo web</p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Pedido com validacao por telefone.
          </h1>
          <p className="mt-4 leading-7 text-muted">
            Esta pagina vai abrigar o fluxo completo do checkout no App Router,
            com reset controlado pelo template quando o cliente entrar em um novo
            pedido.
          </p>
          <ul className="mt-8 space-y-3">
            {steps.map((step) => (
              <li key={step} className="rounded-2xl border border-line px-4 py-4">
                {step}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel rounded-[2rem] p-6">
          <p className="eyebrow mb-3">Resumo do carrinho</p>
          <div className="space-y-5">
            <div className="rounded-2xl border border-line px-4 py-4">
              <p className="font-medium">Burger da casa</p>
              <p className="mt-1 text-sm text-muted">
                Pao brioche, cheddar, bacon e maionese
              </p>
            </div>
            <div className="rounded-2xl border border-line px-4 py-4">
              <p className="font-medium">Suco de laranja</p>
              <p className="mt-1 text-sm text-muted">500ml gelado</p>
            </div>
            <div className="rounded-2xl bg-background-strong px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-muted">Subtotal</span>
                <strong>R$ 44,00</strong>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted">Frete</span>
                <strong>R$ 8,00</strong>
              </div>
              <div className="mt-4 flex items-center justify-between text-lg">
                <span>Total</span>
                <strong>R$ 52,00</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
