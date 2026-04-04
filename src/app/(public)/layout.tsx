import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { brandContent } from "@/lib/brand-content";

const links = [
  { href: "/#cardapio", label: "Cardapio" },
  { href: "/pedido", label: "Peca agora" },
  { href: brandContent.whatsappUrl, label: "WhatsApp" },
];

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#13241b]/72 text-white backdrop-blur-2xl">
        <div className="shell flex items-center justify-between gap-4 py-4">
          <Link aria-label={brandContent.name} href="/">
            <BrandLogo className="scale-[0.93] origin-left" compact theme="dark" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/74 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                className="transition hover:text-white"
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              className="hidden rounded-full border border-white/14 px-4 py-2 text-sm text-white/80 transition hover:bg-white/8 sm:inline-flex"
              href={brandContent.whatsappUrl}
              target="_blank"
            >
              WhatsApp
            </Link>
            <Link
              className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
              href="/pedido"
            >
              Pedir agora
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
