import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.DATABASE_REMOTE_URL;
}

const connectionString = getDatabaseUrl();

if (!connectionString) {
  throw new Error("DATABASE_URL ou DATABASE_REMOTE_URL precisa estar definido.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});

type OptionSeed = {
  name: string;
  slug: string;
  sortOrder: number;
};

type OptionGroupSeed = {
  name: string;
  slug: string;
  description?: string;
  minSelections: number;
  maxSelections?: number;
  isRequired?: boolean;
  sortOrder: number;
  options: OptionSeed[];
};

type MenuItemSeed = {
  name: string;
  slug: string;
  description?: string;
  price: number;
  sortOrder: number;
  isFeatured?: boolean;
  optionGroupSlugs?: string[];
};

type CategorySeed = {
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  items: MenuItemSeed[];
};

const optionGroups: OptionGroupSeed[] = [
  {
    name: "Complementos do acai",
    slug: "complementos-do-acai",
    description: "Escolha ate 3 adicionais para os copos de acai.",
    minSelections: 0,
    maxSelections: 3,
    sortOrder: 1,
    options: [
      { name: "Aveia", slug: "aveia", sortOrder: 1 },
      { name: "Granola", slug: "granola", sortOrder: 2 },
      { name: "Sucrilhos", slug: "sucrilhos", sortOrder: 3 },
      { name: "Amendoim", slug: "amendoim", sortOrder: 4 },
      { name: "Leite em po", slug: "leite-em-po", sortOrder: 5 },
      { name: "Pacoca", slug: "pacoca", sortOrder: 6 },
      { name: "Doce de leite", slug: "doce-de-leite", sortOrder: 7 },
      { name: "Leite condensado", slug: "leite-condensado", sortOrder: 8 },
      { name: "Nutella", slug: "nutella", sortOrder: 9 },
      { name: "Chocolate branco", slug: "chocolate-branco", sortOrder: 10 },
      { name: "Confete", slug: "confete", sortOrder: 11 },
      { name: "Uva", slug: "uva", sortOrder: 12 },
      { name: "Morango", slug: "morango", sortOrder: 13 },
      { name: "Banana", slug: "banana", sortOrder: 14 },
    ],
  },
];

const categories: CategorySeed[] = [
  {
    name: "Lanches",
    slug: "lanches",
    description: "Lanches tradicionais servidos no pao ou em versoes especiais da casa.",
    sortOrder: 1,
    items: [
      { name: "X-Burguer", slug: "x-burguer", price: 12, sortOrder: 1, isFeatured: true },
      { name: "X-Salada", slug: "x-salada", price: 14, sortOrder: 2 },
      { name: "X-Bacon", slug: "x-bacon", price: 17.5, sortOrder: 3 },
      { name: "X-Frango", slug: "x-frango", price: 17.5, sortOrder: 4 },
      { name: "X-Egg", slug: "x-egg", price: 17.5, sortOrder: 5 },
      { name: "X-Calabresa", slug: "x-calabresa", price: 17.5, sortOrder: 6 },
      { name: "X-Tudo", slug: "x-tudo", price: 30, sortOrder: 7 },
      { name: "X-No Prato", slug: "x-no-prato", price: 35, sortOrder: 8 },
      { name: "Misto Quente", slug: "misto-quente", price: 7, sortOrder: 9 },
      { name: "Bauru", slug: "bauru", price: 12, sortOrder: 10 },
      { name: "Omelete", slug: "omelete", price: 14, sortOrder: 11 },
    ],
  },
  {
    name: "Combo Lanches",
    slug: "combo-lanches",
    description: "Combos com fritas de 200g aproximadamente e bebida da casa.",
    sortOrder: 2,
    items: [
      {
        name: "X-Salada + suco natural 300ml + fritas",
        slug: "combo-x-salada",
        description: "Combo com fritas de 200g aproximadamente.",
        price: 27,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "X-Egg + suco natural 300ml + fritas",
        slug: "combo-x-egg",
        description: "Combo com fritas de 200g aproximadamente.",
        price: 29,
        sortOrder: 2,
      },
      {
        name: "X-Bacon + suco natural 300ml + fritas",
        slug: "combo-x-bacon",
        description: "Combo com fritas de 200g aproximadamente.",
        price: 29,
        sortOrder: 3,
      },
      {
        name: "X-Frango + suco natural 300ml + fritas",
        slug: "combo-x-frango",
        description: "Combo com fritas de 200g aproximadamente.",
        price: 29,
        sortOrder: 4,
      },
      {
        name: "X-Calabresa + suco natural 300ml + fritas",
        slug: "combo-x-calabresa",
        description: "Combo com fritas de 200g aproximadamente.",
        price: 29,
        sortOrder: 5,
      },
    ],
  },
  {
    name: "Lanches Artesanais",
    slug: "lanches-artesanais",
    description: "Burgers artesanais com receitas da casa e molho especial.",
    sortOrder: 3,
    items: [
      {
        name: "Artesanal Tradicional Simples",
        slug: "artesanal-tradicional-simples",
        description: "Pao, manteiga, maionese caseira, hamburguer artesanal bovino 150g, cheddar e molho Billy & Jack.",
        price: 16,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Tradicional",
        slug: "tradicional-artesanal",
        description: "Pao, manteiga, maionese caseira, alface, tomate, cebola caramelizada, hamburguer artesanal bovino 150g, cheddar e molho Billy & Jack.",
        price: 18,
        sortOrder: 2,
      },
      {
        name: "Artesanal Bacon",
        slug: "artesanal-bacon",
        description: "Pao, manteiga, maionese caseira, alface, tomate, cebola caramelizada, hamburguer artesanal bovino 150g, bacon, cheddar e molho Billy & Jack.",
        price: 24,
        sortOrder: 3,
      },
      {
        name: "Artesanal Calabresa",
        slug: "artesanal-calabresa",
        description: "Pao, manteiga, maionese caseira, alface, tomate, cebola caramelizada, hamburguer artesanal bovino 150g, calabresa, cheddar e molho Billy & Jack.",
        price: 24,
        sortOrder: 4,
      },
      {
        name: "X-Alcatra",
        slug: "x-alcatra",
        description: "Pao, manteiga, maionese caseira, alface, tomate, cebola caramelizada, 100g de alcatra em pedacos e molho Billy & Jack.",
        price: 28,
        sortOrder: 5,
      },
      {
        name: "Artesanal Duplo",
        slug: "artesanal-duplo",
        description: "Pao, manteiga, maionese caseira, alface, tomate, cebola caramelizada, 2 hamburgueres artesanais bovinos 150g, cheddar e molho Billy & Jack.",
        price: 28,
        sortOrder: 6,
      },
    ],
  },
  {
    name: "Combos Artesanais",
    slug: "combos-artesanais",
    description: "Burger artesanal com batata frita de 150g e refrigerante lata 350ml.",
    sortOrder: 4,
    items: [
      {
        name: "Combo Artesanal Tradicional",
        slug: "combo-artesanal-tradicional",
        description: "Burger artesanal tradicional, porcao de batata frita 150g e refrigerante lata 350ml.",
        price: 34,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Combo Artesanal Bacon",
        slug: "combo-artesanal-bacon",
        description: "Burger artesanal bacon, porcao de batata frita 150g e refrigerante lata 350ml.",
        price: 40,
        sortOrder: 2,
      },
      {
        name: "Combo Artesanal Calabresa",
        slug: "combo-artesanal-calabresa",
        description: "Burger artesanal calabresa, porcao de batata frita 150g e refrigerante lata 350ml.",
        price: 40,
        sortOrder: 3,
      },
      {
        name: "Combo Artesanal Duplo",
        slug: "combo-artesanal-duplo",
        description: "Burger artesanal duplo, porcao de batata frita 150g e refrigerante lata 350ml.",
        price: 44,
        sortOrder: 4,
      },
    ],
  },
  {
    name: "Pastel Salgado",
    slug: "pastel-salgado",
    description: "Pasteis salgados feitos na hora para lanche rapido ou para dividir.",
    sortOrder: 5,
    items: [
      { name: "Carne", slug: "pastel-carne", price: 7, sortOrder: 1, isFeatured: true },
      { name: "Queijo", slug: "pastel-queijo", price: 7, sortOrder: 2 },
      { name: "Pizza", slug: "pastel-pizza", price: 7, sortOrder: 3 },
      { name: "Frango", slug: "pastel-frango", price: 7, sortOrder: 4 },
      { name: "Queijo e Presunto", slug: "pastel-queijo-presunto", price: 7, sortOrder: 5 },
    ],
  },
  {
    name: "Pastel Doce",
    slug: "pastel-doce",
    description: "Sabores doces para fechar o pedido com sobremesa quentinha.",
    sortOrder: 6,
    items: [
      {
        name: "Chocolate com morango",
        slug: "pastel-doce-chocolate-morango",
        price: 12,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Chocolate branco c/ morango",
        slug: "pastel-doce-chocolate-branco-morango",
        price: 12,
        sortOrder: 2,
      },
      {
        name: "Banana c/ canela e leite condensado",
        slug: "pastel-doce-banana-canela-leite-condensado",
        price: 12,
        sortOrder: 3,
      },
      { name: "Prestigio", slug: "pastel-doce-prestigio", price: 12, sortOrder: 4 },
      { name: "Queijo com goiabada", slug: "pastel-doce-romeu", price: 12, sortOrder: 5 },
    ],
  },
  {
    name: "Pastel Especial",
    slug: "pastel-especial",
    description: "Versoes especiais com recheios reforcados.",
    sortOrder: 7,
    items: [
      {
        name: "Carne com ovo",
        slug: "pastel-especial-carne-ovo",
        price: 12,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Carne com queijo e milho",
        slug: "pastel-especial-carne-queijo-milho",
        price: 12,
        sortOrder: 2,
      },
      {
        name: "Carne com queijo e ovo",
        slug: "pastel-especial-carne-queijo-ovo",
        price: 15,
        sortOrder: 3,
      },
      {
        name: "Frango com catupiry ou cheddar",
        slug: "pastel-especial-frango-catupiry-cheddar",
        price: 12,
        sortOrder: 4,
      },
      {
        name: "Frango com queijo",
        slug: "pastel-especial-frango-queijo",
        price: 12,
        sortOrder: 5,
      },
      {
        name: "Frango com queijo e ovo",
        slug: "pastel-especial-frango-queijo-ovo",
        price: 15,
        sortOrder: 6,
      },
      {
        name: "Especial",
        slug: "pastel-especial-da-casa",
        description: "Frango, carne moida, calabresa, bacon, queijo, presunto, oregano, milho, catupiry e cheddar.",
        price: 30,
        sortOrder: 7,
      },
    ],
  },
  {
    name: "Tapioca Salgada",
    slug: "tapioca-salgada",
    description: "Tapiocas salgadas com recheios classicos e sabores da casa.",
    sortOrder: 8,
    items: [
      {
        name: "Natural",
        slug: "tapioca-natural",
        description: "Manteiga.",
        price: 5,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Pizza",
        slug: "tapioca-pizza",
        description: "Queijo, presunto, oregano e tomate.",
        price: 14,
        sortOrder: 2,
      },
      {
        name: "Frango",
        slug: "tapioca-frango",
        description: "Tomate, frango e catupiry.",
        price: 14,
        sortOrder: 3,
      },
      {
        name: "Da Casa",
        slug: "tapioca-da-casa",
        description: "Queijo e presunto.",
        price: 14,
        sortOrder: 4,
      },
      {
        name: "Italiana",
        slug: "tapioca-italiana",
        description: "Queijo.",
        price: 14,
        sortOrder: 5,
      },
      {
        name: "Calabresa com catupiry",
        slug: "tapioca-calabresa-catupiry",
        price: 14,
        sortOrder: 6,
      },
      {
        name: "Carne moida com queijo",
        slug: "tapioca-carne-moida-queijo",
        price: 14,
        sortOrder: 7,
      },
      {
        name: "Ovo com queijo",
        slug: "tapioca-ovo-queijo",
        price: 14,
        sortOrder: 8,
      },
    ],
  },
  {
    name: "Tapioca Doce",
    slug: "tapioca-doce",
    description: "Tapiocas doces para sobremesa ou para matar a vontade de acucar.",
    sortOrder: 9,
    items: [
      { name: "Baianinha", slug: "tapioca-baianinha", price: 14, sortOrder: 1, isFeatured: true },
      { name: "Uva com chocolate", slug: "tapioca-uva-chocolate", price: 14, sortOrder: 2 },
      { name: "Banana com canela", slug: "tapioca-banana-canela", price: 14, sortOrder: 3 },
      { name: "Prestigio", slug: "tapioca-prestigio", price: 14, sortOrder: 4 },
      { name: "Sensacao", slug: "tapioca-sensacao", price: 14, sortOrder: 5 },
      { name: "Ouro Branco", slug: "tapioca-ouro-branco", price: 14, sortOrder: 6 },
      {
        name: "Ouro Branco com nutella",
        slug: "tapioca-ouro-branco-nutella",
        price: 17,
        sortOrder: 7,
      },
      { name: "Sonho de Valsa", slug: "tapioca-sonho-de-valsa", price: 14, sortOrder: 8 },
      {
        name: "Sonho de Valsa com nutella",
        slug: "tapioca-sonho-de-valsa-nutella",
        price: 17,
        sortOrder: 9,
      },
      { name: "Romeu e Julieta", slug: "tapioca-romeu-julieta", price: 14, sortOrder: 10 },
      {
        name: "Chocolate com morango",
        slug: "tapioca-chocolate-morango",
        price: 14,
        sortOrder: 11,
      },
      {
        name: "Chocolate branco c/ morango",
        slug: "tapioca-chocolate-branco-morango",
        price: 14,
        sortOrder: 12,
      },
    ],
  },
  {
    name: "Acai",
    slug: "acai",
    description: "Copos de acai com adicionais inclusos para montar do seu jeito.",
    sortOrder: 10,
    items: [
      {
        name: "Acai 240ml",
        slug: "acai-240ml",
        description: "Copo com ate 3 adicionais inclusos.",
        price: 13,
        sortOrder: 1,
        isFeatured: true,
        optionGroupSlugs: ["complementos-do-acai"],
      },
      {
        name: "Acai 360ml",
        slug: "acai-360ml",
        description: "Copo com ate 3 adicionais inclusos.",
        price: 18,
        sortOrder: 2,
        optionGroupSlugs: ["complementos-do-acai"],
      },
      {
        name: "Acai 500ml",
        slug: "acai-500ml",
        description: "Copo com ate 3 adicionais inclusos.",
        price: 22,
        sortOrder: 3,
        optionGroupSlugs: ["complementos-do-acai"],
      },
    ],
  },
];

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const phone = process.env.ADMIN_PHONE;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !phone || !password) {
    console.warn(
      "[seed] ADMIN_EMAIL, ADMIN_PHONE ou ADMIN_PASSWORD nao definidos. Seed do admin ignorado.",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: UserRole.admin,
      customerProfile: {
        create: {
          fullName: "Administrador",
          phone,
          whatsappOptIn: false,
        },
      },
    },
    update: {
      passwordHash,
      role: UserRole.admin,
      isActive: true,
    },
  });
}

