import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { CartButton } from "@/components/cart-button";
import { brandContent } from "@/lib/brand-content";
import { CartProvider } from "@/lib/cart-store";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-[#fff8f0]">
        <header className="sticky top-0 z-40 border-b border-[#e7d5bc] bg-[#fffaf4]/95 text-[#2f2618] backdrop-blur-2xl">
          <div className="shell flex items-center justify-between gap-4 py-3.5">
            <Link aria-label={brandContent.name} href="/">
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
