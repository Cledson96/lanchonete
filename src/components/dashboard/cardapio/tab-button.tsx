import type { ReactNode } from "react";

export function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`relative flex items-center px-4 py-2.5 text-sm font-semibold transition ${
        active ? "text-[var(--brand-orange-dark)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
      {active ? (
        <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[var(--brand-orange)]" />
      ) : null}
    </button>
  );
}
