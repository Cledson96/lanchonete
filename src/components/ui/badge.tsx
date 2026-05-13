import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "violet" | "orange";
type BadgeShape = "pill" | "square";

const toneClassName: Record<BadgeTone, string> = {
  neutral: "bg-[var(--background)] text-[var(--muted)]",
  success: "bg-[var(--brand-green)]/12 text-[var(--brand-green-dark)]",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
  orange: "bg-[var(--brand-orange)]/15 text-[var(--brand-orange-dark)]",
};

export type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  shape?: BadgeShape;
  tone?: BadgeTone;
};

export function Badge({ className, shape = "pill", tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold",
        shape === "pill" ? "rounded-full px-2.5 py-1 text-[0.7rem]" : "rounded-md px-1.5 py-0.5 text-[0.6rem]",
        toneClassName[tone],
        className,
      )}
      {...props}
    />
  );
}
