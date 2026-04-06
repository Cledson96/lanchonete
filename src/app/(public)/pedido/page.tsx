import Image from "next/image";
import Link from "next/link";
import { PedidoCartSummary } from "@/components/pedido-cart-summary";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";
import { getPublicMenu } from "@/lib/services/menu-service";
import { formatMoney } from "@/lib/utils";

const steps = [
  "Validar telefone pelo WhatsApp",
  "Selecionar itens e adicionais",
  "Calcular frete por bairro ou CEP",
  "Concluir com forma de pagamento",
];

export default async function PedidoPage() {
  const categories = await getPublicMenu();
  const heroItems = categories
    .flatMap((category) =>
      category.menuItems.slice(0, 1).map((item) => ({
        ...item,
        categoryName: category.name,
      })),
    )
    .slice(0, 3);

  return (
    <main className="shell py-12">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="panel rounded-[2rem] p-6">
          <p className="eyebrow mb-3">Fluxo web</p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Monte o pedido olhando foto, preco e categoria.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted">
            Esta tela ja conversa com o cardapio real. O proximo passo do
            checkout vai ser transformar essa vitrine em carrinho funcional,
            mantendo as imagens e os adicionais de cada item.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {heroItems.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-[1.6rem] border border-line/80 bg-white/65"
              >
                <div className="relative h-44">
                  <Image
                    alt={item.name}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 280px"
                    src={resolveMenuItemImage(item.imageUrl)}
                  />
                </div>
                <div className="p-4">
                  <p className="text-[0.68rem] uppercase tracking-[0.16em] text-muted">
                    {item.categoryName}
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-tight">
                    {item.name}
                  </p>
                  <p className="mt-2 menu-price text-2xl text-accent">
                    {formatMoney(Number(item.price))}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <ul className="mt-8 space-y-3">
            {steps.map((step) => (
              <li key={step} className="rounded-2xl border border-line px-4 py-4">
                {step}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel rounded-[2rem] p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">Resumo do cardapio</p>
              <h2 className="text-3xl font-semibold tracking-tight">
                Escolha visual por categoria
              </h2>
            </div>
            <Link
              className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-accent-strong"
              href="/#cardapio"
            >
              Voltar para a home
            </Link>
          </div>

          <div className="mt-6 space-y-5">
            {categories.slice(0, 4).map((category) => (
              <div key={category.id} className="rounded-2xl border border-line px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{category.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      {category.menuItems.length} itens cadastrados
                    </p>
                  </div>
                  <span className="rounded-full bg-background-strong px-3 py-2 text-xs uppercase tracking-[0.16em] text-muted">
                    {category.menuItems[0]?.name || "Sem item"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-8">
        <PedidoCartSummary />
      </div>
    </main>
  );
}
