import { getAdminCategories, getAdminMenuItems, getAdminOptionGroups } from "@/lib/services/menu-service";

export default async function DashboardCardapioPage() {
  const [categories, items, optionGroups] = await Promise.all([
    getAdminCategories(),
    getAdminMenuItems(),
    getAdminOptionGroups(),
  ]);

  return (
    <main className="panel rounded-[2rem] border-white/10 bg-white/7 p-6 text-white">
      <p className="eyebrow mb-3 text-white/60">Catalogo</p>
      <h1 className="text-3xl font-semibold tracking-tight">Cardapio</h1>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <article className="rounded-[1.5rem] border border-white/10 px-4 py-4">
          <p className="font-medium">Categorias</p>
          <p className="mt-2 text-sm text-white/64">
            {categories.length} categorias cadastradas
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 px-4 py-4">
          <p className="font-medium">Itens</p>
          <p className="mt-2 text-sm text-white/64">
            {items.length} itens configurados
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-white/10 px-4 py-4">
          <p className="font-medium">Adicionais</p>
          <p className="mt-2 text-sm text-white/64">
            {optionGroups.length} grupos configurados
          </p>
        </article>
      </div>
    </main>
  );
}
