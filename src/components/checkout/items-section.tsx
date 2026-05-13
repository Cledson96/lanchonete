import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { Typography } from "@/components/ui/typography";
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
          <Typography className="mb-2" variant="eyebrow">Seu pedido</Typography>
          <Typography as="h2" variant="title-lg">Itens escolhidos</Typography>
        </div>
        <Badge className="px-4 py-2 text-[0.8rem]" tone="orange">
          {items.length} {items.length === 1 ? "item" : "itens"}
        </Badge>
      </div>

      {items.length === 0 ? (
        <EmptyState className="mt-5 rounded-[1.6rem] bg-white/80 px-5 py-8">
          <Typography variant="title-md">Seu carrinho esta vazio.</Typography>
          <Typography className="mt-2 leading-6" tone="muted" variant="body-sm">
            Volte para o cardapio e adicione lanches, combos, pasteis,
            tapiocas ou acai para continuar.
          </Typography>
          <Link
            className="mt-5 inline-flex rounded-[1.2rem] bg-[var(--brand-orange)] px-6 py-3 text-[0.95rem] font-bold text-white transition-all shadow-[0_4px_14px_rgba(242,122,34,0.3)] hover:bg-[var(--brand-orange-dark)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(242,122,34,0.4)]"
            href="/#cardapio"
          >
            Escolher itens
          </Link>
        </EmptyState>
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
                    <Typography variant="title-md">{item.name}</Typography>
                    <Typography className="mt-1 uppercase tracking-[0.18em]" tone="muted" variant="caption-sm">
                      {item.categoryName}
                    </Typography>
                    {item.optionNames && item.optionNames.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {item.optionNames.map((name, index) => (
                          <Badge key={`${item.id}-option-${index}`} className="px-2.5 py-0.5 text-[0.68rem] font-medium" tone="success">
                            {name}
                          </Badge>
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
                              <Badge key={ingId} className={`px-2 py-0.5 text-[0.68rem] font-medium ${qty === 0 ? "bg-red-50 text-red-600 line-through" : "bg-[var(--brand-orange)]/10 text-[var(--brand-orange-dark)]"}`}>
                                {qty === 0 ? `Sem ${ingName}` : `${qty}x ${ingName}`}
                              </Badge>
                            );
                          })}
                      </div>
                    ) : null}
                  </div>
                  <Typography className="menu-price text-xl" tone="orange" variant="title-md">
                    {formatMoney((item.price + (item.optionDelta || 0)) * item.quantity)}
                  </Typography>
                </div>

                {(item.optionDelta || 0) > 0 ? (
                  <Typography className="mt-1" tone="muted" variant="caption">
                    {formatMoney(item.price)} cada + {formatMoney(item.optionDelta || 0)} adicionais
                  </Typography>
                ) : null}

                <div className="mt-3 rounded-[1rem] bg-[var(--brand-orange)]/5 px-4 py-3 border border-[var(--brand-orange)]/10">
                  <Typography className="tracking-[0.18em]" tone="orange" variant="caption-sm">
                    Observacao do item
                  </Typography>
                  <Typography className="mt-1 leading-6" variant="body-sm">
                    {item.notes || "Sem observacao para este item."}
                  </Typography>
                </div>
              </div>

              <div className="flex flex-row items-center justify-between gap-3 md:flex-col md:items-end">
                <div className="inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <IconButton
                    className="hover:bg-[var(--brand-green)] hover:text-white active:scale-95"
                    label="Diminuir quantidade"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </IconButton>
                  <Typography as="span" className="min-w-6 text-center text-[0.95rem]" variant="body-md">
                    {item.quantity}
                  </Typography>
                  <IconButton
                    className="hover:bg-[var(--brand-orange)] hover:text-white active:scale-95"
                    label="Aumentar quantidade"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </IconButton>
                </div>
                <Button
                  className="mt-2 rounded-[0.8rem] border border-transparent px-4 py-2 text-[0.85rem] text-[var(--muted)] hover:border-red-200 hover:bg-red-50 hover:text-red-600 md:mt-0"
                  onClick={() => removeItem(item.id)}
                  variant="unstyled"
                >
                  Remover
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
