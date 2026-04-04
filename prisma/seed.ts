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

async function seedCatalog() {
  const categoriesCount = await prisma.category.count();

  if (categoriesCount > 0) {
    return;
  }

  const [extras, drinks] = await Promise.all([
    prisma.optionGroup.create({
      data: {
        name: "Adicionais da casa",
        slug: "adicionais-da-casa",
        minSelections: 0,
        maxSelections: 3,
        sortOrder: 1,
        options: {
          create: [
            {
              name: "Cheddar",
              slug: "cheddar",
              priceDelta: 4,
              sortOrder: 1,
            },
            {
              name: "Bacon",
              slug: "bacon",
              priceDelta: 5,
              sortOrder: 2,
            },
          ],
        },
      },
      include: {
        options: true,
      },
    }),
    prisma.optionGroup.create({
      data: {
        name: "Tamanho do suco",
        slug: "tamanho-do-suco",
        minSelections: 1,
        maxSelections: 1,
        isRequired: true,
        sortOrder: 2,
        options: {
          create: [
            {
              name: "300ml",
              slug: "300ml",
              priceDelta: 0,
              isDefault: true,
              sortOrder: 1,
            },
            {
              name: "500ml",
              slug: "500ml",
              priceDelta: 3,
              sortOrder: 2,
            },
          ],
        },
      },
      include: {
        options: true,
      },
    }),
  ]);

  const lanches = await prisma.category.create({
    data: {
      name: "Lanches",
      slug: "lanches",
      sortOrder: 1,
    },
  });

  const bebidas = await prisma.category.create({
    data: {
      name: "Bebidas",
      slug: "bebidas",
      sortOrder: 2,
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: lanches.id,
      name: "Smash da casa",
      slug: "smash-da-casa",
      description: "Pao brioche, burger 160g, cheddar e maionese artesanal.",
      price: 24.9,
      isFeatured: true,
      sortOrder: 1,
      optionGroups: {
        create: [{ optionGroupId: extras.id, sortOrder: 1 }],
      },
    },
  });

  await prisma.menuItem.create({
    data: {
      categoryId: bebidas.id,
      name: "Suco de laranja",
      slug: "suco-de-laranja",
      description: "Suco natural batido na hora.",
      price: 9.9,
      sortOrder: 1,
      optionGroups: {
        create: [{ optionGroupId: drinks.id, sortOrder: 1 }],
      },
    },
  });

  await prisma.deliveryFeeRule.create({
    data: {
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
    },
  });
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
