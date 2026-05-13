import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconButtonVariant = "secondary" | "ghost" | "soft";
type IconButtonSize = "sm" | "md";

const variantClassName: Record<IconButtonVariant, string> = {
  secondary:
    "border border-[var(--line)] bg-white text-[var(--muted)] hover:bg-[var(--background)]",
  ghost: "text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]",
  soft: "bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--background-strong)]",
};

const sizeClassName: Record<IconButtonSize, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
};

export type IconButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  children: ReactNode;
  label: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
};

export function IconButton({
  children,
  className,
  label,
  size = "sm",
  type = "button",
  variant = "secondary",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClassName[variant],
        sizeClassName[size],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
