import Link from "next/link";
import { parseCheckoutSuccessParams } from "@/lib/checkout/success-params";
import { brandContent } from "@/lib/brand-content";
import { formatMoney } from "@/lib/utils";

type PedidoSuccessPageProps = {
  searchParams: Promise<{
    code?: string;
    name?: string;
    type?: string;
    payment?: string;
    total?: string;
  }>;
};

const paymentLabels: Record<string, string> = {
  pix: "Pix",
  cartao_credito: "Cartao de credito",
  cartao_debito: "Cartao de debito",
  dinheiro: "Dinheiro",
  outro: "Outro",
};

const fulfillmentLabels: Record<string, string> = {
  delivery: "Entrega",
  retirada: "Retirada",
};

export default async function PedidoSuccessPage({
  searchParams,
}: PedidoSuccessPageProps) {
  const params = await searchParams;
  const { code, name, type, payment, totalAmount } = parseCheckoutSuccessParams(params);

  return (
    <main className="shell py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <section className="panel rounded-[2.4rem] px-6 py-8 md:px-10">
          <div className="inline-flex rounded-full bg-[#eef5e8] px-4 py-2 text-sm font-semibold text-[#567b35]">
            Pedido enviado com sucesso
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Seu pedido ja foi para a fila da lanchonete.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
            Agora a equipe consegue localizar seu telefone, acompanhar o preparo
            e avisar os proximos passos pelo WhatsApp.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.6rem] border border-line bg-white/88 px-5 py-5">
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted">
                Codigo do pedido
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {code || "Pedido criado"}
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-line bg-white/88 px-5 py-5">
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted">
                Total
              </p>
              <p className="menu-price mt-3 text-3xl font-bold text-accent">
                {formatMoney(totalAmount)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.4rem] border border-line bg-white/88 px-4 py-4">
              <p className="text-[0.68rem] uppercase tracking-[0.16em] text-muted">
                Cliente
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {name || "Cliente"}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-line bg-white/88 px-4 py-4">
              <p className="text-[0.68rem] uppercase tracking-[0.16em] text-muted">
                Tipo
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {fulfillmentLabels[type || ""] || "Pedido web"}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-line bg-white/88 px-4 py-4">
              <p className="text-[0.68rem] uppercase tracking-[0.16em] text-muted">
                Pagamento
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {paymentLabels[payment || ""] || "Nao informado"}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-[#e3d2bc] bg-white/88 px-5 py-5 text-sm leading-7 text-muted">
            <p className="font-semibold text-foreground">Proximos passos</p>
            <p className="mt-2">
              Assim que o pedido entrar em preparo, o time da {brandContent.shortName} vai
              atualizar voce pelo WhatsApp. Se precisar acompanhar manualmente,
              use o codigo do pedido.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex justify-center rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-strong"
              href={code ? `/pedido/${code}` : "/pedido"}
            >
              Acompanhar pedido
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
