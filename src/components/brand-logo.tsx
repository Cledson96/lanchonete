type BrandLogoProps = {
  theme?: "light" | "dark";
  compact?: boolean;
  className?: string;
};

const themeMap = {
  light: {
    markBg: "#163224",
    markFg: "#f7f0e7",
    word: "#163224",
    accent: "#d5672e",
    whisper: "rgba(22, 50, 36, 0.72)",
  },
  dark: {
    markBg: "#f7f0e7",
    markFg: "#163224",
    word: "#f7f0e7",
    accent: "#ff9955",
    whisper: "rgba(247, 240, 231, 0.7)",
  },
} as const;

export function BrandLogo({
  theme = "light",
  compact = false,
  className = "",
}: BrandLogoProps) {
  const palette = themeMap[theme];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <svg
        aria-hidden="true"
        className={compact ? "h-11 w-11" : "h-14 w-14"}
        viewBox="0 0 72 72"
      >
        <circle cx="36" cy="36" r="34" fill={palette.markBg} />
        <circle cx="36" cy="36" r="25.5" fill="none" opacity="0.22" stroke={palette.accent} strokeWidth="2" />
        <path
          d="M18 34.5C20.8 26.4 27 22 36 22C45 22 51.2 26.4 54 34.5"
          fill="none"
          stroke={palette.markFg}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4.2"
        />
        <path
          d="M22.5 37.5H49.5"
          fill="none"
          stroke={palette.accent}
          strokeLinecap="round"
          strokeWidth="3.8"
        />
        <path
          d="M23.5 41.5C26 48 30.5 51.5 36 51.5C41.5 51.5 46 48 48.5 41.5"
          fill="none"
          stroke={palette.markFg}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4.2"
        />
        <path
          d="M26.5 28.3L36 19.8L45.5 28.3"
          fill="none"
          stroke={palette.accent}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.8"
        />
        <circle cx="36" cy="19.6" r="2.2" fill={palette.accent} />
      </svg>
      <div className="leading-none">
        <p
          className={`font-display text-[0.7rem] uppercase tracking-[0.26em] ${
            compact ? "mb-1" : "mb-1.5"
          }`}
          style={{ color: palette.whisper }}
        >
          Lanchonete
        </p>
        <p
          className={`font-display text-balance ${compact ? "text-2xl" : "text-[2rem] sm:text-[2.35rem]"}`}
          style={{ color: palette.word }}
        >
          Familia
        </p>
      </div>
    </div>
  );
}
