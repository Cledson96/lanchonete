import Image from "next/image";
import Link from "next/link";
import type { CartItem } from "@/lib/cart-store";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";
import { formatMoney } from "@/lib/utils";

type CheckoutItemsSectionProps = {
  items: CartItem[];
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
};

export function CheckoutItemsSection(props: CheckoutItemsSectionProps) {
  const { items, removeItem, updateQuantity } = props;

  return (
    <section className="panel rounded-[2rem] px-6 py-6 md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Seu pedido</p>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Itens escolhidos
          </h2>
        </div>
        <span className="rounded-full bg-[var(--brand-orange)]/10 px-4 py-2 text-[0.8rem] font-bold text-[var(--brand-orange-dark)]">
          {items.length} {items.length === 1 ? "item" : "itens"}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-[1.6rem] border border-dashed border-[var(--line)] bg-white/80 px-5 py-8 text-center">
          <p className="text-lg font-semibold text-[var(--foreground)]">Seu carrinho esta vazio.</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Volte para o cardapio e adicione lanches, combos, pasteis,
            tapiocas ou acai para continuar.
          </p>
          <Link
            className="mt-5 inline-flex rounded-[1.2rem] bg-[var(--brand-orange)] px-6 py-3 text-[0.95rem] font-bold text-white transition-all shadow-[0_4px_14px_rgba(242,122,34,0.3)] hover:bg-[var(--brand-orange-dark)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(242,122,34,0.4)]"
            href="/#cardapio"
          >
            Escolher itens
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="group grid gap-4 rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:shadow-md hover:border-[var(--brand-orange)]/30 md:grid-cols-[6.5rem_minmax(0,1fr)_auto]"
            >
              <div className="relative h-22 overflow-hidden rounded-[1.15rem] bg-background-strong md:h-24">
                <Image
                  alt={item.name}
                  className="object-cover"
                  fill
                  sizes="96px"
                  src={resolveMenuItemImage(item.imageUrl)}
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--foreground)]">{item.name}</h3>
                    <p className="mt-1 text-[0.72rem] uppercase tracking-[0.18em] text-[var(--muted)]">
                      {item.categoryName}
                    </p>
                    {item.optionNames && item.optionNames.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {item.optionNames.map((name, index) => (
                          <span key={`${item.id}-option-${index}`} className="inline-flex rounded-full bg-[var(--brand-green)]/10 px-2.5 py-0.5 text-[0.68rem] font-medium text-[var(--brand-green-dark)]">
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {item.ingredientCustomizations && item.ingredientNames ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(item.ingredientCustomizations)
                          .filter(([, qty]) => qty !== 1)
                          .map(([ingId, qty]) => {
                            const ingName = item.ingredientNames?.[ingId] || ingId;
                            return (
                              <span key={ingId} className={`inline-flex rounded-full px-2 py-0.5 text-[0.68rem] font-medium ${qty === 0 ? "bg-red-50 text-red-600 line-through" : "bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]"}`}>
                                {qty === 0 ? `Sem ${ingName}` : `${qty}x ${ingName}`}
                              </span>
                            );
                          })}
                      </div>
                    ) : null}
                  </div>
                  <p className="menu-price text-xl font-bold text-[var(--brand-orange)]">
                    {formatMoney((item.price + (item.optionDelta || 0)) * item.quantity)}
                  </p>
                </div>

                {(item.optionDelta || 0) > 0 ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {formatMoney(item.price)} cada + {formatMoney(item.optionDelta || 0)} adicionais
                  </p>
                ) : null}

                <div className="mt-3 rounded-[1rem] bg-[var(--brand-orange)]/5 px-4 py-3 border border-[var(--brand-orange)]/10">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--brand-orange-dark)]">
                    Observacao do item
                  </p>
                  <p className="mt-1 text-[0.85rem] leading-6 text-[var(--foreground)]">
                    {item.notes || "Sem observacao para este item."}
                  </p>
                </div>
              </div>

              <div className="flex flex-row items-center justify-between gap-3 md:flex-col md:items-end">
                <div className="inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <button
                    aria-label="Diminuir quantidade"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--foreground)] transition-all hover:bg-[var(--brand-green)] hover:text-white active:scale-95"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="min-w-6 text-center text-[0.95rem] font-bold text-[var(--foreground)]">
                    {item.quantity}
                  </span>
                  <button
                    aria-label="Aumentar quantidade"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--foreground)] transition-all hover:bg-[var(--brand-orange)] hover:text-white active:scale-95"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <button
                  className="cursor-pointer rounded-[0.8rem] border border-transparent px-4 py-2 text-[0.85rem] font-semibold text-[var(--muted)] transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 mt-2 md:mt-0"
                  onClick={() => removeItem(item.id)}
                  type="button"
                >
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
