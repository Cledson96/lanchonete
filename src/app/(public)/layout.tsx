import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";
import { CartButton } from "@/components/cart/button";
import { CartProvider } from "@/lib/cart-store";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-[var(--background)]">
        <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--background)]/92 backdrop-blur-2xl">
          <div className="shell flex items-center justify-between gap-4 py-2">
            <Link aria-label="Lanchonete Familia" href="/">
              <BrandLogo compact />
            </Link>

            <CartButton />
          </div>
        </header>
        {children}
      </div>
    </CartProvider>
  );
}
