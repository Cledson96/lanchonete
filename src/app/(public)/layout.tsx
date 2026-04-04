import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/pedido", label: "Pedido" },
  { href: "/comanda/exemplo", label: "Comanda" },
  { href: "/dashboard", label: "Operacao" },
];

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur-xl">
        <div className="shell flex items-center justify-between py-4">
          <Link className="text-lg font-semibold tracking-tight" href="/">
            Lanchonete
          </Link>
          <nav className="hidden gap-6 text-sm text-muted md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
