"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import type { DeliveryRule, StoreSettings } from "@/lib/contracts/store";
import { MENU_WEEKDAYS } from "@/lib/menu-item-availability";
import { formatMoney } from "@/lib/utils";

type ApiErrorPayload = {
  error?: { message?: string };
};

type Toast = {
  tone: "success" | "error";
  message: string;
} | null;

async function readJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const payload = (await response.json().catch(() => null)) as T & ApiErrorPayload;

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Nao foi possivel salvar.");
  }

  return payload;
}

function numberOrUndefined(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readInputNumber(event: ChangeEvent<HTMLInputElement>) {
  return Number(event.target.value);
}

function readNullableInputNumber(event: ChangeEvent<HTMLInputElement>) {
  return event.target.value ? Number(event.target.value) : null;
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.316.804.672 1.043.355.239.797.313 1.212.204l.874-.23a1.125 1.125 0 011.3.65l.547 1.002c.264.485.137 1.09-.304 1.421l-.724.543a1.33 1.33 0 000 2.133l.724.543c.44.33.568.936.304 1.421l-.546 1.002a1.125 1.125 0 01-1.301.65l-.874-.23a1.33 1.33 0 00-1.884 1.247l-.149.894c-.09.542-.56.94-1.11.94h-1.093c-.55 0-1.02-.398-1.11-.94l-.149-.894a1.33 1.33 0 00-1.884-1.247l-.874.23a1.125 1.125 0 01-1.3-.65l-.547-1.002a1.125 1.125 0 01.304-1.421l.724-.543a1.33 1.33 0 000-2.133l-.724-.543a1.125 1.125 0 01-.304-1.421l.546-1.002a1.125 1.125 0 011.301-.65l.874.23a1.33 1.33 0 001.884-1.247l.149-.894z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DashboardSettingsManager({
  initialSettings,
}: {
  initialSettings: StoreSettings;
}) {
  const [store, setStore] = useState(initialSettings.store);
  const [businessHours, setBusinessHours] = useState(initialSettings.businessHours);
  const [deliveryRules, setDeliveryRules] = useState(initialSettings.deliveryRules);
  const [newRule, setNewRule] = useState<Omit<DeliveryRule, "id">>({
    label: "Nova faixa",
    city: initialSettings.store.city,
    state: initialSettings.store.state,
    neighborhood: "",
    zipCodeStart: "",
    zipCodeEnd: "",
    maxDistanceKm: initialSettings.store.maxDeliveryDistanceKm,
    feeAmount: 0,
    minimumOrderAmount: 0,
    freeAboveAmount: null,
    estimatedMinMinutes: 20,
    estimatedMaxMinutes: 60,
    sortOrder: deliveryRules.length + 1,
    isActive: true,
  });
  const [status, setStatus] = useState(initialSettings.status);
  const [savingStore, setSavingStore] = useState(false);
  const [savingFreight, setSavingFreight] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const activeRules = useMemo(
    () => deliveryRules.filter((rule) => rule.isActive).length,
    [deliveryRules],
  );

  async function handleSaveStoreSettings() {
    setSavingStore(true);
    setToast(null);

    try {
      const payload = await readJson<StoreSettings>("/api/dashboard/settings", {
        method: "PATCH",
        body: JSON.stringify({
          store,
          businessHours: businessHours.map((hour) => ({
            weekday: hour.weekday,
            opensAt: hour.opensAt,
            closesAt: hour.closesAt,
            isOpen: hour.isOpen,
          })),
        }),
      });
      setStore(payload.store);
      setBusinessHours(payload.businessHours);
      setDeliveryRules(payload.deliveryRules);
      setStatus(payload.status);
      setToast({ tone: "success", message: "Configuracoes da loja salvas." });
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel salvar.",
      });
    } finally {
      setSavingStore(false);
    }
  }

  async function handleSaveDeliveryRules() {
    setSavingFreight(true);
    setToast(null);

    try {
      const updatedRules = await Promise.all(
        deliveryRules.map((rule) =>
          readJson<{ rule: DeliveryRule }>("/api/delivery-fee-rules", {
            method: "PATCH",
            body: JSON.stringify({
              id: rule.id,
              label: rule.label,
              neighborhood: rule.neighborhood || undefined,
              city: rule.city,
              state: rule.state,
              zipCodeStart: rule.zipCodeStart || undefined,
              zipCodeEnd: rule.zipCodeEnd || undefined,
              maxDistanceKm: rule.maxDistanceKm,
              feeAmount: rule.feeAmount,
              minimumOrderAmount: numberOrUndefined(rule.minimumOrderAmount),
              freeAboveAmount: numberOrUndefined(rule.freeAboveAmount),
              estimatedMinMinutes: numberOrUndefined(rule.estimatedMinMinutes),
              estimatedMaxMinutes: numberOrUndefined(rule.estimatedMaxMinutes),
              sortOrder: rule.sortOrder,
              isActive: rule.isActive,
            }),
          }).then((payload) => payload.rule),
        ),
      );

      setDeliveryRules(updatedRules);
      setToast({ tone: "success", message: "Faixas de frete atualizadas." });
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel salvar o frete.",
      });
    } finally {
      setSavingFreight(false);
    }
  }

  async function handleCreateRule() {
    setSavingFreight(true);
    setToast(null);

    try {
      const payload = await readJson<{ rule: DeliveryRule }>("/api/delivery-fee-rules", {
        method: "POST",
        body: JSON.stringify({
          ...newRule,
          neighborhood: newRule.neighborhood || undefined,
          zipCodeStart: newRule.zipCodeStart || undefined,
          zipCodeEnd: newRule.zipCodeEnd || undefined,
          minimumOrderAmount: numberOrUndefined(newRule.minimumOrderAmount),
          freeAboveAmount: numberOrUndefined(newRule.freeAboveAmount),
          estimatedMinMinutes: numberOrUndefined(newRule.estimatedMinMinutes),
          estimatedMaxMinutes: numberOrUndefined(newRule.estimatedMaxMinutes),
        }),
      });
      setDeliveryRules((current) => [...current, payload.rule]);
      setNewRule((current) => ({
        ...current,
        label: "Nova faixa",
        maxDistanceKm: current.maxDistanceKm + 1,
        feeAmount: 0,
        sortOrder: current.sortOrder + 1,
      }));
      setToast({ tone: "success", message: "Faixa de frete criada." });
    } catch (error) {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel criar a faixa.",
      });
    } finally {
      setSavingFreight(false);
    }
  }

  function updateRule(id: string, patch: Partial<DeliveryRule>) {
    setDeliveryRules((current) =>
      current.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    );
  }

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow mb-2">Configurações</p>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              Loja, horários e frete
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Ajuste os dados usados no checkout, no cálculo de entrega e no bloqueio de pedidos fora do expediente.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--background)] px-4 py-3">
            <span className={`h-2.5 w-2.5 rounded-full ${status.isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                {status.isOpen ? "Aberta agora" : "Fechada agora"}
              </p>
              <p className="text-sm font-medium">{status.hoursLabel}</p>
            </div>
          </div>
        </div>
      </section>

      {toast ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            toast.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-orange)] text-white">
              <SettingsIcon />
            </span>
            <div>
              <h2 className="text-lg font-bold">Dados da loja</h2>
              <p className="text-sm text-[var(--muted)]">Origem do cálculo de distância e retirada.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Nome</span>
              <input className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 outline-none focus:border-[var(--brand-orange)]" value={store.name} onChange={(e) => setStore((current) => ({ ...current, name: e.target.value }))} />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">CEP</span>
              <input className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 outline-none focus:border-[var(--brand-orange)]" value={store.zipCode || ""} onChange={(e) => setStore((current) => ({ ...current, zipCode: e.target.value }))} />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Raio máximo km</span>
              <input className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 outline-none focus:border-[var(--brand-orange)]" min={0.1} step={0.1} type="number" value={store.maxDeliveryDistanceKm} onChange={(event) => setStore((current) => ({ ...current, maxDeliveryDistanceKm: readInputNumber(event) }))} />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Rua</span>
              <input className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 outline-none focus:border-[var(--brand-orange)]" value={store.street} onChange={(e) => setStore((current) => ({ ...current, street: e.target.value }))} />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Número</span>
              <input className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 outline-none focus:border-[var(--brand-orange)]" value={store.number} onChange={(e) => setStore((current) => ({ ...current, number: e.target.value }))} />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Bairro</span>
              <input className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 outline-none focus:border-[var(--brand-orange)]" value={store.neighborhood || ""} onChange={(e) => setStore((current) => ({ ...current, neighborhood: e.target.value }))} />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Cidade</span>
              <input className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 outline-none focus:border-[var(--brand-orange)]" value={store.city} onChange={(e) => setStore((current) => ({ ...current, city: e.target.value }))} />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">UF</span>
              <input className="w-full rounded-xl border border-[var(--line)] px-3 py-2.5 uppercase outline-none focus:border-[var(--brand-orange)]" maxLength={2} value={store.state} onChange={(e) => setStore((current) => ({ ...current, state: e.target.value.toUpperCase() }))} />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold">Horários de trabalho</h2>
            <p className="text-sm text-[var(--muted)]">Fora dessas janelas o checkout público fica bloqueado.</p>
          </div>
          <div className="space-y-2">
            {MENU_WEEKDAYS.map((weekday) => {
              const hour = businessHours.find((item) => item.weekday === weekday.value);
              if (!hour) return null;
              return (
                <div key={weekday.value} className="grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--background)] px-3 py-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                  <label className="flex items-center gap-3">
                    <input checked={hour.isOpen} className="h-4 w-4 accent-[var(--brand-orange)]" type="checkbox" onChange={(e) => setBusinessHours((current) => current.map((item) => item.weekday === weekday.value ? { ...item, isOpen: e.target.checked } : item))} />
                    <span className="font-semibold">{weekday.label}</span>
                  </label>
                  <input aria-label={`${weekday.label} abre`} className="rounded-lg border border-[var(--line)] px-2 py-2 text-sm disabled:opacity-45" disabled={!hour.isOpen} type="time" value={hour.opensAt} onChange={(e) => setBusinessHours((current) => current.map((item) => item.weekday === weekday.value ? { ...item, opensAt: e.target.value } : item))} />
                  <span className="hidden text-xs text-[var(--muted)] sm:block">até</span>
                  <input aria-label={`${weekday.label} fecha`} className="rounded-lg border border-[var(--line)] px-2 py-2 text-sm disabled:opacity-45" disabled={!hour.isOpen} type="time" value={hour.closesAt} onChange={(e) => setBusinessHours((current) => current.map((item) => item.weekday === weekday.value ? { ...item, closesAt: e.target.value } : item))} />
                </div>
              );
            })}
          </div>
          <button className="mt-5 rounded-full bg-[var(--brand-orange)] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--brand-orange-dark)] disabled:opacity-50" disabled={savingStore} onClick={() => void handleSaveStoreSettings()} type="button">
            {savingStore ? "Salvando..." : "Salvar loja e horários"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold">Faixas de frete</h2>
            <p className="text-sm text-[var(--muted)]">
              {activeRules} faixas ativas. Remover desativa a regra e preserva histórico.
            </p>
          </div>
          <button className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold transition hover:bg-[var(--background)] disabled:opacity-50" disabled={savingFreight} onClick={() => void handleSaveDeliveryRules()} type="button">
            {savingFreight ? "Salvando..." : "Salvar frete"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-separate border-spacing-y-2 text-sm">
            <thead className="text-left text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-2">Faixa</th>
                <th className="px-2">Km</th>
                <th className="px-2">Valor</th>
                <th className="px-2">Mínimo</th>
                <th className="px-2">Grátis acima</th>
                <th className="px-2">Tempo</th>
                <th className="px-2">Status</th>
                <th className="px-2"></th>
              </tr>
            </thead>
            <tbody>
              {deliveryRules.map((rule) => (
                <tr key={rule.id} className="bg-[var(--background)]">
                  <td className="rounded-l-xl px-2 py-2"><input className="w-52 rounded-lg border border-[var(--line)] px-2 py-2" value={rule.label} onChange={(e) => updateRule(rule.id, { label: e.target.value })} /></td>
                  <td className="px-2 py-2"><input className="w-20 rounded-lg border border-[var(--line)] px-2 py-2" min={0.1} step={0.1} type="number" value={rule.maxDistanceKm} onChange={(event) => updateRule(rule.id, { maxDistanceKm: readInputNumber(event) })} /></td>
                  <td className="px-2 py-2"><input className="w-24 rounded-lg border border-[var(--line)] px-2 py-2" min={0} step={0.01} type="number" value={rule.feeAmount} onChange={(event) => updateRule(rule.id, { feeAmount: readInputNumber(event) })} /></td>
                  <td className="px-2 py-2"><input className="w-24 rounded-lg border border-[var(--line)] px-2 py-2" min={0} step={0.01} type="number" value={rule.minimumOrderAmount ?? 0} onChange={(event) => updateRule(rule.id, { minimumOrderAmount: readInputNumber(event) })} /></td>
                  <td className="px-2 py-2"><input className="w-24 rounded-lg border border-[var(--line)] px-2 py-2" min={0} step={0.01} type="number" value={rule.freeAboveAmount ?? 0} onChange={(event) => updateRule(rule.id, { freeAboveAmount: readNullableInputNumber(event) })} /></td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1">
                      <input className="w-16 rounded-lg border border-[var(--line)] px-2 py-2" min={0} type="number" value={rule.estimatedMinMinutes ?? 0} onChange={(event) => updateRule(rule.id, { estimatedMinMinutes: readInputNumber(event) })} />
                      <span className="text-[var(--muted)]">-</span>
                      <input className="w-16 rounded-lg border border-[var(--line)] px-2 py-2" min={0} type="number" value={rule.estimatedMaxMinutes ?? 0} onChange={(event) => updateRule(rule.id, { estimatedMaxMinutes: readInputNumber(event) })} />
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <label className="flex items-center gap-2">
                      <input checked={rule.isActive} className="h-4 w-4 accent-[var(--brand-orange)]" type="checkbox" onChange={(e) => updateRule(rule.id, { isActive: e.target.checked })} />
                      <span>{rule.isActive ? "Ativa" : "Inativa"}</span>
                    </label>
                  </td>
                  <td className="rounded-r-xl px-2 py-2 text-right">
                    <button className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50" onClick={() => updateRule(rule.id, { isActive: false })} type="button">
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-[var(--line)] bg-[var(--background)] p-4">
          <h3 className="text-sm font-bold">Nova faixa</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-6">
            <input className="rounded-lg border border-[var(--line)] px-3 py-2 md:col-span-2" placeholder="Nome" value={newRule.label} onChange={(e) => setNewRule((current) => ({ ...current, label: e.target.value }))} />
            <input className="rounded-lg border border-[var(--line)] px-3 py-2" min={0.1} step={0.1} type="number" value={newRule.maxDistanceKm} onChange={(event) => setNewRule((current) => ({ ...current, maxDistanceKm: readInputNumber(event) }))} />
            <input className="rounded-lg border border-[var(--line)] px-3 py-2" min={0} step={0.01} type="number" value={newRule.feeAmount} onChange={(event) => setNewRule((current) => ({ ...current, feeAmount: readInputNumber(event) }))} />
            <input className="rounded-lg border border-[var(--line)] px-3 py-2" placeholder="Cidade" value={newRule.city} onChange={(e) => setNewRule((current) => ({ ...current, city: e.target.value }))} />
            <input className="rounded-lg border border-[var(--line)] px-3 py-2 uppercase" maxLength={2} placeholder="UF" value={newRule.state} onChange={(e) => setNewRule((current) => ({ ...current, state: e.target.value.toUpperCase() }))} />
          </div>
          <button className="mt-3 rounded-full bg-[var(--brand-green)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--brand-green-dark)] disabled:opacity-50" disabled={savingFreight} onClick={() => void handleCreateRule()} type="button">
            Criar faixa de {formatMoney(newRule.feeAmount)}
          </button>
        </div>
      </section>
    </main>
  );
}
