import Link from "next/link";
import { getCustomerSession } from "@/lib/auth/session";
import { getOrderByCode } from "@/lib/services/order-service";
import { formatMoney } from "@/lib/utils";

type PedidoStatusPageProps = {
  params: Promise<{ code: string }>;
};

const statusLabels: Record<string, string> = {
  novo: "Pedido recebido",
  em_preparo: "Em preparo",
  pronto: "Pronto",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  fechado: "Fechado",
  cancelado: "Cancelado",
};

export default async function PedidoStatusPage({ params }: PedidoStatusPageProps) {
  const { code } = await params;
  const order = await getOrderByCode(code);
  const customerSession = await getCustomerSession();

  if (!order) {
    return (
      <main className="shell py-10 md:py-14">
        <div className="mx-auto max-w-2xl">
          <section className="panel rounded-[2rem] px-6 py-8 text-center md:px-10">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Pedido nao encontrado
            </h1>
            <p className="mt-4 text-base leading-7 text-muted">
              Nao localizamos um pedido com esse codigo.
            </p>
            <Link
              className="mt-6 inline-flex rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-strong"
              href="/#cardapio"
            >
              Voltar ao cardapio
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (
    !customerSession ||
    (customerSession.customerProfileId !== order.customerProfileId &&
      customerSession.phone !== order.customerPhone)
  ) {
    return (
      <main className="shell py-10 md:py-14">
        <div className="mx-auto max-w-2xl">
          <section className="panel rounded-[2rem] px-6 py-8 text-center md:px-10">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Sessao expirada ou pedido indisponivel
            </h1>
            <p className="mt-4 text-base leading-7 text-muted">
              Para consultar este pedido, valide novamente o telefone usado na compra.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                className="inline-flex justify-center rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-strong"
                href="/pedido"
              >
                Ir para o pedido
              </Link>
              <Link
                className="inline-flex justify-center rounded-full border border-line bg-white px-6 py-3.5 text-sm font-semibold text-foreground transition hover:border-[#d7b386] hover:bg-[#fff0dd]"
                href="/#cardapio"
              >
                Voltar ao cardapio
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="shell py-10 md:py-14">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="panel rounded-[2.2rem] px-6 py-8 md:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow mb-3">Acompanhamento</p>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Pedido {order.code}
              </h1>
              <p className="mt-3 text-base leading-7 text-muted">
                Status atual:{" "}
                <span className="font-semibold text-foreground">
                  {statusLabels[order.status] || order.status}
                </span>
              </p>
            </div>
            <span className="rounded-full bg-[#eef5e8] px-4 py-2 text-sm font-semibold text-[#567b35]">
              {order.type === "delivery" ? "Entrega" : "Retirada"}
            </span>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="panel rounded-[2rem] px-6 py-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Itens do pedido
            </h2>
            <div className="mt-5 space-y-4">
              {order.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.4rem] border border-line bg-white/88 px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {item.menuItem.name}
                      </p>
                      <p className="mt-1 text-sm text-muted">Qtd. {item.quantity}</p>
                    </div>
                    <p className="menu-price text-xl font-bold text-accent">
                      {formatMoney(item.subtotalAmount)}
                    </p>
                  </div>
                  <div className="mt-3 rounded-[1rem] bg-[#fff6ea] px-4 py-3 text-sm leading-6 text-[#6f5d4a]">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#a06f42]">
                      Observacao
                    </p>
                    <p className="mt-2">{item.notes || "Sem observacao para este item."}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="panel rounded-[2rem] px-6 py-6">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Resumo
              </h2>
              <div className="mt-5 space-y-3 rounded-[1.5rem] bg-white/88 px-5 py-5">
                <div className="flex items-center justify-between gap-3 text-sm text-muted">
                  <span>Cliente</span>
                  <span className="font-semibold text-foreground">
                    {order.customerName || "Cliente"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-muted">
                  <span>Pagamento</span>
                  <span className="font-semibold text-foreground">
                    {order.paymentMethod}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-muted">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(order.subtotalAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-muted">
                  <span>Frete</span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(order.deliveryFeeAmount)}
                  </span>
                </div>
                <div className="soft-divider pt-3" />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="menu-price text-[2rem] font-bold text-accent">
                    {formatMoney(order.totalAmount)}
                  </span>
                </div>
              </div>
            </section>

            <Link
              className="inline-flex w-full justify-center rounded-full border border-line bg-white px-6 py-3.5 text-sm font-semibold text-foreground transition hover:border-[#d7b386] hover:bg-[#fff0dd]"
              href="/#cardapio"
            >
              Pedir novamente
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
