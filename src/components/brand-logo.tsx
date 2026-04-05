type BrandLogoProps = {
  theme?: "light" | "dark" | "orange";
  compact?: boolean;
  className?: string;
};

const themeStyles = {
  light: {
    ring: "bg-white border-[#f2d7bf]",
    bun: "#ea6f2d",
    lettuce: "#3d8b4f",
    textPrimary: "#e96824",
    textSecondary: "#8a5a34",
  },
  dark: {
    ring: "bg-white/12 border-white/16",
    bun: "#ff9f5d",
    lettuce: "#6ccb79",
    textPrimary: "#fff2e6",
    textSecondary: "rgba(255,242,230,0.7)",
  },
  orange: {
    ring: "bg-white/18 border-white/25",
    bun: "#fff4eb",
    lettuce: "#4cb95d",
    textPrimary: "#fff4eb",
    textSecondary: "rgba(255,244,235,0.74)",
  },
};

function BurgerSeal({ theme }: { theme: BrandLogoProps["theme"] }) {
  const colors = themeStyles[theme || "light"];

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-full border ${colors.ring}`}
      style={{
        width: 48,
        height: 48,
      }}
    >
      <span
        className="absolute rounded-full"
        style={{
          width: 24,
          height: 10,
          top: 13,
          background: colors.bun,
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          width: 28,
          height: 4,
          top: 23,
          background: colors.lettuce,
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          width: 28,
          height: 4,
          top: 28,
          background: "#6f3415",
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          width: 24,
          height: 8,
          top: 34,
          background: colors.bun,
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          width: 3,
          height: 3,
          top: 16,
          left: 18,
          background: "#f7c283",
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          width: 3,
          height: 3,
          top: 15,
          left: 27,
          background: "#f7c283",
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          width: 3,
          height: 3,
          top: 17,
          left: 32,
          background: "#f7c283",
        }}
      />
    </span>
  );
}

export function BrandLogo({
  theme = "light",
  compact = false,
  className = "",
}: BrandLogoProps) {
  const colors = themeStyles[theme];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <BurgerSeal theme={theme} />
      <div className={compact ? "leading-none" : "leading-none"}>
        <p
          className="text-[0.62rem] font-semibold uppercase tracking-[0.34em]"
          style={{ color: colors.textSecondary }}
        >
          Lanchonete
        </p>
        <p
          className={`${compact ? "text-[1.65rem]" : "text-[2.1rem]"} font-display font-bold tracking-tight`}
          style={{ color: colors.textPrimary }}
        >
          Familia
        </p>
      </div>
    </div>
  );
}
