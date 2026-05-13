import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export type EmptyStateProps = ComponentPropsWithoutRef<"div">;

export function EmptyState({ className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]",
        className,
      )}
      {...props}
    />
  );
}
