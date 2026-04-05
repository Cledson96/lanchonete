import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { CartButton } from "@/components/cart-button";
import { brandContent } from "@/lib/brand-content";
import { CartProvider } from "@/lib/cart-store";

const links = [
  { href: "/#cardapio", label: "Cardápio" },
  { href: brandContent.whatsappUrl, label: "WhatsApp" },
];

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartProvider>
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-[#f0ddca] bg-[#fffaf4]/92 text-[#2b160d] backdrop-blur-2xl">
          <div className="shell flex items-center justify-between gap-4 py-4">
            <Link aria-label={brandContent.name} href="/">
              <BrandLogo className="origin-left scale-[0.94]" compact />
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-[#7b5a42] md:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  className="transition hover:text-[#ef6216]"
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                >
                  {link.label}
                </Link>
              ))}
              <Link className="transition hover:text-[#ef6216]" href="/dashboard/login">
                Admin
              </Link>
            </nav>
            <div className="flex items-center gap-2">
              <CartButton />
            </div>
          </div>
        </header>
        {children}
      </div>
    </CartProvider>
  );
}
