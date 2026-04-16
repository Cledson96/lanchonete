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
    menuItems: Array<{ id: string; name: string; description: string | null; imageUrl: string | null; price: unknown; compareAtPrice: unknown; optionGroups: Array<{ id: string; name: string; description: string | null; minSelections: number; maxSelections: number | null; isRequired: boolean; options: Array<{ id: string; name: string; description: string | null; priceDelta: unknown }> }>; ingredients: Array<{ id: string; name: string; quantity: number; price: unknown }> }>;
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
<section className="relative overflow-hidden bg-[var(--brand-orange)] flex flex-col lg:flex-row min-h-[340px] lg:min-h-[420px]">
          {/* Text Content Block */}
          <div className="relative z-10 flex-1 flex items-center justify-center lg:justify-end px-6 pb-10 pt-10 lg:px-12 lg:py-14">
            <div className="w-full max-w-xl xl:mr-10">
              <div className="hero-reveal inline-block mb-5">
                <BrandLogo theme="menu-style" />
              </div>

              <h1 className="hero-reveal text-[2rem] font-black leading-[1.05] tracking-tight text-white sm:text-[2.8rem] lg:text-[3.5rem] drop-shadow-md">
                <span 
                  className="block text-[var(--brand-green)]" 
                  style={{ WebkitTextStroke: '1.5px white', textShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                >
                  LANCHES
                </span>
                ARTESANAIS
              </h1>

              <p className="hero-reveal mt-4 max-w-md text-[0.95rem] font-medium leading-relaxed text-white/95">
                Pão selado na manteiga, maionese caseira e o verdadeiro hambúrguer artesanal. {brandContent.subheadline}
              </p>

              <div className="hero-reveal mt-6">
                <a className="cta-btn shadow-[0_8px_24px_rgba(108,158,49,0.3)] hover:scale-[1.02] active:scale-[0.98] !bg-white !text-[var(--brand-orange-dark)] hover:!bg-[var(--brand-green-glow)] transition-all duration-300" href="#cardapio">
                  Ver cardápio
                  <ChevronDownIcon />
                </a>
              </div>
            </div>
            
            {/* Playful background shape */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none"></div>
          </div>

          {/* Image Block */}
          <div className="relative h-[240px] w-full lg:h-auto lg:flex-1 lg:max-w-[50%]">
             <Image
               alt="Lanches artesanais"
               className="object-cover object-center lg:object-[left_center]"
               fill
               priority
               quality={90}
               sizes="(max-width: 1024px) 100vw, 50vw"
               src="/landing/hero-burger.jpg"
             />
            {/* Gradient to blend with orange on mobile */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-orange)] to-transparent opacity-95 lg:hidden pointer-events-none"></div>
            {/* Subtle shadow on desktop between blocks */}
            <div className="hidden lg:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--brand-orange)] to-transparent pointer-events-none z-10"></div>
          </div>
        </section>

        {/* ─── Info Strip ─── */}
        <section className="info-strip">
          <div className="shell">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="info-card stagger-in">
                <div className="info-card__icon">
                  <MapPinIcon />
                </div>
                <p className="eyebrow">Localização</p>
                <p className="mt-1.5 text-[0.92rem] font-semibold leading-snug text-[var(--foreground)]">
                  {brandContent.location}
                </p>
              </div>

              <div className="info-card stagger-in">
                <div className="info-card__icon">
                  <ClockIcon />
                </div>
                <p className="eyebrow">Horário</p>
                <p className="mt-1.5 text-[0.92rem] font-semibold leading-snug text-[var(--foreground)]">
                  {brandContent.hours}
                </p>
              </div>

              <div className="info-card stagger-in">
                <div className="info-card__icon">
                  <PhoneIcon />
                </div>
                <p className="eyebrow">Atendimento</p>
                <a
                  className="mt-1.5 inline-flex items-center gap-1.5 text-[0.92rem] font-semibold text-[var(--green-rich)] transition-colors hover:text-[var(--green-deep)]"
                  href={brandContent.whatsappUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Fazer pedido
                  <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Cardápio ─── */}
        <MenuBrowser categories={browserCategories} />

        {/* ─── Footer ─── */}
        <footer className="footer-site mt-6 py-8">
          <div className="shell">
            <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
              <div className="max-w-xs">
                <BrandLogo compact theme="dark" />
                <p className="mt-3 text-sm leading-6 text-[#9a846e]">
                  {brandContent.subheadline}
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 sm:items-end">
                <p className="text-sm text-[#7a6b5a]">{brandContent.location}</p>
                <p className="text-sm text-[#7a6b5a]">{brandContent.hours}</p>
              </div>
            </div>

            <div className="mt-8 border-t border-[#2e2116] pt-6 text-center text-xs text-[#5c4d3e]">
              © {new Date().getFullYear()} {brandContent.name}. Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </main>

      <CartDrawer />
    </>
  );
}
