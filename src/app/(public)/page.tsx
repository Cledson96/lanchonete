import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { brandContent } from "@/lib/brand-content";
import { getPublicMenu } from "@/lib/services/menu-service";
import { formatMoney } from "@/lib/utils";

export const revalidate = 60;

export default async function HomePage() {
  const categories = await getPublicMenu();
  const featuredItems = categories
    .flatMap((category) => {
      const [firstItem] = category.menuItems;

      return firstItem
        ? [
            {
              ...firstItem,
              categoryName: category.name,
            },
          ]
        : [];
    })
    .slice(0, 4);
  const heroItem = featuredItems[0] ?? null;

  return (
    <main className="pb-20">
      <section className="grain relative isolate overflow-hidden bg-[#0f1e16] text-white">
        <div className="absolute inset-0">
          <Image
            alt="Burger artesanal com fritas servidos sobre mesa escura."
            className="object-cover object-[46%_58%]"
            fill
            priority
            sizes="100vw"
            src="/landing/hero-burger.jpg"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,18,13,0.92)_0%,rgba(8,22,16,0.82)_38%,rgba(8,22,16,0.42)_70%,rgba(8,22,16,0.55)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_73%_16%,rgba(242,174,97,0.38),transparent_16%),radial-gradient(circle_at_22%_70%,rgba(34,94,61,0.28),transparent_22%)]" />
        </div>

        <div className="relative shell grid min-h-[calc(100svh-81px)] items-end gap-10 py-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(380px,0.92fr)] lg:py-16">
          <div className="hero-reveal max-w-2xl lg:pb-8">
            <BrandLogo theme="dark" />
            <p className="mt-6 max-w-md text-sm uppercase tracking-[0.24em] text-white/62">
              {brandContent.eyebrow}
            </p>
            <h1 className="mt-4 max-w-4xl font-display text-[3.25rem] leading-[0.92] tracking-tight text-balance sm:text-6xl lg:mt-5 lg:text-7xl">
              {brandContent.headline}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/78 sm:text-xl sm:leading-8">
              {brandContent.subheadline}
            </p>

            {heroItem ? (
              <div className="mt-6 max-w-xl rounded-[1.8rem] border border-white/10 bg-white/7 p-4 backdrop-blur-sm sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/54">
                      Pedido da casa
                    </p>
                    <h2 className="mt-3 font-display text-3xl leading-none text-white sm:text-[2.15rem]">
                      {heroItem.name}
                    </h2>
                  </div>
                  <p className="menu-price text-3xl text-[#ffb16e]">
                    {formatMoney(Number(heroItem.price))}
                  </p>
                </div>

                {heroItem.description ? (
                  <p className="mt-4 leading-7 text-white/74">
                    {heroItem.description}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white/82">
                    {heroItem.categoryName}
                  </span>
                  {heroItem.optionGroups.slice(0, 2).map((group) => (
                    <span
                      key={group.id}
                      className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white/62"
                    >
                      {group.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-base font-medium text-white transition hover:bg-accent-strong"
                href="#cardapio"
              >
                Ver cardapio
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-7 py-3.5 text-base font-medium text-white transition hover:bg-white/12"
                href={brandContent.whatsappUrl}
                target="_blank"
              >
                Pedir no WhatsApp
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/74 sm:mt-7">
              {brandContent.serviceLine.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/6 px-4 py-2"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-reveal relative self-center [animation-delay:140ms]">
            <div className="hero-shadow overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-4 backdrop-blur-sm sm:p-5">
              <div className="rounded-[1.8rem] bg-[#f6efe4] p-5 text-[#163224] sm:p-6">
                <div className="flex flex-col gap-6 border-b border-[#d9cfbd] pb-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="eyebrow mb-3 text-[#6d7b72]">
                      {brandContent.menuTitle}
                    </p>
                    <h2 className="max-w-xl font-display text-3xl leading-[1.02] tracking-tight sm:text-4xl">
                      Escolha por categoria, compare sabores e parta para o
                      pedido sem sair da home.
                    </h2>
                  </div>
                  <p className="max-w-sm text-sm leading-6 text-[#5f6d65]">
                    {brandContent.menuBody}
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {featuredItems.map((item, index) => (
                    <article
                      key={item.id}
                      className={`group rounded-[1.5rem] border px-4 py-4 transition hover:-translate-y-0.5 ${
                        index === 0
                          ? "border-[#d9cfbd] bg-[linear-gradient(145deg,#163224_0%,#1d3b2d_100%)] text-white"
                          : "border-[#dccfbc] bg-white/65"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p
                            className={`text-[0.65rem] uppercase tracking-[0.18em] ${
                              index === 0 ? "text-white/54" : "text-[#738077]"
                            }`}
                          >
                            {item.categoryName}
                          </p>
                          <h3 className="mt-3 font-display text-2xl leading-none">
                            {item.name}
                          </h3>
                        </div>
                        <p
                          className={`menu-price text-2xl ${
                            index === 0 ? "text-[#ffb16e]" : "text-accent"
                          }`}
                        >
                          {formatMoney(Number(item.price))}
                        </p>
                      </div>

                      {item.description ? (
                        <p
                          className={`mt-4 max-w-md text-sm leading-6 ${
                            index === 0 ? "text-white/78" : "text-[#58665f]"
                          }`}
                        >
                          {item.description}
                        </p>
                      ) : null}

                      {item.optionGroups.length ? (
                        <p
                          className={`mt-4 text-xs uppercase tracking-[0.16em] ${
                            index === 0 ? "text-white/56" : "text-[#7a867f]"
                          }`}
                        >
                          {item.optionGroups.map((group) => group.name).join(" • ")}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <a
                      key={category.id}
                      className="rounded-full border border-[#d9cfbd] bg-white/65 px-4 py-2.5 text-sm font-medium text-[#264334] transition hover:border-[#163224] hover:bg-[#163224] hover:text-white"
                      href={`#categoria-${category.slug}`}
                    >
                      {category.name}
                    </a>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 border-t border-[#d9cfbd] pt-5 sm:grid-cols-3">
                  {brandContent.stats.map((stat) => (
                    <div key={stat.label} className="rounded-[1.2rem] bg-white/62 px-4 py-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#728077]">
                        {stat.label}
                      </p>
                      <p className="mt-3 font-display text-2xl text-[#163224]">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="section-anchor bg-[linear-gradient(180deg,#fbf5ec_0%,#f4ecdf_100%)] py-14"
        id="cardapio"
      >
        <div className="shell">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow mb-3">Cardapio completo</p>
              <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
                Escolha por categoria, nao por paciencia.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-muted">
              O cardapio foi desenhado para leitura rapida: categoria, destaque,
              descricao curta, adicionais disponiveis e preco sem ruido.
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
              const accentBg = "bg-[linear-gradient(140deg,#163224_0%,#1d3b2d_100%)] text-white";
              const accentBorder = "border-white/10";

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
                                className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/82"
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

      <section className="soft-divider bg-[linear-gradient(180deg,#f7f0e6_0%,#fbf6ef_100%)]">
        <div className="shell grid gap-4 py-7 md:grid-cols-3">
          {brandContent.supportPoints.map((point) => (
            <div
              key={point}
              className="flex items-center gap-4 border-l border-[#d7cbb8] pl-4 first:border-l-0 first:pl-0"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              <p className="max-w-sm text-base leading-7 text-foreground">{point}</p>
            </div>
          ))}
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
