import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost" | "soft" | "unstyled";
type ButtonSize = "xs" | "sm" | "md" | "lg";

const variantClassName: Record<ButtonVariant, string> = {
  primary: "bg-[var(--brand-orange)] text-white hover:bg-[var(--brand-orange-dark)]",
  secondary:
    "border border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-[var(--background)]",
  success: "bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-dark)]",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]",
  soft: "bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--background-strong)]",
  unstyled: "",
};

const sizeClassName: Record<ButtonSize, string> = {
  xs: "px-3 py-1.5 text-xs",
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-4 py-3 text-sm",
};

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function Button({
  className,
  fullWidth,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClassName[variant],
        sizeClassName[size],
        fullWidth && "w-full",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
