"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import type { OrderItemUnitStatus } from "@/lib/orders/operations";
import {
  DashboardOrderDetailSheet,
  type DashboardOrderDetail,
} from "@/components/dashboard/order-detail-sheet";
import { columnsByView } from "./orders/config";
import { FilterPill } from "./orders/filter-pill";
import { buildKitchenItems, humanize, parseJson } from "./orders/helpers";
import { KanbanColumn } from "./orders/kanban-column";
import { KitchenItemCard } from "./orders/kitchen-item-card";
import { KitchenKanbanColumn } from "./orders/kitchen-kanban-column";
import { OrderCard } from "./orders/order-card";
import type {
  DashboardOrdersWorkspaceProps,
  KitchenColumnConfig,
  KitchenItemCardData,
  KitchenItemOpenTarget,
  OrderChannel,
  OrderStatus,
  OrderSummary,
} from "./orders/types";

export function DashboardOrdersWorkspace({
  view,
  title,
  description,
}: DashboardOrdersWorkspaceProps) {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<DashboardOrderDetail | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedKitchenItem, setSelectedKitchenItem] = useState<KitchenItemOpenTarget | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<"all" | OrderChannel>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | OrderSummary["type"]>("all");
  const [activeDrag, setActiveDrag] = useState<OrderSummary | null>(null);
  const [activeKitchenItem, setActiveKitchenItem] = useState<KitchenItemCardData | null>(null);
  const [pendingUnitId, setPendingUnitId] = useState<string | null>(null);
  const ordersRef = useRef<OrderSummary[]>([]);
  const suppressKitchenClickRef = useRef(false);
  const suppressKitchenClickTimeoutRef = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const refreshOrders = useCallback(
    async (keepDetail = true) => {
      try {
        setListError(null);
        const params = new URLSearchParams({ view });
        if (channelFilter !== "all") params.set("channel", channelFilter);
        if (typeFilter !== "all") params.set("type", typeFilter);

        const response = await fetch(`/api/dashboard/orders?${params.toString()}`, { cache: "no-store" });
        const payload = await parseJson<{ orders: OrderSummary[] }>(response);
        setOrders(payload.orders);
        ordersRef.current = payload.orders;

        if (keepDetail && selectedOrderId) {
          const detailResponse = await fetch(`/api/dashboard/orders/${selectedOrderId}`, { cache: "no-store" });
          const detailPayload = await parseJson<{ order: DashboardOrderDetail }>(detailResponse);
          setSelectedOrder(detailPayload.order);
        }
      } catch (error) {
        setListError(error instanceof Error ? error.message : "Não foi possível carregar os pedidos.");
      } finally {
        setLoadingList(false);
      }
    },
    [channelFilter, selectedOrderId, typeFilter, view],
  );

  const openOrder = useCallback(async (orderId: string) => {
    try {
      setSelectedOrderId(orderId);
      setLoadingDetail(true);
      setDetailError(null);
      setFeedback(null);
      const response = await fetch(`/api/dashboard/orders/${orderId}`, { cache: "no-store" });
      const payload = await parseJson<{ order: DashboardOrderDetail }>(response);
      setSelectedOrder(payload.order);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Não foi possível carregar o pedido.");
      setSelectedOrder(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const openKitchenItem = useCallback(async (target: KitchenItemOpenTarget) => {
    if (suppressKitchenClickRef.current) return;
    setSelectedKitchenItem(target);
    await openOrder(target.orderId);
  }, [openOrder]);

  useEffect(() => {
    setLoadingList(true);
    void refreshOrders(false);
  }, [refreshOrders]);

  useEffect(() => {
    let consecutiveErrors = 0;
    const interval = window.setInterval(() => {
      void refreshOrders(true)
        .then(() => {
          consecutiveErrors = 0;
        })
        .catch(() => {
          consecutiveErrors++;
          if (consecutiveErrors >= 5) {
            window.clearInterval(interval);
          }
        });
    }, 7000);
    return () => window.clearInterval(interval);
  }, [refreshOrders]);

  useEffect(() => {
    return () => {
      if (suppressKitchenClickTimeoutRef.current) {
        window.clearTimeout(suppressKitchenClickTimeoutRef.current);
      }
    };
  }, []);

  const operationalOrders = useMemo(() => orders.filter((order) => order.items.length > 0), [orders]);

  const columns = useMemo(() => {
    return columnsByView[view].map((column) => ({
      ...column,
      orders: operationalOrders
        .filter((order) => order.status === column.status)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    }));
  }, [operationalOrders, view]);

  const kitchenColumns = useMemo(() => {
    const items = buildKitchenItems(operationalOrders);

    return (columnsByView.kitchen as KitchenColumnConfig[]).map((column) => ({
      ...column,
      items: items
        .filter((item) => item.unitStatus === column.status)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    }));
  }, [operationalOrders]);

  const showOrderBoard = view !== "kitchen";
  const showKitchenBoard = view === "kitchen";

  const actionScope = view === "kitchen" ? "kitchen" : "operation";

  const canMoveOrderInBoard = useCallback((order: OrderSummary) => {
    if (view !== "operation") return false;
    return order.status === "pronto" && order.type === "delivery";
  }, [view]);

  const canDropOrderToStatus = useCallback((order: OrderSummary, toStatus: OrderStatus) => {
    if (view !== "operation") return false;
    return toStatus === "saiu_para_entrega" && order.status === "pronto" && order.type === "delivery";
  }, [view]);

  async function handleTransition(toStatus: OrderStatus) {
    if (!selectedOrder) return;
    try {
      const currentOrderId = selectedOrder.id;
      setPendingStatus(toStatus);
      setDetailError(null);
      setFeedback(null);
      const response = await fetch(`/api/dashboard/orders/${currentOrderId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toStatus }),
      });
      const payload = await parseJson<{ order: { code: string; status: OrderStatus } }>(response);
      const detailResponse = await fetch(`/api/dashboard/orders/${currentOrderId}`, { cache: "no-store" });
      const detailPayload = await parseJson<{ order: DashboardOrderDetail }>(detailResponse);
      setSelectedOrder(detailPayload.order);
      setFeedback(`Pedido ${payload.order.code} atualizado para ${humanize(payload.order.status)}.`);
      await refreshOrders(false);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Não foi possível atualizar o status.");
    } finally {
      setPendingStatus(null);
    }
  }

  async function handleUnitTransition(input: {
    orderId: string;
    itemId: string;
    unitId: string;
    source: "operation" | "kitchen";
    toStatus: "em_preparo" | "pronto" | "entregue" | "cancelado";
  }) {
    try {
      const shouldUpdateOpenDetail = selectedOrderId === input.orderId || selectedOrder?.id === input.orderId;

      setPendingUnitId(input.unitId);
      setDetailError(null);
      setFeedback(null);
      const response = await fetch(`/api/dashboard/orders/${input.orderId}/items/${input.itemId}/units/${input.unitId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toStatus: input.toStatus, source: input.source }),
      });
      await parseJson<{ order: DashboardOrderDetail }>(response);

      if (shouldUpdateOpenDetail) {
        const detailResponse = await fetch(`/api/dashboard/orders/${input.orderId}`, { cache: "no-store" });
        const detailPayload = await parseJson<{ order: DashboardOrderDetail }>(detailResponse);
        setSelectedOrder(detailPayload.order);
      }

      setFeedback(`Item atualizado para ${humanize(input.toStatus)}.`);
      await refreshOrders(false);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Não foi possível atualizar o item.");
    } finally {
      setPendingUnitId(null);
    }
  }

  function closeDetail() {
    setSelectedOrderId(null);
    setSelectedKitchenItem(null);
    setSelectedOrder(null);
    setDetailError(null);
    setFeedback(null);
  }

  function handleDragStart(event: DragStartEvent) {
    const order = ordersRef.current.find((o) => o.id === event.active.id);
    if (order) setActiveDrag(order);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const orderId = active.id as string;
    const toStatus = over.id as OrderStatus;
    const current = ordersRef.current.find((o) => o.id === orderId);
    if (!current || current.status === toStatus) return;
    if (!canDropOrderToStatus(current, toStatus)) return;

    const prev = ordersRef.current;
    const next = prev.map((o) => (o.id === orderId ? { ...o, status: toStatus } : o));
    ordersRef.current = next;
    setOrders(next);
    setFeedback(null);
    setListError(null);

    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toStatus }),
      });
      const payload = await parseJson<{ order: { code: string; status: OrderStatus } }>(response);
      setFeedback(`Pedido ${payload.order.code} → ${humanize(payload.order.status)}`);
      await refreshOrders(false);
    } catch (error) {
      ordersRef.current = prev;
      setOrders(prev);
      setListError(error instanceof Error ? error.message : "Não foi possível mover o pedido.");
    }
  }

  function handleKitchenDragStart(event: DragStartEvent) {
    suppressKitchenClickRef.current = true;
    if (suppressKitchenClickTimeoutRef.current) {
      window.clearTimeout(suppressKitchenClickTimeoutRef.current);
    }
    const items = buildKitchenItems(ordersRef.current);
    const kitchenItem = items.find((item) => item.id === event.active.id);
    if (kitchenItem) setActiveKitchenItem(kitchenItem);
  }

  async function handleKitchenDragEnd(event: DragEndEvent) {
    setActiveKitchenItem(null);
    suppressKitchenClickTimeoutRef.current = window.setTimeout(() => {
      suppressKitchenClickRef.current = false;
      suppressKitchenClickTimeoutRef.current = null;
    }, 120);
    const { active, over } = event;
    if (!over) return;

    const items = buildKitchenItems(ordersRef.current);
    const current = items.find((item) => item.id === active.id);
    const toStatus = over.id as OrderItemUnitStatus;

    if (!current || current.unitStatus === toStatus) return;
    if (toStatus !== "em_preparo" && toStatus !== "pronto") return;

    await handleUnitTransition({
      orderId: current.orderId,
      itemId: current.itemId,
      unitId: current.unitId,
      source: "kitchen",
      toStatus,
    });
  }

  return (
    <main className="space-y-4 text-[var(--foreground)]">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Typography className="eyebrow" tone="muted" variant="eyebrow">
            Operação em tempo real
          </Typography>
          <Typography as="h1" className="mt-1 text-2xl font-semibold" variant="title-lg">
            {title}
          </Typography>
          <Typography className="mt-1 max-w-2xl leading-5" tone="muted" variant="caption-sm">
            {description}
          </Typography>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            label="Canal"
            onChange={(v) => setChannelFilter(v as typeof channelFilter)}
            options={[
              { value: "all", label: "Todos" },
              { value: "web", label: "Web" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "local", label: "Balcão" },
            ]}
            value={channelFilter}
          />
          <FilterPill
            label="Tipo"
            onChange={(v) => setTypeFilter(v as typeof typeFilter)}
            options={[
              { value: "all", label: "Todos" },
              { value: "delivery", label: "Delivery" },
              { value: "retirada", label: "Retirada" },
              { value: "local", label: "Local" },
            ]}
            value={typeFilter}
          />
          <Button
            onClick={() => {
              setLoadingList(true);
              void refreshOrders(true);
            }}
            size="sm"
          >
            Atualizar
          </Button>
        </div>
      </section>

      {feedback ? <Alert className="rounded-xl px-4" tone="success">{feedback}</Alert> : null}
      {listError ? <Alert className="rounded-xl px-4" tone="error">{listError}</Alert> : null}

      {showOrderBoard ? (
        <section className="space-y-3">
          {view === "operation" ? (
            <div>
              <Typography variant="title-sm">Pedidos e comandas</Typography>
              <Typography className="mt-1" tone="muted" variant="caption-sm">
                Visão consolidada do pedido inteiro para acompanhar status, total e contexto da comanda.
              </Typography>
            </div>
          ) : null}

          <DndContext
            onDragCancel={() => setActiveDrag(null)}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            sensors={sensors}
          >
            <section className="-mx-4 overflow-x-auto pb-4 lg:mx-0">
              <div className="flex snap-x gap-4 px-4 lg:px-0">
                {columns.map((column) => (
                  <KanbanColumn
                    allowDrop={view === "operation" ? column.status === "saiu_para_entrega" : view !== "archive"}
                    canDragOrder={canMoveOrderInBoard}
                    column={column}
                    key={column.status}
                    loading={loadingList}
                    onOpen={(id) => void openOrder(id)}
                    orders={column.orders}
                  />
                ))}
              </div>
            </section>

            <DragOverlay>
              {activeDrag ? <OrderCard order={activeDrag} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
        </section>
      ) : null}

      {showKitchenBoard ? (
        <section className="space-y-3">
          <div>
            <Typography variant="title-sm">Fila da cozinha por item</Typography>
            <Typography className="mt-1" tone="muted" variant="caption-sm">
              Visão focada no que precisa ser preparado agora. Clique no item para ver os detalhes de preparo.
            </Typography>
          </div>

          <section className="-mx-4 overflow-x-auto pb-4 lg:mx-0">
            <DndContext
              onDragCancel={() => {
                setActiveKitchenItem(null);
                suppressKitchenClickTimeoutRef.current = window.setTimeout(() => {
                  suppressKitchenClickRef.current = false;
                  suppressKitchenClickTimeoutRef.current = null;
                }, 120);
              }}
              onDragEnd={handleKitchenDragEnd}
              onDragStart={handleKitchenDragStart}
              sensors={sensors}
            >
              <div className="flex snap-x gap-4 px-4 lg:px-0">
                {kitchenColumns.map((column) => (
                  <KitchenKanbanColumn
                    column={column}
                    items={column.items}
                    key={`kitchen-${column.status}`}
                    loading={loadingList}
                    onOpen={(target) => void openKitchenItem(target)}
                  />
                ))}
              </div>

              <DragOverlay>
                {activeKitchenItem ? <KitchenItemCard item={activeKitchenItem} isOverlay onOpen={() => undefined} /> : null}
              </DragOverlay>
            </DndContext>
          </section>
        </section>
      ) : null}

      <DashboardOrderDetailSheet
        actionScope={actionScope}
        error={detailError}
        feedback={feedback}
        loading={loadingDetail}
        kitchenItemTarget={selectedKitchenItem}
        onClose={closeDetail}
        onTransition={handleTransition}
        onUnitTransition={handleUnitTransition}
        order={selectedOrder}
        pendingStatus={pendingStatus}
        pendingUnitId={pendingUnitId}
      />
    </main>
  );
}
