import Image from "next/image";
import { BrandLogo } from "@/components/brand-logo";
import { CartDrawer } from "@/components/cart-drawer";
import { MenuBrowser } from "@/components/menu-browser";
import { brandContent } from "@/lib/brand-content";
import { getPublicMenu } from "@/lib/services/menu-service";

export const revalidate = 60;

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

  const browserCategories = (categories as unknown as Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    availableFrom: string | null;
    availableUntil: string | null;
    menuItems: Array<{ id: string; name: string; description: string | null; imageUrl: string | null; price: unknown; compareAtPrice: unknown; availableWeekdays: string[]; optionGroups: Array<{ id: string; name: string; description: string | null; minSelections: number; maxSelections: number | null; isRequired: boolean; options: Array<{ id: string; name: string; description: string | null; priceDelta: unknown }> }>; ingredients: Array<{ id: string; name: string; quantity: number; price: unknown }> }>;
  }>).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    availableFrom: category.availableFrom,
    availableUntil: category.availableUntil,
    menuItems: category.menuItems.map((item) => ({
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
          <div className="shell relative z-[1] grid items-center gap-6 py-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10 lg:py-8 xl:py-12 2xl:py-16">
            {/* Coluna de texto */}
            <div className="relative">
              <div className="hero-reveal mb-3 flex items-center gap-3">
                <span className="hero-status">
                  <span className="hero-status__dot" />
                  Aberto agora
                </span>
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Curitiba · CIC
                </span>
              </div>

              <h1 className="hero-reveal text-[1.6rem] font-black leading-[1.05] tracking-tight text-white sm:text-[2rem] lg:text-[2.5rem] xl:text-[3rem] 2xl:text-[3.5rem]">
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

              <p className="hero-reveal mt-2 max-w-md text-[0.88rem] leading-snug text-white/80 xl:text-[1rem] xl:mt-3">
                Pão selado na manteiga, maionese caseira e entrega quentinha até você.
              </p>

              <div className="hero-reveal mt-4">
                <a className="cta-btn cta-btn--primary" href="#cardapio">
                  Ver cardápio
                  <ChevronDownIcon />
                </a>
              </div>
            </div>

            {/* Coluna da imagem — só aparece em desktop */}
            <div className="hero-reveal relative hidden items-center justify-center lg:flex">
              <div className="hero-plate" style={{ width: "clamp(150px, 26vh, 280px)" }}>
                <Image
                  alt="Lanches artesanais da casa"
                  className="object-cover"
                  fill
                  priority
                  quality={92}
                  sizes="280px"
                  src="/landing/hero-burger.jpg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Info Bar ─── */}
        <div className="border-b border-[var(--line)] bg-white">
          <div className="shell">
            <div className="flex flex-col divide-y divide-[var(--line)] sm:flex-row sm:divide-x sm:divide-y-0">

              <div className="flex items-center gap-3 py-3 sm:flex-1 sm:px-5 sm:py-3.5 first:sm:pl-0 last:sm:pr-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--brand-orange-dark)]">
                  <MapPinIcon />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--green-deep)]">Localização</p>
                  <p className="truncate text-[0.82rem] font-medium text-[var(--foreground)]">{brandContent.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-3 sm:flex-1 sm:px-5 sm:py-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--brand-orange-dark)]">
                  <ClockIcon />
                </span>
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--green-deep)]">Horário</p>
                  <p className="text-[0.82rem] font-medium text-[var(--foreground)]">{brandContent.hours}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-3 sm:flex-1 sm:px-5 sm:py-3.5 last:sm:pr-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--brand-orange-dark)]">
                  <PhoneIcon />
                </span>
                <div>
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
        <footer className="footer-site mt-6 py-10">
          <div className="shell">
            <div className="flex flex-col items-center gap-10 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
              <div className="max-w-sm">
                <BrandLogo compact theme="dark" />
                <p className="mt-4 text-sm leading-6 text-[#b39a7c]">
                  {brandContent.subheadline}
                </p>
                <span className="footer-chip mt-4">● Lanchonete de bairro</span>
              </div>

              <div className="flex flex-col items-center gap-2.5 text-sm text-[#b39a7c] sm:items-end">
                <p className="max-w-xs">{brandContent.location}</p>
                <p>{brandContent.hours}</p>
                <a
                  className="mt-2 inline-flex items-center gap-1.5 text-[var(--brand-orange-soft)] hover:text-white transition-colors"
                  href={brandContent.whatsappUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Fale no WhatsApp
                  <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="mt-10 border-t border-[#3a281a] pt-6 text-center text-xs tracking-wide text-[#6e5b46]">
              © {new Date().getFullYear()} {brandContent.name}. Feito com carinho em Curitiba.
            </div>
          </div>
        </footer>
      </main>

      <CartDrawer />
    </>
  );
}
