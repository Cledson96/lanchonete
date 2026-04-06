"use client";

import Image from "next/image";
import { resolveMenuItemImage } from "@/lib/menu-images.shared";
import { useCart } from "@/lib/cart-store";

export function PedidoCartSummary() {
  const { state, totalPrice } = useCart();

  const displayTotal = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalPrice);

  return (
    <section className="panel rounded-[2rem] p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Seu pedido</p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Itens e observacoes
          </h2>
        </div>
        <span className="rounded-full bg-background-strong px-4 py-2 text-sm font-semibold text-foreground">
          {displayTotal}
        </span>
      </div>

      {state.items.length === 0 ? (
        <div className="mt-6 rounded-[1.6rem] border border-line bg-white/80 px-5 py-6 text-muted">
          Adicione itens ao carrinho para revisar observacoes como &quot;sem
          tomate&quot; ou &quot;tirar cebola&quot;.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {state.items.map((item) => (
            <article
              key={item.id}
              className="flex gap-4 rounded-[1.6rem] border border-line bg-white/85 p-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1rem] bg-background-strong">
                <Image
                  alt={item.name}
                  className="object-cover"
                  fill
                  sizes="80px"
                  src={resolveMenuItemImage(item.imageUrl)}
                />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{item.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">
                      {item.categoryName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="menu-price text-xl text-accent">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.price * item.quantity)}
                    </p>
                    <p className="text-sm text-muted">Qtd. {item.quantity}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-[1rem] bg-[#fff6ea] px-4 py-3 text-sm text-[#6a5948]">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#a06f42]">
                    Observacao enviada
                  </p>
                  <p className="mt-2 leading-6">
                    {item.notes || "Sem observacao para este item."}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
