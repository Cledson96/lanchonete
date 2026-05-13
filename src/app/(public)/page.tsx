import { CartDrawer } from "@/components/cart/drawer";
import { HomeFooter } from "@/components/home/footer";
import { HomeHero } from "@/components/home/hero";
import { HomeInfoBar } from "@/components/home/info-bar";
import { MenuBrowser } from "@/components/menu/browser";
import { getPublicMenu } from "@/lib/services/menu-service";
import { getPublicStoreStatus } from "@/lib/services/store-settings-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, storeStatus] = await Promise.all([
    getPublicMenu(),
    getPublicStoreStatus(),
  ]);

  return (
    <>
      <main className="min-h-screen">
        <HomeHero storeStatus={storeStatus} />
        <HomeInfoBar storeStatus={storeStatus} />
        <MenuBrowser categories={categories} />
        <HomeFooter storeStatus={storeStatus} />
      </main>

      <CartDrawer />
    </>
  );
}
