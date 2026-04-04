export default function PedidoTemplate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="animate-[fadeIn_.25s_ease-out]">{children}</div>;
}
