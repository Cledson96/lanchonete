import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { CartDrawer } from "@/components/cart-drawer";
import { MenuBrowser } from "@/components/menu-browser";
import { brandContent } from "@/lib/brand-content";
import { getPublicMenu } from "@/lib/services/menu-service";

export const revalidate = 60;

export default async function HomePage() {
  const categories = await getPublicMenu();
  const categoryCount = categories.length;
  const totalItems = categories.reduce((sum, category) => sum + category.menuItems.length, 0);
  const previewItems = categories
    .flatMap((category) =>
      category.menuItems.slice(0, 1).map((item) => ({
        ...item,
        categoryName: category.name,
      })),
    )
    .slice(0, 3);

  const browserCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    menuItems: category.menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      price: Number(item.price),
      compareAtPrice: item.compareAtPrice ? Number(item.compareAtPrice) : null,
    })),
  }));

  return (
    <>
      <main className="min-h-screen">
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#f0671f_0%,#ff8b3d_38%,#f26b21_62%,#d85310_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(255,234,204,0.16),transparent_18%)]" />
          <div className="shell relative grid min-h-[calc(88svh-76px)] gap-10 py-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.88fr)] lg:items-center lg:py-16">
            <div className="hero-reveal max-w-2xl">
              <BrandLogo theme="orange" />
              <p className="mt-7 text-[0.75rem] font-semibold uppercase tracking-[0.32em] text-white/74">
                {brandContent.eyebrow}
              </p>
              <h1 className="mt-4 max-w-3xl font-display text-[3rem] font-bold leading-[0.94] tracking-tight text-white sm:text-[4.2rem]">
                Escolha a categoria, veja a foto e monte o pedido sem enrolacao.
              </h1>
              <p className="mt-5 max-w-xl text-[1.05rem] leading-8 text-white/82 sm:text-[1.15rem]">
                {brandContent.subheadline}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {brandContent.serviceLine.map((service) => (
                  <span
                    key={service}
                    className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {service}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#e85e18] transition hover:bg-[#fff2e8]"
                  href="#cardapio"
                >
                  Abrir cardapio
                </a>
                <Link
                  className="rounded-full border border-white/22 bg-white/10 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/16"
                  href={brandContent.whatsappUrl}
                  target="_blank"
                >
                  Pedir no WhatsApp
                </Link>
              </div>

              <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-white/16 bg-white/10 px-4 py-4 text-white backdrop-blur-sm">
                  <p className="text-[0.65rem] uppercase tracking-[0.16em] text-white/64">
                    Categorias
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold">{categoryCount}</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/16 bg-white/10 px-4 py-4 text-white backdrop-blur-sm">
                  <p className="text-[0.65rem] uppercase tracking-[0.16em] text-white/64">
                    Itens
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold">{totalItems}+</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/16 bg-white/10 px-4 py-4 text-white backdrop-blur-sm">
                  <p className="text-[0.65rem] uppercase tracking-[0.16em] text-white/64">
                    Pedido
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold">Online</p>
                </div>
              </div>
            </div>

            <div className="hero-reveal relative [animation-delay:140ms]">
              <div className="overflow-hidden rounded-[2.2rem] border border-white/18 bg-[#fff7ef] p-5 shadow-[0_30px_90px_rgba(85,34,6,0.22)]">
                <div className="grid gap-4 sm:grid-cols-3">
                  {previewItems.map((item, index) => (
                    <article
                      key={item.id}
                      className={`overflow-hidden rounded-[1.5rem] border ${
                        index === 0 ? "border-[#ffd8c1] bg-[#fff3ea]" : "border-[#f0ddca] bg-white"
                      }`}
                    >
                      <div className="relative h-40 bg-[#fff0df]">
                        <Image
                          alt={item.name}
                          className="object-cover"
                          fill
                          sizes="(max-width: 1024px) 100vw, 240px"
                          src={item.imageUrl || "/landing/menu-item-placeholder.svg"}
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#9d7453]">
                          {item.categoryName}
                        </p>
                        <h2 className="mt-2 text-xl font-bold leading-tight text-[#29170d]">
                          {item.name}
                        </h2>
                        <p className="mt-3 text-[1.6rem] font-display font-bold text-[#ef6216]">
                          R$ {Number(item.price).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-[#f0ddca] bg-[#fffaf4] px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#a3734d]">
                        Navegacao do menu
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[#2b160d]">
                        Clique nas categorias para trocar os itens e pagine quando precisar.
                      </p>
                    </div>
                    <a
                      className="inline-flex rounded-full bg-[#f26b21] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#cf500d]"
                      href="#cardapio"
                    >
                      Ver categorias
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#f0ddca] bg-[#fffaf4]">
          <div className="shell grid gap-0 py-0 sm:grid-cols-3">
            {[
              { label: "Cardapio do banco", value: "Categorias reais", icon: "🗂️" },
              { label: "Navegacao", value: "Clique e troque os itens", icon: "👆" },
              { label: "Carrinho", value: "Monte e finalize rapido", icon: "🛒" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 border-b border-[#f0ddca] px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
              >
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[#9d7453]">
                    {item.label}
                  </p>
                  <p className="mt-1 font-semibold text-[#2b160d]">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <MenuBrowser categories={browserCategories} />

        <section className="pb-16 pt-6">
          <div className="shell">
            <div className="rounded-[2.2rem] bg-[linear-gradient(135deg,#2b160d_0%,#45271a_100%)] px-6 py-8 text-white shadow-[0_28px_70px_rgba(55,26,11,0.24)] md:px-10 md:py-10">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
                <div>
                  <BrandLogo theme="dark" />
                  <h2 className="mt-6 max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
                    {brandContent.finalTitle}
                  </h2>
                  <p className="mt-4 max-w-2xl text-[1rem] leading-8 text-white/72">
                    {brandContent.finalBody}
                  </p>
                </div>

                <div className="rounded-[1.8rem] border border-white/10 bg-white/7 p-5">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/52">
                    Atendimento
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {brandContent.location}
                  </p>
                  <p className="mt-2 text-white/64">{brandContent.hours}</p>

                  <div className="mt-5 flex flex-col gap-3">
                    <Link
                      className="rounded-full bg-[#f26b21] px-5 py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#cf500d]"
                      href="/pedido"
                    >
                      Abrir pedido online
                    </Link>
                    <Link
                      className="rounded-full border border-white/12 bg-white/6 px-5 py-3.5 text-center text-sm font-bold text-white transition hover:bg-white/10"
                      href={brandContent.whatsappUrl}
                      target="_blank"
                    >
                      Falar no WhatsApp
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <CartDrawer />
    </>
  );
}
