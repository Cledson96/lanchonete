import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";

type ModalSize = "sm" | "md" | "lg";
type ModalPlacement = "center" | "bottom";

const sizeClassName: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export function Modal({
  bodyClassName,
  children,
  closeDisabled,
  closeIcon,
  contentClassName,
  eyebrow,
  footer,
  footerClassName,
  headerActions,
  headerClassName,
  onClose,
  placement = "center",
  size = "md",
  title,
}: {
  bodyClassName?: string;
  children: ReactNode;
  closeDisabled?: boolean;
  closeIcon?: ReactNode;
  contentClassName?: string;
  eyebrow?: string;
  footer?: ReactNode;
  footerClassName?: string;
  headerActions?: ReactNode;
  headerClassName?: string;
  onClose: () => void;
  placement?: ModalPlacement;
  size?: ModalSize;
  title: ReactNode;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] flex bg-[rgba(45,24,11,0.4)] backdrop-blur-[3px]",
        placement === "bottom" ? "items-end justify-center sm:items-center sm:p-4" : "items-center justify-center p-4",
      )}
    >
      <button
        aria-label="Fechar"
        className="absolute inset-0"
        disabled={closeDisabled}
        onClick={onClose}
        type="button"
      />
      <div
        className={cn(
          "relative z-10 w-full overflow-hidden border border-[var(--line)] bg-white shadow-2xl",
          placement === "bottom" ? "max-h-[92dvh] rounded-t-3xl sm:rounded-2xl" : "rounded-2xl",
          sizeClassName[size],
          contentClassName,
        )}
      >
        <div className={cn("flex shrink-0 items-start justify-between gap-3 px-5 pt-5", headerClassName)}>
          <div>
            {eyebrow ? (
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                {eyebrow}
              </p>
            ) : null}
            <h3 className="mt-0.5 text-lg font-bold leading-tight">{title}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {headerActions}
            <IconButton disabled={closeDisabled} label="Fechar" onClick={onClose}>
              {closeIcon ?? "x"}
            </IconButton>
          </div>
        </div>
        <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
        {footer ? <div className={cn("px-5 pb-5", footerClassName)}>{footer}</div> : null}
      </div>
    </div>
  );
}
