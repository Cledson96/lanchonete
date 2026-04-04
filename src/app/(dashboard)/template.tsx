export default function DashboardTemplate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="animate-[fadeIn_.22s_ease-out]">{children}</div>;
}
