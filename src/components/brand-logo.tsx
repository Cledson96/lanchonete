import Image from "next/image";

type BrandLogoProps = {
  theme?: "light" | "dark" | "orange" | "menu-style";
  compact?: boolean;
  className?: string;
};

export function BrandLogo({
  theme = "light",
  compact = false,
  className = "",
}: BrandLogoProps) {
  const markSize = compact ? 42 : 80;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <span
        className="relative overflow-hidden rounded-full bg-white"
        style={{ width: markSize, height: markSize }}
      >
        <Image
          alt="Logo da Lanchonete Familia"
          className="object-cover"
          fill
          sizes={`${markSize}px`}
          src="/branding/logo-mark-orange.png"
        />
      </span>

      <span
        className="brand-wordmark"
        data-compact={compact ? "true" : "false"}
        data-theme={theme}
      >
        <span>Lanchonete</span>
        <span>Familia</span>
      </span>
    </div>
  );
}
