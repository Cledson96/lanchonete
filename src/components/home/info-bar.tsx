import type { ReactNode } from "react";
import { ClockIcon, MapPinIcon, PhoneIcon } from "@/components/home/icons";
import { brandContent } from "@/lib/brand-content";
import type { StoreStatus } from "@/lib/contracts/store";

type HomeInfoBarProps = {
  storeStatus: StoreStatus;
};

type InfoBarItemProps = {
  icon: ReactNode;
  label: string;
  value: string;
  truncate?: boolean;
};

function InfoBarItem({ icon, label, value, truncate = false }: InfoBarItemProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 py-2.5 sm:px-4 first:sm:pl-0 last:sm:pr-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--brand-orange-dark)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--green-deep)]">
          {label}
        </p>
        <p className={`text-[0.82rem] font-medium text-[var(--foreground)] ${truncate ? "truncate" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function HomeInfoBar({ storeStatus }: HomeInfoBarProps) {
  return (
    <div className="border-b border-[var(--line)] bg-white/92 backdrop-blur-xl">
      <div className="shell">
        <div className="grid gap-0 divide-y divide-[var(--line)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <InfoBarItem icon={<MapPinIcon />} label="Localização" truncate value={brandContent.location} />
          <InfoBarItem icon={<ClockIcon />} label="Horário" value={storeStatus.hoursLabel} />
          <InfoBarItem icon={<PhoneIcon />} label="Entrega" value="Rápida e quentinha até você" />
        </div>
      </div>
    </div>
  );
}