async function syncOptionGroups() {
  await prisma.optionItem.updateMany({
    data: { isActive: false },
  });

  await prisma.optionGroup.updateMany({
    data: { isActive: false },
  });

  const optionGroupIds = new Map<string, string>();

  for (const group of optionGroups) {
    const savedGroup = await prisma.optionGroup.upsert({
      where: { slug: group.slug },
      create: {
        name: group.name,
        slug: group.slug,
        description: group.description,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        isRequired: group.isRequired ?? false,
        sortOrder: group.sortOrder,
        isActive: true,
      },
      update: {
        name: group.name,
        description: group.description,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        isRequired: group.isRequired ?? false,
        sortOrder: group.sortOrder,
        isActive: true,
      },
    });

    optionGroupIds.set(group.slug, savedGroup.id);

    for (const option of group.options) {
      await prisma.optionItem.upsert({
        where: {
          optionGroupId_slug: {
            optionGroupId: savedGroup.id,
            slug: option.slug,
          },
        },
        create: {
          optionGroupId: savedGroup.id,
          name: option.name,
          slug: option.slug,
          sortOrder: option.sortOrder,
          priceDelta: 0,
          isDefault: false,
          isActive: true,
        },
        update: {
          name: option.name,
          sortOrder: option.sortOrder,
          priceDelta: 0,
          isDefault: false,
          isActive: true,
        },
      });
    }
  }

  return optionGroupIds;
}

