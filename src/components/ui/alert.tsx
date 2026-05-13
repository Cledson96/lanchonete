import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type AlertTone = "success" | "error" | "warning" | "info";

const toneClassName: Record<AlertTone, string> = {
  success: "border-[var(--brand-green)]/30 bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)]",
  error: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

export type AlertProps = ComponentPropsWithoutRef<"div"> & {
  tone?: AlertTone;
};

export function Alert({ className, role, tone = "info", ...props }: AlertProps) {
  return (
    <div
      className={cn("rounded-lg border px-3 py-2 text-xs font-medium", toneClassName[tone], className)}
      role={role ?? (tone === "error" ? "alert" : undefined)}
      {...props}
    />
  );
}
