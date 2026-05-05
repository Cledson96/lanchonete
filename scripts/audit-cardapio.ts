import "dotenv/config";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type SourceItem = {
  category: string;
  name: string;
  price?: number;
  notes?: string;
};

type DiffStatus =
  | "OK"
  | "FALTANDO_NO_BANCO"
  | "EXTRA_NO_BANCO"
  | "PRECO_DIVERGENTE"
  | "CATEGORIA_DIVERGENTE"
  | "OPCIONAL_DIVERGENTE";

type DiffRow = {
  status: DiffStatus;
  category: string;
  sourceName: string;
  dbName: string;
  sourcePrice: string;
  dbPrice: string;
  notes: string;
};

const sourceFiles = [
  "cardapio/2.jpeg",
  "cardapio/3.jpeg",
  "cardapio/4.jpeg",
  "cardapio/5.jpeg",
  "cardapio/6.jpeg",
  "cardapio/7.jpeg",
  "cardapio/8.jpeg",
  "cardapio/WhatsApp Image 2026-04-04 at 20.06.58.jpeg",
  "cardapio/WhatsApp Image 2026-04-13 at 08.03.35.jpeg",
  "cardapio/WhatsApp Image 2026-04-13 at 08.04.07.jpeg",
];

const sourceItems: SourceItem[] = [
  { category: "Lanches", name: "X-Burguer", price: 12 },
  { category: "Lanches", name: "X-Salada", price: 14 },
  { category: "Lanches", name: "X-Bacon", price: 17.5 },
  { category: "Lanches", name: "X-Frango", price: 17.5 },
  { category: "Lanches", name: "X-Egg", price: 17.5 },
  { category: "Lanches", name: "X-Calabresa", price: 17.5 },
  { category: "Lanches", name: "X-Tudo", price: 30 },
  { category: "Lanches", name: "X-No Prato", price: 35 },
  { category: "Lanches", name: "Misto Quente", price: 7 },
  { category: "Lanches", name: "Bauru", price: 12 },
  { category: "Lanches", name: "Omelete", price: 14 },
  { category: "Combo Lanches", name: "X-Salada + suco natural 300ml + fritas", price: 27 },
  { category: "Combo Lanches", name: "X-Egg + suco natural 300ml + fritas", price: 29 },
  { category: "Combo Lanches", name: "X-Bacon + suco natural 300ml + fritas", price: 29 },
  { category: "Combo Lanches", name: "X-Frango + suco natural 300ml + fritas", price: 29 },
  { category: "Combo Lanches", name: "X-Calabresa + suco natural 300ml + fritas", price: 29 },
  { category: "Lanches Artesanais", name: "Artesanal Tradicional Simples", price: 16 },
  { category: "Lanches Artesanais", name: "Tradicional", price: 18 },
  { category: "Lanches Artesanais", name: "Artesanal Bacon", price: 24 },
  { category: "Lanches Artesanais", name: "Artesanal Calabresa", price: 24 },
  { category: "Lanches Artesanais", name: "X-Alcatra", price: 28 },
  { category: "Lanches Artesanais", name: "Artesanal Duplo", price: 28 },
  { category: "Combos Artesanais", name: "Combo Artesanal Tradicional", price: 34 },
  { category: "Combos Artesanais", name: "Combo Artesanal Bacon", price: 40 },
  { category: "Combos Artesanais", name: "Combo Artesanal Calabresa", price: 40 },
  { category: "Combos Artesanais", name: "Combo Artesanal Duplo", price: 44 },
  { category: "Pastel Salgado", name: "Carne", price: 7 },
  { category: "Pastel Salgado", name: "Queijo", price: 7 },
  { category: "Pastel Salgado", name: "Pizza", price: 7 },
  { category: "Pastel Salgado", name: "Frango", price: 7 },
  { category: "Pastel Salgado", name: "Queijo e Presunto", price: 7 },
  { category: "Pastel Doce", name: "Chocolate com morango", price: 12 },
  { category: "Pastel Doce", name: "Chocolate branco c/ morango", price: 12 },
  { category: "Pastel Doce", name: "Banana c/ canela e leite condensado", price: 12 },
  { category: "Pastel Doce", name: "Prestigio", price: 12 },
  { category: "Pastel Doce", name: "Queijo com goiabada", price: 12 },
  { category: "Pastel Especial", name: "Carne com ovo", price: 12 },
  { category: "Pastel Especial", name: "Carne com queijo e milho", price: 12 },
  { category: "Pastel Especial", name: "Carne com queijo e ovo", price: 15 },
  { category: "Pastel Especial", name: "Frango com catupiry ou cheddar", price: 12 },
  { category: "Pastel Especial", name: "Frango com queijo", price: 12 },
  { category: "Pastel Especial", name: "Frango com queijo e ovo", price: 15 },
  { category: "Pastel Especial", name: "Especial", price: 30 },
  { category: "Tapioca Salgada", name: "Natural", price: 5 },
  { category: "Tapioca Salgada", name: "Pizza", price: 14 },
  { category: "Tapioca Salgada", name: "Frango", price: 14 },
  { category: "Tapioca Salgada", name: "Da Casa", price: 14 },
  { category: "Tapioca Salgada", name: "Italiana", price: 14 },
  { category: "Tapioca Salgada", name: "Calabresa com catupiry", price: 14 },
  { category: "Tapioca Salgada", name: "Carne moida com queijo", price: 14 },
  { category: "Tapioca Salgada", name: "Ovo com queijo", price: 14 },
  { category: "Tapioca Doce", name: "Baianinha", price: 14 },
  { category: "Tapioca Doce", name: "Uva com chocolate", price: 14 },
  { category: "Tapioca Doce", name: "Banana com canela", price: 14 },
  { category: "Tapioca Doce", name: "Prestigio", price: 14 },
  { category: "Tapioca Doce", name: "Sensacao", price: 14 },
  { category: "Tapioca Doce", name: "Ouro Branco", price: 14 },
  { category: "Tapioca Doce", name: "Ouro Branco com nutella", price: 17 },
  { category: "Tapioca Doce", name: "Sonho de Valsa", price: 14 },
  { category: "Tapioca Doce", name: "Sonho de Valsa com nutella", price: 17 },
  { category: "Tapioca Doce", name: "Romeu e Julieta", price: 14 },
  { category: "Tapioca Doce", name: "Chocolate com morango", price: 14 },
  { category: "Tapioca Doce", name: "Chocolate branco c/ morango", price: 14 },
  { category: "Salgados", name: "Coxinha pequena de frango", price: 6 },
  { category: "Salgados", name: "Risoles pequeno de carne", price: 6 },
  { category: "Salgados", name: "Risoles pequeno de queijo e presunto", price: 6 },
  { category: "Salgados", name: "Enroladinho de vina pequeno", price: 6.5 },
  { category: "Salgados", name: "Coxinha grande de frango com cheddar", price: 10.5 },
  { category: "Salgados", name: "Coxinha grande de frango com requeijao", price: 10.5 },
  { category: "Salgados", name: "Coxinha grande de frango", price: 9.5 },
  { category: "Salgados", name: "Risoles grande de carne", price: 9.5 },
  { category: "Salgados", name: "Risoles grande de queijo e presunto", price: 9.5 },
  { category: "Salgados", name: "Enroladinho de vina grande", price: 9.5 },
  { category: "Salgados", name: "Espeto de frango", price: 7.5 },
  { category: "Salgados", name: "Assado de vina com cheddar", price: 10 },
  { category: "Salgados", name: "Assado de vina com catupiry", price: 10 },
  { category: "Salgados", name: "Assado de Hamburgao com cheddar", price: 11 },
  { category: "Salgados", name: "Assado de Hamburgao com catupiry", price: 11 },
  { category: "Salgados", name: "Assado de carne moida", price: 10 },
  { category: "Salgados", name: "Assado de queijo e presunto", price: 10 },
  { category: "Salgados", name: "Assado de frango com catupiry", price: 11 },
  { category: "Salgados", name: "Assado de frango com cheddar", price: 11 },
  { category: "Acai", name: "Acai 240ml", price: 13 },
  { category: "Acai", name: "Acai 360ml", price: 18 },
  { category: "Acai", name: "Acai 500ml", price: 22 },
  { category: "Acai", name: "Barca pequena", notes: "Aparece no cardapio fisico; preco ilegivel na foto." },
  { category: "Acai", name: "Barca grande", notes: "Aparece no cardapio fisico; preco ilegivel na foto." },
  { category: "Almoço", name: "Contrafilé", price: 32 },
  { category: "Almoço", name: "Bife à parmegiana", price: 18 },
  { category: "Almoço", name: "Bife à cavalo", price: 18 },
  { category: "Almoço", name: "Frango ao molho", price: 15 },
  { category: "Almoço", name: "Frango à milanesa", price: 15 },
  { category: "Almoço", name: "Carne de panela", price: 15 },
  { category: "Almoço", name: "Strogonoff", price: 15 },
  { category: "Almoço", name: "Coxa e sobrecoxa assada", price: 15 },
  { category: "Almoço", name: "Feijoada", price: 15 },
];

