import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type TypographyVariant =
  | "eyebrow"
  | "overline"
  | "title-sm"
  | "title-md"
  | "title-lg"
  | "body-sm"
  | "body-md"
  | "caption"
  | "caption-sm"
  | "metric";

type TypographyTone = "default" | "muted" | "orange" | "green" | "violet" | "amber" | "danger";

const variantClassName: Record<TypographyVariant, string> = {
  eyebrow: "text-[0.65rem] font-bold uppercase tracking-[0.14em]",
  overline: "text-[0.6rem] font-bold uppercase tracking-[0.12em]",
  "title-sm": "text-sm font-semibold leading-tight",
  "title-md": "text-base font-semibold",
  "title-lg": "text-xl font-bold tracking-tight",
  "body-sm": "text-sm",
  "body-md": "text-base",
  caption: "text-[0.7rem]",
  "caption-sm": "text-xs",
  metric: "text-lg font-bold",
};

const toneClassName: Record<TypographyTone, string> = {
  default: "text-[var(--foreground)]",
  muted: "text-[var(--muted)]",
  orange: "text-[var(--brand-orange-dark)]",
  green: "text-[var(--brand-green-dark)]",
  violet: "text-violet-950",
  amber: "text-amber-900",
  danger: "text-red-700",
};

const defaultTagByVariant: Record<TypographyVariant, ElementType> = {
  eyebrow: "p",
  overline: "p",
  "title-sm": "p",
  "title-md": "p",
  "title-lg": "h2",
  "body-sm": "p",
  "body-md": "p",
  caption: "p",
  "caption-sm": "p",
  metric: "p",
};

type TypographyProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  tone?: TypographyTone;
  variant?: TypographyVariant;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function Typography<T extends ElementType = "p">({
  as,
  children,
  className,
  tone = "default",
  variant = "body-md",
  ...props
}: TypographyProps<T>) {
  const Component = (as ?? defaultTagByVariant[variant]) as ElementType;

  return (
    <Component className={cn(variantClassName[variant], toneClassName[tone], className)} {...props}>
      {children}
    </Component>
  );
}
