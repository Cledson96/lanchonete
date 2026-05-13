import { formatMoney } from "@/lib/utils";
import { asNumber } from "./helpers";
import { EditIcon, TrashIcon } from "./icons";
import type { OptionGroupSummary } from "./types";

export function GroupCard({
  group,
  onDelete,
  onEdit,
  onToggleActive,
}: {
  group: OptionGroupSummary;
  onDelete: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-[var(--surface)] shadow-sm transition hover:border-[var(--brand-orange)]/40 hover:shadow-md ${
        group.isActive ? "border-[var(--line)]" : "border-[var(--line)] opacity-75"
      }`}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-sm font-bold leading-tight">{group.name}</h3>
            {!group.isActive ? (
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[0.6rem] font-bold text-red-700">Inativo</span>
            ) : null}
            {group.isRequired ? (
              <span className="rounded-full bg-[var(--brand-orange)]/10 px-1.5 py-0.5 text-[0.6rem] font-bold text-[var(--brand-orange-dark)]">
                Obrigatório
              </span>
            ) : null}
          </div>
          {group.description ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-[var(--muted)]">{group.description}</p>
          ) : null}
          <p className="mt-1 text-[0.65rem] text-[var(--muted)]">
            {group.options.length} {group.options.length === 1 ? "opção" : "opções"}
            {group.minSelections > 0 ? ` · mín ${group.minSelections}` : ""}
            {group.maxSelections ? ` · máx ${group.maxSelections}` : ""}
          </p>
        </div>
      </div>

      {group.options.length > 0 ? (
        <div className="border-t border-[var(--line)] bg-[var(--background)]/40 px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {group.options.slice(0, 8).map((option) => {
              const delta = asNumber(option.priceDelta);
              return (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.65rem] font-medium ${
                    !option.isActive
                      ? "bg-gray-100 text-gray-400 line-through"
                      : delta > 0
                        ? "bg-[var(--brand-green)]/10 text-[var(--brand-green-dark)]"
                        : "bg-[var(--background)] text-[var(--muted)]"
                  }`}
                  key={option.id}
                >
                  {option.isDefault ? <span className="text-[var(--brand-orange)]">★</span> : null}
                  {option.name}
                  {delta > 0 ? <span className="opacity-70">+{formatMoney(delta)}</span> : null}
                </span>
              );
            })}
            {group.options.length > 8 ? (
              <span className="inline-flex items-center rounded-md bg-[var(--background)] px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--muted)]">
                +{group.options.length - 8}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="border-t border-[var(--line)] bg-[var(--background)]/40 px-4 py-3 text-[0.65rem] text-[var(--muted)]">
          Sem opções — edite para adicionar.
        </div>
      )}

      <div className="flex items-center gap-1 border-t border-[var(--line)] p-2">
        <button
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[var(--brand-orange)] px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--brand-orange-dark)]"
          onClick={onEdit}
          type="button"
        >
          <EditIcon />
          Editar
        </button>
        <button
          className="rounded-lg border border-[var(--line)] px-2 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
          onClick={onToggleActive}
          type="button"
        >
          {group.isActive ? "Pausar" : "Ativar"}
        </button>
        <button
          className="rounded-lg border border-red-200 p-1.5 text-red-600 transition hover:bg-red-50"
          onClick={onDelete}
          title="Excluir"
          type="button"
        >
          <TrashIcon />
        </button>
      </div>
    </article>
  );
}