const sourceOptionGroups = [
  {
    name: "Complementos do acai",
    options: [
      "Aveia",
      "Granola",
      "Sucrilhos",
      "Amendoim",
      "Leite em po",
      "Pacoca",
      "Doce de leite",
      "Leite condensado",
      "Nutella",
      "Chocolate branco",
      "Confete",
      "Uva",
      "Morango",
      "Banana",
    ],
  },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function itemKey(category: string, name: string) {
  return `${normalize(category)}::${normalize(name)}`;
}

function price(value?: number | { toString(): string } | null) {
  if (value === undefined || value === null) return "";
  return Number(value).toFixed(2);
}

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_REMOTE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL ou DATABASE_REMOTE_URL precisa estar definido.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const outputDir = "docs";
const markdownPath = path.join(outputDir, "cardapio-audit.md");
const csvPath = path.join(outputDir, "cardapio-audit.csv");

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      name: true,
      slug: true,
      isActive: true,
      menuItems: {
        orderBy: { sortOrder: "asc" },
        select: {
          name: true,
          slug: true,
          price: true,
          imageUrl: true,
          isActive: true,
          availableWeekdays: true,
        },
      },
    },
  });

  const optionGroups = await prisma.optionGroup.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      name: true,
      minSelections: true,
      maxSelections: true,
      isRequired: true,
      options: {
        orderBy: { sortOrder: "asc" },
        select: { name: true, priceDelta: true },
      },
    },
  });

  const dbItems = categories.flatMap((category) =>
    category.menuItems.map((item) => ({ ...item, category: category.name })),
  );

  const dbByCategoryAndName = new Map(dbItems.map((item) => [itemKey(item.category, item.name), item]));
  const dbByName = new Map(dbItems.map((item) => [normalize(item.name), item]));
  const sourceByCategoryAndName = new Map(sourceItems.map((item) => [itemKey(item.category, item.name), item]));

  const rows: DiffRow[] = [];

  for (const source of sourceItems) {
    const db =
      dbByCategoryAndName.get(itemKey(source.category, source.name)) ||
      dbByName.get(normalize(source.name));
    if (!db) {
      rows.push({
        status: "FALTANDO_NO_BANCO",
        category: source.category,
        sourceName: source.name,
        dbName: "",
        sourcePrice: price(source.price),
        dbPrice: "",
        notes: source.notes || "",
      });
      continue;
    }

    const categoryMismatch = normalize(db.category) !== normalize(source.category);
    const sourcePrice = price(source.price);
    const dbPrice = price(db.price);
    const priceMismatch = Boolean(sourcePrice) && sourcePrice !== dbPrice;

    rows.push({
      status: categoryMismatch
        ? "CATEGORIA_DIVERGENTE"
        : priceMismatch
          ? "PRECO_DIVERGENTE"
          : "OK",
      category: source.category,
      sourceName: source.name,
      dbName: db.name,
      sourcePrice,
      dbPrice,
      notes: [source.notes, categoryMismatch ? `Categoria no banco: ${db.category}` : ""]
        .filter(Boolean)
        .join(" "),
    });
  }

  for (const db of dbItems) {
    if (sourceByCategoryAndName.has(itemKey(db.category, db.name))) continue;
    rows.push({
      status: "EXTRA_NO_BANCO",
      category: db.category,
      sourceName: "",
      dbName: db.name,
      sourcePrice: "",
      dbPrice: price(db.price),
      notes: "Nao identificado na transcricao das fotos.",
    });
  }

  for (const sourceGroup of sourceOptionGroups) {
    const dbGroup = optionGroups.find((group) => normalize(group.name) === normalize(sourceGroup.name));
    if (!dbGroup) {
      rows.push({
        status: "OPCIONAL_DIVERGENTE",
        category: "Opcionais",
        sourceName: sourceGroup.name,
        dbName: "",
        sourcePrice: "",
        dbPrice: "",
        notes: "Grupo de opcionais faltando no banco.",
      });
      continue;
    }

    const missingOptions = sourceGroup.options.filter(
      (option) => !dbGroup.options.some((dbOption) => normalize(dbOption.name) === normalize(option)),
    );
    const extraOptions = dbGroup.options.filter(
      (dbOption) => !sourceGroup.options.some((option) => normalize(option) === normalize(dbOption.name)),
    );

    if (missingOptions.length || extraOptions.length) {
      rows.push({
        status: "OPCIONAL_DIVERGENTE",
        category: "Opcionais",
        sourceName: sourceGroup.name,
        dbName: dbGroup.name,
        sourcePrice: "",
        dbPrice: "",
        notes: `Faltando: ${missingOptions.join(", ") || "nenhum"}. Extras: ${
          extraOptions.map((option) => option.name).join(", ") || "nenhum"
        }.`,
      });
    }
  }

  const statusCounts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  const itemsWithImagesBefore = dbItems.filter((item) => item.imageUrl).length;
  const imageCleanupEnabled = process.argv.includes("--cleanup-images");
  let imageCleanupResult = "";

  if (imageCleanupEnabled) {
    const result = await prisma.menuItem.updateMany({
      where: { imageUrl: { not: null } },
      data: { imageUrl: null },
    });
    const itemsWithImagesAfter = await prisma.menuItem.count({
      where: { imageUrl: { not: null } },
    });
    imageCleanupResult = [
      "",
      "## Limpeza de imagens",
      "",
      `- Produtos com imagem antes: ${itemsWithImagesBefore}`,
      `- Produtos atualizados para imagem default: ${result.count}`,
      `- Produtos com imagem depois: ${itemsWithImagesAfter}`,
    ].join("\n");
  }

  const markdown = [
  "# Auditoria do Cardapio",
  "",
  `Gerado em: ${new Date().toISOString()}`,
  "",
  "## Fontes analisadas",
  "",
  ...sourceFiles.map((file) => `- ${file}`),
  "",
  "Arquivos `Zone.Identifier` foram ignorados.",
  "",
  "## Snapshot do banco",
  "",
  `- Categorias: ${categories.length}`,
  `- Produtos: ${dbItems.length}`,
  `- Produtos com imagem antes da limpeza: ${itemsWithImagesBefore}`,
  `- Grupos de opcionais: ${optionGroups.length}`,
  `- Opcoes cadastradas: ${optionGroups.reduce((sum, group) => sum + group.options.length, 0)}`,
  "",
  "## Resumo das diferencas",
  "",
  ...Object.entries(statusCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => `- ${status}: ${count}`),
  "",
  "## Diferencas",
  "",
  "| Status | Categoria | Cardapio fisico | Banco | Preco fisico | Preco banco | Observacoes |",
  "| --- | --- | --- | --- | ---: | ---: | --- |",
  ...rows.map(
    (row) =>
      `| ${row.status} | ${row.category} | ${row.sourceName} | ${row.dbName} | ${row.sourcePrice} | ${row.dbPrice} | ${row.notes} |`,
  ),
  "",
  "## Opcionais cadastrados no banco",
  "",
  ...optionGroups.flatMap((group) => [
    `### ${group.name}`,
    "",
    `Min: ${group.minSelections}; Max: ${group.maxSelections ?? "sem limite"}; Obrigatorio: ${group.isRequired ? "sim" : "nao"}`,
    "",
    ...group.options.map((option) => `- ${option.name}: +${price(option.priceDelta)}`),
    "",
  ]),
  imageCleanupResult,
  "",
  ].join("\n");

  const csv = [
    ["status", "category", "sourceName", "dbName", "sourcePrice", "dbPrice", "notes"]
      .map(csvEscape)
      .join(","),
    ...rows.map((row) =>
      [row.status, row.category, row.sourceName, row.dbName, row.sourcePrice, row.dbPrice, row.notes]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n");

  await writeFile(markdownPath, markdown);
  await writeFile(csvPath, csv);

  console.log(
    JSON.stringify(
      {
        markdownPath,
        csvPath,
        itemCount: dbItems.length,
        itemsWithImagesBefore,
        cleanupImages: imageCleanupEnabled,
        statusCounts,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

void main();
