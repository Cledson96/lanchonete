import { BrandLogo } from "@/components/brand/logo";
import { ClockIcon, MapPinIcon, PhoneIcon } from "@/components/home/icons";
import { brandContent } from "@/lib/brand-content";
import type { StoreStatus } from "@/lib/contracts/store";

type HomeFooterProps = {
  storeStatus: StoreStatus;
};

export function HomeFooter({ storeStatus }: HomeFooterProps) {
  return (
    <footer className="footer-site mt-6">
      <div className="shell py-10 lg:py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div>
            <BrandLogo compact theme="dark" />
            <p className="mt-4 max-w-xs text-[0.85rem] leading-relaxed text-[#a08060]">
              {brandContent.subheadline}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--brand-orange-soft)]">
              Onde nos encontrar
            </p>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#a08060]">
                <MapPinIcon />
              </span>
              <p className="text-[0.85rem] leading-relaxed text-[#c8aa88]">
                {brandContent.location}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#a08060]">
                <ClockIcon />
              </span>
              <p className="text-[0.85rem] text-[#c8aa88]">
                {storeStatus.hoursLabel}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--brand-orange-soft)]">
              Entrega
            </p>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#a08060]">
                <PhoneIcon />
              </span>
              <p className="text-[0.85rem] leading-relaxed text-[#c8aa88]">
                Rápida e quentinha até você
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[#2e1c10] pt-6 sm:flex-row">
          <p className="text-[0.72rem] tracking-wide text-[#5a3f28]">
            © {new Date().getFullYear()} {brandContent.name}. Feito com carinho em Curitiba.
          </p>
          <a
            className="text-[0.72rem] tracking-wide text-[#5a3f28] transition-colors hover:text-[#a08060]"
            href="#cardapio"
          >
            ↑ Voltar ao cardápio
          </a>
        </div>
      </div>
    </footer>
  );
}
