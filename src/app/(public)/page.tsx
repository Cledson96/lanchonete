import { BrandLogo } from "@/components/brand-logo";
import { CartDrawer } from "@/components/cart-drawer";
import { MenuBrowser } from "@/components/menu-browser";
import { brandContent } from "@/lib/brand-content";
import { getPublicMenu } from "@/lib/services/menu-service";

export const revalidate = 60;

export default async function HomePage() {
  const categories = await getPublicMenu();

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
        <section className="relative overflow-hidden border-b border-[#d88336] bg-[linear-gradient(135deg,#d77721_0%,#e48429_58%,#cc6c1e_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_22%,rgba(99,145,56,0.34),transparent_18%),radial-gradient(circle_at_95%_80%,rgba(243,229,189,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_38%)]" />
          <div className="shell relative py-7 lg:py-9">
            <div className="max-w-[35rem]">
              <BrandLogo className="hero-reveal" theme="orange" />
              <p className="hero-reveal mt-6 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#fdf0d7] [animation-delay:90ms]">
                {brandContent.eyebrow}
              </p>
              <h1 className="hero-reveal mt-3 max-w-3xl text-[2.15rem] font-black leading-[0.94] tracking-tight text-[#fff9ef] sm:text-[2.7rem] [animation-delay:130ms]">
                {brandContent.headline}
              </h1>
              <p className="hero-reveal mt-4 max-w-xl text-[0.98rem] leading-7 text-[#fff0df] [animation-delay:170ms]">
                {brandContent.subheadline}
              </p>

              <div className="hero-reveal mt-6 [animation-delay:210ms]">
                <a
                  className="inline-flex rounded-full bg-[#f7efdf] px-7 py-3.5 text-sm font-bold text-[#4a6f2e] transition hover:bg-white"
                  href="#cardapio"
                >
                  Ver cardapio
                </a>
              </div>
            </div>
          </div>
        </section>

        <MenuBrowser categories={browserCategories} />
      </main>

      <CartDrawer />
    </>
  );
}
