import type { ReactNode } from "react";

export function Field({
  children,
  hint,
  label,
  required,
}: {
  children: ReactNode;
  hint?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
        {required ? <span className="text-[var(--brand-orange)]">*</span> : null}
        {hint ? (
          <span className="ml-1 text-[0.6rem] normal-case tracking-normal text-[var(--muted)]/70">· {hint}</span>
        ) : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function Toggle({
  checked,
  hint,
  label,
  onChange,
}: {
  checked: boolean;
  hint?: string;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-xs transition ${
        checked
          ? "border-[var(--brand-green)] bg-[var(--brand-green)]/5"
          : "border-[var(--line)] bg-white hover:border-[var(--brand-green)]/40"
      }`}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <div>
        <span className="block font-semibold text-[var(--foreground)]">{label}</span>
        {hint ? <span className="block text-[0.6rem] text-[var(--muted)]">{hint}</span> : null}
      </div>
      <span
        className={`flex h-5 w-9 shrink-0 items-center rounded-full border transition ${
          checked ? "border-[var(--brand-green)] bg-[var(--brand-green)]" : "border-[var(--line)] bg-white"
        }`}
      >
        <span
          className={`h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
