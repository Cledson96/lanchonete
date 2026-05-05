import Image from "next/image";
import { BrandLogo } from "@/components/brand-logo";
import { CartDrawer } from "@/components/cart-drawer";
import { MenuBrowser } from "@/components/menu-browser";
import { brandContent } from "@/lib/brand-content";
import { getPublicMenu } from "@/lib/services/menu-service";

export const dynamic = "force-dynamic";

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function HomePage() {
  const categories = await getPublicMenu();

  const browserCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    availableFrom: category.availableFrom,
    availableUntil: category.availableUntil,
    menuItems: category.menuItems.map((item: {
      id: string;
      name: string;
      description: string | null;
      imageUrl: string | null;
      price: unknown;
      compareAtPrice?: unknown;
      availableWeekdays: string[] | null;
      optionGroups: Array<{
        id: string;
        name: string;
        description: string | null;
        minSelections: number;
        maxSelections: number | null;
        isRequired: boolean;
        options: Array<{ id: string; name: string; description: string | null; priceDelta: unknown }>;
      }>;
      ingredients: Array<{ id: string; name: string; quantity: number; price: unknown }>;
    }) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      price: Number(item.price),
      compareAtPrice: item.compareAtPrice ? Number(item.compareAtPrice) : null,
      availableWeekdays: item.availableWeekdays || [],
      optionGroups: (item.optionGroups || []).map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        isRequired: group.isRequired,
        options: group.options.map((option) => ({
          id: option.id,
          name: option.name,
          description: option.description,
          priceDelta: Number(option.priceDelta),
        })),
      })),
      ingredients: (item.ingredients || []).map((ing) => ({
        id: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        price: Number(ing.price),
      })),
    })),
  }));

  return (
    <>
      <main className="min-h-screen">
        {/* ─── Hero ─── */}
        <section className="hero-v2">
          <div className="shell relative z-[1] grid items-center gap-5 py-4 sm:py-5 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 lg:py-6 xl:py-7">
            {/* Coluna de texto */}
            <div className="relative">
              <div className="hero-reveal mb-2 flex flex-wrap items-center gap-2">
                <span className="hero-status">
                  <span className="hero-status__dot" />
                  Aberto agora
                </span>
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Curitiba · CIC
                </span>
              </div>

              <h1 className="hero-reveal max-w-[560px] text-[1.75rem] font-black leading-[0.98] tracking-tight text-white sm:text-[2.35rem] lg:text-[2.8rem] xl:text-[3.35rem]">
                <span className="text-[var(--brand-green)]" style={{ WebkitTextStroke: "1.5px #fff" }}>
                  Lanches{" "}
                </span>
                <span className="relative inline-block">
                  artesanais
                  <svg
                    aria-hidden="true"
                    className="hero-underline"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 140 12"
                  >
                    <path
                      d="M2 8 C 30 2, 70 2, 138 8"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth={3}
                    />
                  </svg>
                </span>
              </h1>

              <p className="hero-reveal mt-3 max-w-md text-[0.9rem] leading-snug text-white/86 xl:text-[1rem]">
                Pão selado na manteiga, maionese caseira e entrega quentinha até você.
              </p>

              <div className="hero-reveal mt-4 flex flex-wrap items-center gap-3">
                <a className="cta-btn cta-btn--primary" href="#cardapio">
                  Pedir agora
                  <ChevronDownIcon />
                </a>
                <span className="text-[0.78rem] font-semibold text-white/75">
                  Monte seu lanche em poucos cliques
                </span>
              </div>
            </div>

            {/* Coluna da imagem */}
            <div className="hero-reveal relative">
              <div className="hero-window">
                <Image
                  alt="Lanches artesanais da casa"
                  className="object-cover"
                  fill
                  priority
                  quality={90}
                  sizes="(max-width: 1024px) 100vw, 560px"
                  src="/landing/hero-burger.jpg"
                />
                <div className="hero-window__shade" />
                <div className="hero-window__tag">
                  <span className="hero-window__tag-dot" />
                  Entrega quente no CIC
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Info Bar ─── */}
        <div className="border-b border-[var(--line)] bg-white/92 backdrop-blur-xl">
          <div className="shell">
            <div className="grid gap-0 divide-y divide-[var(--line)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">

              <div className="flex min-w-0 items-center gap-3 py-2.5 sm:px-4 first:sm:pl-0 last:sm:pr-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--brand-orange-dark)]">
                  <MapPinIcon />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--green-deep)]">Localização</p>
                  <p className="truncate text-[0.82rem] font-medium text-[var(--foreground)]">{brandContent.location}</p>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-3 py-2.5 sm:px-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--brand-orange-dark)]">
                  <ClockIcon />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--green-deep)]">Horário</p>
                  <p className="text-[0.82rem] font-medium text-[var(--foreground)]">{brandContent.hours}</p>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-3 py-2.5 sm:px-4 last:sm:pr-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--brand-orange-dark)]">
                  <PhoneIcon />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--green-deep)]">Entrega</p>
                  <p className="text-[0.82rem] font-medium text-[var(--foreground)]">Rápida e quentinha até você</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ─── Cardápio ─── */}
        <MenuBrowser categories={browserCategories} />

        {/* ─── Footer ─── */}
        <footer className="footer-site mt-6">
          <div className="shell py-10 lg:py-12">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">

              {/* Coluna 1 — Marca */}
              <div>
                <BrandLogo compact theme="dark" />
                <p className="mt-4 max-w-xs text-[0.85rem] leading-relaxed text-[#a08060]">
                  {brandContent.subheadline}
                </p>
              </div>

              {/* Coluna 2 — Endereço e Horário */}
              <div className="space-y-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--brand-orange-soft)]">
                  Onde nos encontrar
                </p>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#a08060]">
                    <MapPinIcon />
                  </span>
                  <p className="text-[0.85rem] leading-relaxed text-[#c8aa88]">
                    {brandContent.location}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#a08060]">
                    <ClockIcon />
                  </span>
                  <p className="text-[0.85rem] text-[#c8aa88]">
                    {brandContent.hours}
                  </p>
                </div>
              </div>

              {/* Coluna 3 — Entrega */}
              <div className="space-y-4">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--brand-orange-soft)]">
                  Entrega
                </p>
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#a08060]">
                    <PhoneIcon />
                  </span>
                  <p className="text-[0.85rem] leading-relaxed text-[#c8aa88]">
                    Rápida e quentinha até você
                  </p>
                </div>
              </div>
            </div>

            {/* Rodapé inferior */}
            <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[#2e1c10] pt-6 sm:flex-row">
              <p className="text-[0.72rem] tracking-wide text-[#5a3f28]">
                © {new Date().getFullYear()} {brandContent.name}. Feito com carinho em Curitiba.
              </p>
              <a
                className="text-[0.72rem] tracking-wide text-[#5a3f28] transition-colors hover:text-[#a08060]"
                href="#cardapio"
              >
                ↑ Voltar ao cardápio
              </a>
            </div>
          </div>
        </footer>
      </main>

      <CartDrawer />
    </>
  );
}