async function syncCategoriesAndItems(optionGroupIds: Map<string, string>) {
  await prisma.menuItem.updateMany({
    data: { isActive: false },
  });

  await prisma.category.updateMany({
    data: { isActive: false },
  });

  for (const category of categories) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });

    for (const item of category.items) {
      const savedItem = await prisma.menuItem.upsert({
        where: { slug: item.slug },
        create: {
          categoryId: savedCategory.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          price: item.price,
          sortOrder: item.sortOrder,
          isFeatured: item.isFeatured ?? false,
          isActive: true,
        },
        update: {
          categoryId: savedCategory.id,
          name: item.name,
          description: item.description,
          price: item.price,
          sortOrder: item.sortOrder,
          isFeatured: item.isFeatured ?? false,
          isActive: true,
        },
      });

      await prisma.menuItemOptionGroup.deleteMany({
        where: { menuItemId: savedItem.id },
      });

      if (item.optionGroupSlugs?.length) {
        await prisma.menuItemOptionGroup.createMany({
          data: item.optionGroupSlugs.map((groupSlug, index) => {
            const optionGroupId = optionGroupIds.get(groupSlug);

            if (!optionGroupId) {
              throw new Error(`Option group nao encontrado para slug ${groupSlug}.`);
            }

            return {
              menuItemId: savedItem.id,
              optionGroupId,
              sortOrder: index + 1,
            };
          }),
        });
      }
    }
  }
}

async function seedDeliveryFeeRules() {
  await prisma.deliveryFeeRule.updateMany({
    data: { isActive: false },
  });

  await prisma.deliveryFeeRule.upsert({
    where: {
      id: "cm-default-centro-fee",
    },
    create: {
      id: "cm-default-centro-fee",
      label: "Centro",
      neighborhood: "Centro",
      city: "Sao Paulo",
      state: "SP",
      feeAmount: 8,
      minimumOrderAmount: 20,
      freeAboveAmount: 60,
      estimatedMinMinutes: 20,
      estimatedMaxMinutes: 40,
      sortOrder: 1,
      isActive: true,
    },
    update: {
      label: "Centro",
      neighborhood: "Centro",
      city: "Sao Paulo",
      state: "SP",
      feeAmount: 8,
      minimumOrderAmount: 20,
      freeAboveAmount: 60,
      estimatedMinMinutes: 20,
      estimatedMaxMinutes: 40,
      sortOrder: 1,
      isActive: true,
    },
  });
}

async function seedCatalog() {
  const optionGroupIds = await syncOptionGroups();
  await syncCategoriesAndItems(optionGroupIds);
  await seedDeliveryFeeRules();
}

async function main() {
  await seedAdmin();
  await seedCatalog();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
