import Image from "next/image";
import { ChevronDownIcon } from "@/components/home/home-icons";
import type { StoreStatus } from "@/lib/contracts/store";

type HomeHeroProps = {
  storeStatus: StoreStatus;
};

export function HomeHero({ storeStatus }: HomeHeroProps) {
  const statusLabel = storeStatus.isOpen ? "Aberto agora" : "Fechado agora";
  const statusDotClassName = storeStatus.isOpen
    ? "hero-status__dot"
    : "hero-status__dot hero-status__dot--closed";

  return (
    <section aria-labelledby="home-hero-title" className="hero-v2">
      <div className="shell relative z-[1] grid items-center gap-5 py-4 sm:py-5 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 lg:py-6 xl:py-7">
        <div className="relative">
          <div className="hero-reveal mb-2 flex flex-wrap items-center gap-2">
            <span className="hero-status">
              <span className={statusDotClassName} />
              {statusLabel}
            </span>
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/70">
              Curitiba · CIC
            </span>
          </div>

          <h1
            className="hero-reveal max-w-[560px] text-[1.75rem] font-black leading-[0.98] tracking-tight text-white sm:text-[2.35rem] lg:text-[2.8rem] xl:text-[3.35rem]"
            id="home-hero-title"
          >
            <span className="text-[var(--brand-green)]" style={{ WebkitTextStroke: "1.5px #fff" }}>
              Lanches{" "}
            </span>
            <span className="relative inline-block">
              artesanais
              <svg
                aria-hidden="true"
                className="hero-underline"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 140 12"
              >
                <path
                  d="M2 8 C 30 2, 70 2, 138 8"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth={3}
                />
              </svg>
            </span>
          </h1>

          <p className="hero-reveal mt-3 max-w-md text-[0.9rem] leading-snug text-white/86 xl:text-[1rem]">
            Pão selado na manteiga, maionese caseira e entrega quentinha até você.
          </p>

          <div className="hero-reveal mt-4 flex flex-wrap items-center gap-3">
            <a className="cta-btn cta-btn--primary" href="#cardapio">
              Pedir agora
              <ChevronDownIcon />
            </a>
            <span className="text-[0.78rem] font-semibold text-white/75">
              Monte seu lanche em poucos cliques
            </span>
          </div>
        </div>

        <div className="hero-reveal relative">
          <div className="hero-window">
            <Image
              alt="Lanches artesanais da casa"
              className="object-cover"
              fill
              priority
              quality={90}
              sizes="(max-width: 1024px) 100vw, 560px"
              src="/landing/hero-burger.jpg"
            />
            <div className="hero-window__shade" />
            <div className="hero-window__tag">
              <span className="hero-window__tag-dot" />
              Entrega quente no CIC
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
