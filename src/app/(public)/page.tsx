import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { brandContent } from "@/lib/brand-content";
import { getPublicMenu } from "@/lib/services/menu-service";
import { formatMoney } from "@/lib/utils";

export const revalidate = 60;

export default async function HomePage() {
  const categories = await getPublicMenu();

  return (
    <main className="pb-20">
      <section className="grain relative isolate overflow-hidden bg-[#112118] text-white">
        <div className="absolute inset-0">
          <Image
            alt="Burger artesanal com fritas servidos sobre mesa escura."
            className="object-cover object-[42%_56%]"
            fill
            priority
            sizes="100vw"
            src="/landing/hero-burger.jpg"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,23,16,0.88)_0%,rgba(14,31,22,0.72)_42%,rgba(14,31,22,0.28)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_14%,rgba(242,174,97,0.4),transparent_18%),radial-gradient(circle_at_22%_78%,rgba(34,94,61,0.32),transparent_22%)]" />
        </div>

        <div className="relative shell grid min-h-[calc(100svh-81px)] items-end gap-10 py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.65fr)] lg:py-20">
          <div className="hero-reveal max-w-3xl">
            <BrandLogo theme="dark" />
            <p className="mt-8 max-w-md text-sm uppercase tracking-[0.24em] text-white/62">
              {brandContent.eyebrow}
            </p>
            <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.96] tracking-tight text-balance sm:text-6xl lg:text-8xl">
              {brandContent.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/78 sm:text-xl">
              {brandContent.subheadline}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-base font-medium text-white transition hover:bg-accent-strong"
                href="/pedido"
              >
                Peca agora
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-7 py-3.5 text-base font-medium text-white transition hover:bg-white/12"
                href={brandContent.whatsappUrl}
                target="_blank"
              >
                Pedir no WhatsApp
              </Link>
            </div>
          </div>

          <div className="hero-reveal hero-shadow relative self-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm [animation-delay:140ms]">
            <div className="rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(248,240,229,0.12),rgba(255,255,255,0.03))] p-5 text-white">
              <p className="eyebrow mb-6 text-white/58">Assinatura da casa</p>
              <div className="rounded-[1.4rem] bg-[#f7efe2] p-5 text-[#163224]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-3xl leading-none">
                      Smash da Familia
                    </p>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-[#526256]">
                      Burger alto com cheddar, bacon crocante, maionese da casa
                      e frita que chega no ponto.
                    </p>
                  </div>
                  <p className="menu-price text-3xl text-[#d5672e]">
                    {formatMoney(24.9)}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-[#6f7b73]">
                  <span className="rounded-full bg-[#e2ecdf] px-3 py-2">
                    Burger 160g
                  </span>
                  <span className="rounded-full bg-[#f7dcc7] px-3 py-2">
                    Cheddar
                  </span>
                  <span className="rounded-full bg-[#e2ecdf] px-3 py-2">
                    Bacon
                  </span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {brandContent.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-4"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-white/46">
                      {stat.label}
                    </p>
                    <p className="mt-3 font-display text-2xl">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="soft-divider bg-[linear-gradient(180deg,#f4edde_0%,#fbf6ef_100%)]">
        <div className="shell grid gap-5 py-8 md:grid-cols-3">
          {brandContent.supportPoints.map((point) => (
            <article
              key={point}
              className="rounded-[1.6rem] border border-line/70 bg-white/55 px-5 py-5 backdrop-blur-sm transition hover:-translate-y-0.5"
            >
              <p className="eyebrow mb-3">Promessa da casa</p>
              <p className="max-w-sm text-lg leading-7 text-foreground">{point}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="section-anchor bg-[linear-gradient(180deg,#fbf5ec_0%,#f4ecdf_100%)] py-14"
        id="cardapio"
      >
        <div className="shell">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow mb-3">Cardapio completo</p>
              <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
                Da chapa ao suco, tudo na mesma mesa.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-muted">
              Navegue pelas categorias, descubra os favoritos da casa e monte o
              pedido no seu tempo. O mesmo cardapio abastece o site, o WhatsApp
              e a operacao interna.
            </p>
          </div>

          <div className="sticky top-[80px] z-20 mb-10 overflow-x-auto sticky-tabs rounded-full border border-line/70 bg-white/78 p-2 shadow-[0_14px_32px_rgba(16,34,24,0.08)] backdrop-blur-xl">
            <div className="flex min-w-max gap-2">
              {categories.map((category) => (
                <a
                  key={category.id}
                  className="rounded-full px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-[#163224] hover:text-white"
                  href={`#categoria-${category.slug}`}
                >
                  {category.name}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-16">
            {categories.map((category, index) => {
              const [featuredItem, ...restItems] = category.menuItems;
              const accentBg =
                index % 2 === 0
                  ? "bg-[linear-gradient(140deg,#163224_0%,#1f3d2f_100%)] text-white"
                  : "bg-[linear-gradient(140deg,#f0dfc6_0%,#f7efe4_100%)] text-[#163224]";
              const accentBorder =
                index % 2 === 0 ? "border-white/10" : "border-[#d7c7b0]";

              return (
                <section
                  key={category.id}
                  className="section-anchor"
                  id={`categoria-${category.slug}`}
                >
                  <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="eyebrow mb-3">Categoria</p>
                      <h3 className="font-display text-3xl tracking-tight sm:text-4xl">
                        {category.name}
                      </h3>
                      {category.description ? (
                        <p className="mt-3 max-w-2xl text-muted">
                          {category.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="hidden text-sm text-muted md:block">
                      {category.menuItems.length} itens
                    </p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
                    {featuredItem ? (
                      <article
                        className={`rounded-[2rem] border p-6 ${accentBg} ${accentBorder}`}
                      >
                        <p className="eyebrow mb-4 text-current/58">
                          Destaque da casa
                        </p>
                        <div className="flex items-start justify-between gap-6">
                          <div>
                            <h4 className="font-display text-3xl tracking-tight">
                              {featuredItem.name}
                            </h4>
                            {featuredItem.description ? (
                              <p className="mt-4 max-w-xl leading-7 text-current/78">
                                {featuredItem.description}
                              </p>
                            ) : null}
                          </div>
                          <p className="menu-price text-3xl">
                            {formatMoney(Number(featuredItem.price))}
                          </p>
                        </div>

                        {featuredItem.optionGroups.length ? (
                          <div className="mt-6 flex flex-wrap gap-2">
                            {featuredItem.optionGroups.map((group) => (
                              <span
                                key={group.id}
                                className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.14em] ${
                                  index % 2 === 0
                                    ? "border-white/12 bg-white/8 text-white/82"
                                    : "border-[#d7c7b0] bg-white/55 text-[#526256]"
                                }`}
                              >
                                {group.name}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </article>
                    ) : null}

                    <div className="rounded-[2rem] border border-line/80 bg-white/55 px-5 py-3 backdrop-blur-sm">
                      {restItems.length ? (
                        restItems.map((item) => (
                          <article
                            key={item.id}
                            className="soft-divider grid gap-4 px-1 py-5 first:border-t-0"
                          >
                            <div className="flex items-start justify-between gap-6">
                              <div>
                                <h4 className="text-xl font-semibold tracking-tight">
                                  {item.name}
                                </h4>
                                {item.description ? (
                                  <p className="mt-2 max-w-2xl leading-7 text-muted">
                                    {item.description}
                                  </p>
                                ) : null}
                                {item.optionGroups.length ? (
                                  <p className="mt-3 text-sm text-[#42604e]">
                                    Adicionais:{" "}
                                    {item.optionGroups
                                      .map((group) => group.name)
                                      .join(", ")}
                                  </p>
                                ) : null}
                              </div>
                              <p className="menu-price whitespace-nowrap text-2xl text-accent">
                                {formatMoney(Number(item.price))}
                              </p>
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="px-1 py-8">
                          <p className="text-lg font-medium text-foreground">
                            Selecao enxuta, feita para acertar em cheio.
                          </p>
                          <p className="mt-2 max-w-xl leading-7 text-muted">
                            Abra o pedido para ver adicionais, combinacoes e
                            montar a categoria do seu jeito sem perder o ritmo
                            da casa.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,#eff3ea_0%,#f7f0e7_100%)] py-16">
        <div className="shell grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div className="rounded-[2rem] border border-[#d9cfbd] bg-[#163224] p-8 text-white">
            <p className="eyebrow mb-4 text-white/56">Mais que delivery</p>
            <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
              {brandContent.storyTitle}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/76">
              {brandContent.storyBody}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {brandContent.storyList.map((item) => (
              <article
                key={item}
                className="rounded-[1.7rem] border border-line/70 bg-white/75 px-5 py-6 backdrop-blur-sm"
              >
                <p className="eyebrow mb-3">Familia</p>
                <p className="leading-7 text-foreground">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-10 pt-6">
        <div className="shell">
          <div className="hero-shadow overflow-hidden rounded-[2.4rem] border border-[#183425] bg-[linear-gradient(120deg,#13241b_0%,#1a3427_58%,#d5672e_130%)] p-8 text-white md:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <BrandLogo theme="dark" />
                <h2 className="mt-6 max-w-2xl font-display text-4xl tracking-tight sm:text-5xl">
                  {brandContent.finalTitle}
                </h2>
                <p className="mt-4 max-w-xl text-lg leading-8 text-white/74">
                  {brandContent.finalBody}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
                <div className="rounded-[1.6rem] border border-white/12 bg-white/7 px-5 py-5">
                  <p className="eyebrow mb-3 text-white/56">Onde estamos</p>
                  <p className="font-medium">{brandContent.location}</p>
                  <p className="mt-3 text-white/68">{brandContent.hours}</p>
                </div>
                <div className="rounded-[1.6rem] border border-white/12 bg-white/7 px-5 py-5">
                  <p className="eyebrow mb-3 text-white/56">Seu proximo passo</p>
                  <div className="flex flex-col gap-3">
                    <Link
                      className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 font-medium text-[#163224] transition hover:bg-[#f7e9d9]"
                      href="/pedido"
                    >
                      Abrir pedido online
                    </Link>
                    <Link
                      className="inline-flex items-center justify-center rounded-full border border-white/12 px-5 py-3 font-medium text-white transition hover:bg-white/10"
                      href={brandContent.whatsappUrl}
                      target="_blank"
                    >
                      Chamar no WhatsApp
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
