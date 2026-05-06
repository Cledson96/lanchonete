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

const businessWeekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type OptionSeed = {
  name: string;
  slug: string;
  sortOrder: number;
  priceDelta?: number;
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
  imageUrl?: string | null;
  price: number;
  sortOrder: number;
  isFeatured?: boolean;
  availableWeekdays?: string[];
  optionGroupSlugs?: string[];
  ingredientSlugs?: string[];
};

type CategorySeed = {
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  availableFrom?: string;
  availableUntil?: string;
  items: MenuItemSeed[];
};

type IngredientSeed = {
  name: string;
  slug: string;
  sortOrder: number;
  patterns?: string[];
};

const menuImages = {
  classicBurger: null,
  comboBurgerFries: null,
  gourmetBurger: null,
  chickenBurger: null,
  mistoBauru: null,
  omelete: null,
  pastelSalgado: null,
  tapiocaSalgada: null,
  doceCrepe: null,
  acai: null,
} as const;

const ingredients: IngredientSeed[] = [
  { name: "Pão", slug: "pao", sortOrder: 1, patterns: ["pao,"] },
  { name: "Pão de forma", slug: "pao-de-forma", sortOrder: 2, patterns: ["pao de forma"] },
  { name: "Pão de brioche", slug: "pao-de-brioche", sortOrder: 3, patterns: ["pao de brioche"] },
  { name: "Hambúrguer bovino", slug: "hamburguer-bovino", sortOrder: 4, patterns: ["hamburguer bovino"] },
  { name: "Hambúrguer artesanal bovino", slug: "hamburguer-artesanal-bovino", sortOrder: 5, patterns: ["hamburguer artesanal bovino", "hamburgueres artesanais bovinos"] },
  { name: "Filé de frango", slug: "file-de-frango", sortOrder: 6, patterns: ["file de frango", "filé de frango"] },
  { name: "Frango desfiado", slug: "frango-desfiado", sortOrder: 7, patterns: ["frango desfiado", "frango,", "frango e", "frango."] },
  { name: "Alcatra", slug: "alcatra", sortOrder: 8, patterns: ["alcatra"] },
  { name: "Queijo", slug: "queijo", sortOrder: 9, patterns: ["queijo"] },
  { name: "Cheddar", slug: "cheddar", sortOrder: 10, patterns: ["cheddar"] },
  { name: "Presunto", slug: "presunto", sortOrder: 11, patterns: ["presunto"] },
  { name: "Bacon", slug: "bacon", sortOrder: 12, patterns: ["bacon"] },
  { name: "Ovo", slug: "ovo", sortOrder: 13, patterns: ["ovo", "ovos"] },
  { name: "Calabresa", slug: "calabresa", sortOrder: 14, patterns: ["calabresa"] },
  { name: "Alface", slug: "alface", sortOrder: 15, patterns: ["alface"] },
  { name: "Tomate", slug: "tomate", sortOrder: 16, patterns: ["tomate"] },
  { name: "Milho", slug: "milho", sortOrder: 17, patterns: ["milho"] },
  { name: "Maionese da casa", slug: "maionese-da-casa", sortOrder: 18, patterns: ["maionese da casa", "maionese caseira"] },
  { name: "Manteiga", slug: "manteiga", sortOrder: 19, patterns: ["manteiga"] },
  { name: "Cebola caramelizada", slug: "cebola-caramelizada", sortOrder: 20, patterns: ["cebola caramelizada"] },
  { name: "Molho Billy & Jack", slug: "molho-billy-jack", sortOrder: 21, patterns: ["molho billy & jack"] },
  { name: "Orégano", slug: "oregano", sortOrder: 22, patterns: ["oregano"] },
  { name: "Cheiro-verde", slug: "cheiro-verde", sortOrder: 23, patterns: ["cheiro-verde"] },
  { name: "Massa de pastel", slug: "massa-de-pastel", sortOrder: 24, patterns: ["massa crocante", "pastel doce com"] },
  { name: "Carne moída", slug: "carne-moida", sortOrder: 25, patterns: ["carne moida"] },
  { name: "Catupiry", slug: "catupiry", sortOrder: 26, patterns: ["catupiry"] },
  { name: "Chocolate", slug: "chocolate", sortOrder: 27, patterns: ["chocolate e", "chocolate com", "com chocolate.", "e chocolate."] },
  { name: "Chocolate branco", slug: "chocolate-branco", sortOrder: 28, patterns: ["chocolate branco"] },
  { name: "Morango", slug: "morango", sortOrder: 29, patterns: ["morango"] },
  { name: "Banana", slug: "banana", sortOrder: 30, patterns: ["banana"] },
  { name: "Canela", slug: "canela", sortOrder: 31, patterns: ["canela"] },
  { name: "Leite condensado", slug: "leite-condensado", sortOrder: 32, patterns: ["leite condensado"] },
  { name: "Coco", slug: "coco", sortOrder: 33, patterns: ["coco"] },
  { name: "Goiabada", slug: "goiabada", sortOrder: 34, patterns: ["goiabada"] },
  { name: "Massa de tapioca", slug: "massa-de-tapioca", sortOrder: 35, patterns: [] },
  { name: "Uva", slug: "uva", sortOrder: 36, patterns: ["uva"] },
  { name: "Nutella", slug: "nutella", sortOrder: 37, patterns: ["nutella"] },
  { name: "Bombom Ouro Branco", slug: "bombom-ouro-branco", sortOrder: 38, patterns: ["bombom ouro branco"] },
  { name: "Bombom Sonho de Valsa", slug: "bombom-sonho-de-valsa", sortOrder: 39, patterns: ["bombom sonho de valsa"] },
  { name: "Requeijão", slug: "requeijao", sortOrder: 40, patterns: ["requeijao"] },
  { name: "Vina", slug: "vina", sortOrder: 41, patterns: ["vina"] },
  { name: "Arroz", slug: "arroz", sortOrder: 42, patterns: ["arroz"] },
  { name: "Feijão", slug: "feijao", sortOrder: 43, patterns: ["feijao"] },
  { name: "Macarrão", slug: "macarrao", sortOrder: 44, patterns: ["macarrao"] },
  { name: "Salada", slug: "salada", sortOrder: 45, patterns: ["salada"] },
  { name: "Batata frita", slug: "batata-frita", sortOrder: 46, patterns: ["batata frita"] },
  { name: "Contrafilé", slug: "contrafile", sortOrder: 47, patterns: ["contrafile"] },
  { name: "Bife", slug: "bife", sortOrder: 48, patterns: ["bife"] },
  { name: "Molho", slug: "molho", sortOrder: 49, patterns: ["servido com molho"] },
  { name: "Frango ao molho", slug: "frango-ao-molho", sortOrder: 50, patterns: ["frango ao molho"] },
  { name: "Frango à milanesa", slug: "frango-a-milanesa", sortOrder: 51, patterns: ["frango a milanesa", "frango à milanesa"] },
  { name: "Carne de panela", slug: "carne-de-panela", sortOrder: 52, patterns: ["carne de panela"] },
  { name: "Strogonoff", slug: "strogonoff", sortOrder: 53, patterns: ["strogonoff"] },
  { name: "Coxa e sobrecoxa", slug: "coxa-sobrecoxa", sortOrder: 54, patterns: ["coxa e sobrecoxa"] },
  { name: "Vinagrete", slug: "vinagrete", sortOrder: 55, patterns: ["vinagrete"] },
  { name: "Bisteca", slug: "bisteca", sortOrder: 56, patterns: ["bisteca"] },
  { name: "Filé de frango grelhado", slug: "file-de-frango-grelhado", sortOrder: 57, patterns: ["file de frango grelhado", "filé de frango grelhado"] },
];

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
  {
    name: "Adicionais do almoço",
    slug: "adicionais-do-almoco",
    description: "Adicionais para marmitas e pratos especiais do almoço.",
    minSelections: 0,
    sortOrder: 2,
    options: [
      { name: "Arroz", slug: "arroz", sortOrder: 1, priceDelta: 7 },
      { name: "Feijão", slug: "feijao", sortOrder: 2, priceDelta: 7 },
      { name: "Macarrão", slug: "macarrao", sortOrder: 3, priceDelta: 7 },
      { name: "Bife", slug: "bife", sortOrder: 4, priceDelta: 10 },
      { name: "Bisteca", slug: "bisteca", sortOrder: 5, priceDelta: 8 },
      { name: "Frango grelhado", slug: "frango-grelhado", sortOrder: 6, priceDelta: 8 },
      { name: "Carne do dia", slug: "carne-do-dia", sortOrder: 7, priceDelta: 12 },
    ],
  },
  {
    name: "Tamanhos do almoço",
    slug: "tamanhos-do-almoco",
    description: "Escolha o tamanho do prato do dia.",
    minSelections: 1,
    maxSelections: 1,
    isRequired: true,
    sortOrder: 3,
    options: [
      { name: "P", slug: "p", sortOrder: 1, priceDelta: 0 },
      { name: "M", slug: "m", sortOrder: 2, priceDelta: 5 },
      { name: "G", slug: "g", sortOrder: 3, priceDelta: 10 },
      { name: "Prato feito", slug: "prato-feito", sortOrder: 4, priceDelta: 5 },
    ],
  },
  {
    name: "Tamanhos do bife à parmegiana",
    slug: "tamanhos-do-bife-a-parmegiana",
    description: "Escolha o tamanho do bife à parmegiana.",
    minSelections: 1,
    maxSelections: 1,
    isRequired: true,
    sortOrder: 4,
    options: [
      { name: "P", slug: "p", sortOrder: 1, priceDelta: 0 },
      { name: "M", slug: "m", sortOrder: 2, priceDelta: 7 },
      { name: "G", slug: "g", sortOrder: 3, priceDelta: 12 },
      { name: "Prato feito", slug: "prato-feito", sortOrder: 4, priceDelta: 7 },
    ],
  },
  {
    name: "Tamanhos do bife à cavalo",
    slug: "tamanhos-do-bife-a-cavalo",
    description: "Escolha o tamanho do bife à cavalo.",
    minSelections: 1,
    maxSelections: 1,
    isRequired: true,
    sortOrder: 5,
    options: [
      { name: "P", slug: "p", sortOrder: 1, priceDelta: 0 },
      { name: "M", slug: "m", sortOrder: 2, priceDelta: 5 },
      { name: "G", slug: "g", sortOrder: 3, priceDelta: 11 },
      { name: "Prato feito", slug: "prato-feito", sortOrder: 4, priceDelta: 5 },
    ],
  },
  {
    name: "Adicionais dos lanches",
    slug: "adicionais-dos-lanches",
    description: "Adicionais disponíveis para lanches e burgers da casa.",
    minSelections: 0,
    sortOrder: 6,
    options: [
      { name: "Queijo extra", slug: "queijo-extra", sortOrder: 1, priceDelta: 3 },
      { name: "Bacon extra", slug: "bacon-extra", sortOrder: 2, priceDelta: 5 },
      { name: "Ovo extra", slug: "ovo-extra", sortOrder: 3, priceDelta: 4 },
      { name: "Calabresa extra", slug: "calabresa-extra", sortOrder: 4, priceDelta: 5 },
      { name: "Presunto extra", slug: "presunto-extra", sortOrder: 5, priceDelta: 3 },
      { name: "Frango extra", slug: "frango-extra", sortOrder: 6, priceDelta: 6 },
      { name: "Hamburguer extra", slug: "hamburguer-extra", sortOrder: 7, priceDelta: 8 },
      { name: "Tomate extra", slug: "tomate-extra", sortOrder: 8, priceDelta: 2 },
      { name: "Alface extra", slug: "alface-extra", sortOrder: 9, priceDelta: 2 },
      { name: "Maionese extra", slug: "maionese-extra", sortOrder: 10, priceDelta: 2 },
    ],
  },
  {
    name: "Adicionais dos pasteis",
    slug: "adicionais-dos-pasteis",
    description: "Adicionais disponíveis para pastéis salgados e especiais.",
    minSelections: 0,
    sortOrder: 7,
    options: [
      { name: "Queijo extra", slug: "queijo-extra", sortOrder: 1, priceDelta: 3 },
      { name: "Presunto extra", slug: "presunto-extra", sortOrder: 2, priceDelta: 3 },
      { name: "Carne extra", slug: "carne-extra", sortOrder: 3, priceDelta: 5 },
      { name: "Frango extra", slug: "frango-extra", sortOrder: 4, priceDelta: 5 },
      { name: "Catupiry", slug: "catupiry", sortOrder: 5, priceDelta: 4 },
      { name: "Cheddar", slug: "cheddar", sortOrder: 6, priceDelta: 4 },
      { name: "Milho", slug: "milho", sortOrder: 7, priceDelta: 2 },
      { name: "Ovo extra", slug: "ovo-extra", sortOrder: 8, priceDelta: 4 },
    ],
  },
  {
    name: "Adicionais das tapiocas",
    slug: "adicionais-das-tapiocas",
    description: "Adicionais disponíveis para tapiocas salgadas e doces.",
    minSelections: 0,
    sortOrder: 8,
    options: [
      { name: "Queijo extra", slug: "queijo-extra", sortOrder: 1, priceDelta: 3 },
      { name: "Presunto extra", slug: "presunto-extra", sortOrder: 2, priceDelta: 3 },
      { name: "Frango extra", slug: "frango-extra", sortOrder: 3, priceDelta: 5 },
      { name: "Calabresa extra", slug: "calabresa-extra", sortOrder: 4, priceDelta: 5 },
      { name: "Catupiry", slug: "catupiry", sortOrder: 5, priceDelta: 4 },
      { name: "Cheddar", slug: "cheddar", sortOrder: 6, priceDelta: 4 },
      { name: "Ovo extra", slug: "ovo-extra", sortOrder: 7, priceDelta: 4 },
      { name: "Chocolate extra", slug: "chocolate-extra", sortOrder: 8, priceDelta: 4 },
      { name: "Morango extra", slug: "morango-extra", sortOrder: 9, priceDelta: 4 },
      { name: "Banana extra", slug: "banana-extra", sortOrder: 10, priceDelta: 4 },
    ],
  },
  {
    name: "Adicionais dos salgados",
    slug: "adicionais-dos-salgados",
    description: "Adicionais disponíveis para salgados e assados da vitrine.",
    minSelections: 0,
    sortOrder: 9,
    options: [
      { name: "Queijo extra", slug: "queijo-extra", sortOrder: 1, priceDelta: 3 },
      { name: "Presunto extra", slug: "presunto-extra", sortOrder: 2, priceDelta: 3 },
      { name: "Frango extra", slug: "frango-extra", sortOrder: 3, priceDelta: 5 },
      { name: "Carne extra", slug: "carne-extra", sortOrder: 4, priceDelta: 5 },
      { name: "Catupiry", slug: "catupiry", sortOrder: 5, priceDelta: 4 },
      { name: "Cheddar", slug: "cheddar", sortOrder: 6, priceDelta: 4 },
      { name: "Milho", slug: "milho", sortOrder: 7, priceDelta: 2 },
      { name: "Ovo extra", slug: "ovo-extra", sortOrder: 8, priceDelta: 4 },
    ],
  },
];

const lunchWeekDescription = `Cardápio do almoço de segunda a sábado, com pratos do dia e especiais.`;

const categoryDefaultOptionGroupSlugs: Record<string, string[]> = {
  lanches: ["adicionais-dos-lanches"],
  "combo-lanches": ["adicionais-dos-lanches"],
  "lanches-artesanais": ["adicionais-dos-lanches"],
  "combos-artesanais": ["adicionais-dos-lanches"],
  "pastel-salgado": ["adicionais-dos-pasteis"],
  "pastel-doce": ["adicionais-dos-pasteis"],
  "pastel-especial": ["adicionais-dos-pasteis"],
  "tapioca-salgada": ["adicionais-das-tapiocas"],
  "tapioca-doce": ["adicionais-das-tapiocas"],
  acai: ["complementos-do-acai"],
  salgados: ["adicionais-dos-salgados"],
};

const categories: CategorySeed[] = [
  {
    name: "Lanches",
    slug: "lanches",
    description: "Lanches tradicionais servidos no pao ou em versoes especiais da casa.",
    sortOrder: 1,
    items: [
      {
        name: "X-Burguer",
        slug: "x-burguer",
        description: "Pao, hamburguer bovino, queijo, alface, tomate e maionese da casa.",
        imageUrl: menuImages.classicBurger,
        price: 12,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "X-Salada",
        slug: "x-salada",
        description: "Pao, hamburguer bovino, queijo, alface, tomate, milho e maionese da casa.",
        imageUrl: menuImages.classicBurger,
        price: 14,
        sortOrder: 2,
      },
      {
        name: "X-Bacon",
        slug: "x-bacon",
        description: "Pao, hamburguer bovino, queijo, bacon crocante, alface, tomate e maionese da casa.",
        imageUrl: menuImages.gourmetBurger,
        price: 17.5,
        sortOrder: 3,
      },
      {
        name: "X-Frango",
        slug: "x-frango",
        description: "Pao, file de frango, queijo, alface, tomate e maionese da casa.",
        imageUrl: menuImages.chickenBurger,
        price: 17.5,
        sortOrder: 4,
      },
      {
        name: "X-Egg",
        slug: "x-egg",
        description: "Pao, hamburguer bovino, queijo, ovo, alface, tomate e maionese da casa.",
        imageUrl: menuImages.classicBurger,
        price: 17.5,
        sortOrder: 5,
      },
      {
        name: "X-Calabresa",
        slug: "x-calabresa",
        description: "Pao, hamburguer bovino, queijo, calabresa, alface, tomate e maionese da casa.",
        imageUrl: menuImages.gourmetBurger,
        price: 17.5,
        sortOrder: 6,
      },
      {
        name: "X-Tudo",
        slug: "x-tudo",
        description: "Pao, hamburguer bovino, queijo, presunto, bacon, ovo, calabresa, alface, tomate e maionese da casa.",
        imageUrl: menuImages.gourmetBurger,
        price: 30,
        sortOrder: 7,
      },
      {
        name: "X-No Prato",
        slug: "x-no-prato",
        description: "Hamburguer bovino, queijo, ovo, bacon, salada da casa e acompanhamento servido no prato.",
        imageUrl: menuImages.comboBurgerFries,
        price: 35,
        sortOrder: 8,
      },
      {
        name: "Misto Quente",
        slug: "misto-quente",
        description: "Pao de forma tostado, queijo e presunto.",
        imageUrl: menuImages.mistoBauru,
        price: 7,
        sortOrder: 9,
      },
      {
        name: "Bauru",
        slug: "bauru",
        description: "Pao, queijo, presunto, tomate e oregano.",
        imageUrl: menuImages.mistoBauru,
        price: 12,
        sortOrder: 10,
      },
      {
        name: "Omelete",
        slug: "omelete",
        description: "Ovos, queijo, presunto, tomate e cheiro-verde.",
        imageUrl: menuImages.omelete,
        price: 14,
        sortOrder: 11,
      },
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
        description: "Combo com X-Salada, suco natural 300ml e fritas de 200g aproximadamente.",
        imageUrl: menuImages.comboBurgerFries,
        price: 27,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "X-Egg + suco natural 300ml + fritas",
        slug: "combo-x-egg",
        description: "Combo com X-Egg, suco natural 300ml e fritas de 200g aproximadamente.",
        imageUrl: menuImages.comboBurgerFries,
        price: 29,
        sortOrder: 2,
      },
      {
        name: "X-Bacon + suco natural 300ml + fritas",
        slug: "combo-x-bacon",
        description: "Combo com X-Bacon, suco natural 300ml e fritas de 200g aproximadamente.",
        imageUrl: menuImages.comboBurgerFries,
        price: 29,
        sortOrder: 3,
      },
      {
        name: "X-Frango + suco natural 300ml + fritas",
        slug: "combo-x-frango",
        description: "Combo com X-Frango, suco natural 300ml e fritas de 200g aproximadamente.",
        imageUrl: menuImages.comboBurgerFries,
        price: 29,
        sortOrder: 4,
      },
      {
        name: "X-Calabresa + suco natural 300ml + fritas",
        slug: "combo-x-calabresa",
        description: "Combo com X-Calabresa, suco natural 300ml e fritas de 200g aproximadamente.",
        imageUrl: menuImages.comboBurgerFries,
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
        description: "Pao de brioche, manteiga, maionese caseira, hamburguer artesanal bovino 150g, cheddar e molho Billy & Jack.",
        imageUrl: menuImages.gourmetBurger,
        price: 16,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Tradicional",
        slug: "tradicional-artesanal",
        description: "Pao de brioche, manteiga, maionese caseira, alface, tomate, cebola caramelizada, hamburguer artesanal bovino 150g, cheddar e molho Billy & Jack.",
        imageUrl: menuImages.gourmetBurger,
        price: 18,
        sortOrder: 2,
      },
      {
        name: "Artesanal Bacon",
        slug: "artesanal-bacon",
        description: "Pao de brioche, manteiga, maionese caseira, alface, tomate, cebola caramelizada, hamburguer artesanal bovino 150g, bacon, cheddar e molho Billy & Jack.",
        imageUrl: menuImages.gourmetBurger,
        price: 24,
        sortOrder: 3,
      },
      {
        name: "Artesanal Calabresa",
        slug: "artesanal-calabresa",
        description: "Pao de brioche, manteiga, maionese caseira, alface, tomate, cebola caramelizada, hamburguer artesanal bovino 150g, calabresa, cheddar e molho Billy & Jack.",
        imageUrl: menuImages.gourmetBurger,
        price: 24,
        sortOrder: 4,
      },
      {
        name: "X-Alcatra",
        slug: "x-alcatra",
        description: "Pao de brioche, manteiga, maionese caseira, alface, tomate, cebola caramelizada, 100g de alcatra e molho Billy & Jack.",
        imageUrl: menuImages.gourmetBurger,
        price: 28,
        sortOrder: 5,
      },
      {
        name: "Artesanal Duplo",
        slug: "artesanal-duplo",
        description: "Pao de brioche, manteiga, maionese caseira, alface, tomate, cebola caramelizada, 2 hamburgueres artesanais bovinos 150g, cheddar e molho Billy & Jack.",
        imageUrl: menuImages.gourmetBurger,
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
        imageUrl: menuImages.comboBurgerFries,
        price: 34,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Combo Artesanal Bacon",
        slug: "combo-artesanal-bacon",
        description: "Burger artesanal bacon, porcao de batata frita 150g e refrigerante lata 350ml.",
        imageUrl: menuImages.comboBurgerFries,
        price: 40,
        sortOrder: 2,
      },
      {
        name: "Combo Artesanal Calabresa",
        slug: "combo-artesanal-calabresa",
        description: "Burger artesanal calabresa, porcao de batata frita 150g e refrigerante lata 350ml.",
        imageUrl: menuImages.comboBurgerFries,
        price: 40,
        sortOrder: 3,
      },
      {
        name: "Combo Artesanal Duplo",
        slug: "combo-artesanal-duplo",
        description: "Burger artesanal duplo, porcao de batata frita 150g e refrigerante lata 350ml.",
        imageUrl: menuImages.comboBurgerFries,
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
      {
        name: "Carne",
        slug: "pastel-carne",
        description: "Massa crocante recheada com carne moida temperada.",
        imageUrl: menuImages.pastelSalgado,
        price: 7,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Queijo",
        slug: "pastel-queijo",
        description: "Massa crocante recheada com queijo derretido.",
        imageUrl: menuImages.pastelSalgado,
        price: 7,
        sortOrder: 2,
      },
      {
        name: "Pizza",
        slug: "pastel-pizza",
        description: "Massa crocante com queijo, presunto, tomate e oregano.",
        imageUrl: menuImages.pastelSalgado,
        price: 7,
        sortOrder: 3,
      },
      {
        name: "Frango",
        slug: "pastel-frango",
        description: "Massa crocante recheada com frango desfiado temperado.",
        imageUrl: menuImages.pastelSalgado,
        price: 7,
        sortOrder: 4,
      },
      {
        name: "Queijo e Presunto",
        slug: "pastel-queijo-presunto",
        description: "Massa crocante com queijo derretido e presunto.",
        imageUrl: menuImages.pastelSalgado,
        price: 7,
        sortOrder: 5,
      },
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
        description: "Pastel doce com chocolate e morango.",
        imageUrl: menuImages.doceCrepe,
        price: 12,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Chocolate branco c/ morango",
        slug: "pastel-doce-chocolate-branco-morango",
        description: "Pastel doce com chocolate branco e morango.",
        imageUrl: menuImages.doceCrepe,
        price: 12,
        sortOrder: 2,
      },
      {
        name: "Banana c/ canela e leite condensado",
        slug: "pastel-doce-banana-canela-leite-condensado",
        description: "Pastel doce com banana, canela e leite condensado.",
        imageUrl: menuImages.doceCrepe,
        price: 12,
        sortOrder: 3,
      },
      {
        name: "Prestigio",
        slug: "pastel-doce-prestigio",
        description: "Pastel doce com chocolate, coco e leite condensado.",
        imageUrl: menuImages.doceCrepe,
        price: 12,
        sortOrder: 4,
      },
      {
        name: "Queijo com goiabada",
        slug: "pastel-doce-romeu",
        description: "Pastel doce com queijo e goiabada.",
        imageUrl: menuImages.doceCrepe,
        price: 12,
        sortOrder: 5,
      },
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
        description: "Massa crocante com carne moida temperada e ovo.",
        imageUrl: menuImages.pastelSalgado,
        price: 12,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Carne com queijo e milho",
        slug: "pastel-especial-carne-queijo-milho",
        description: "Massa crocante com carne moida, queijo e milho.",
        imageUrl: menuImages.pastelSalgado,
        price: 12,
        sortOrder: 2,
      },
      {
        name: "Carne com queijo e ovo",
        slug: "pastel-especial-carne-queijo-ovo",
        description: "Massa crocante com carne moida, queijo e ovo.",
        imageUrl: menuImages.pastelSalgado,
        price: 15,
        sortOrder: 3,
      },
      {
        name: "Frango com catupiry ou cheddar",
        slug: "pastel-especial-frango-catupiry-cheddar",
        description: "Massa crocante com frango desfiado e opcao de catupiry ou cheddar.",
        imageUrl: menuImages.pastelSalgado,
        price: 12,
        sortOrder: 4,
      },
      {
        name: "Frango com queijo",
        slug: "pastel-especial-frango-queijo",
        description: "Massa crocante com frango desfiado e queijo.",
        imageUrl: menuImages.pastelSalgado,
        price: 12,
        sortOrder: 5,
      },
      {
        name: "Frango com queijo e ovo",
        slug: "pastel-especial-frango-queijo-ovo",
        description: "Massa crocante com frango desfiado, queijo e ovo.",
        imageUrl: menuImages.pastelSalgado,
        price: 15,
        sortOrder: 6,
      },
      {
        name: "Especial",
        slug: "pastel-especial-da-casa",
        description: "Frango, carne moida, calabresa, bacon, queijo, presunto, oregano, milho, catupiry e cheddar.",
        imageUrl: menuImages.pastelSalgado,
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
        imageUrl: menuImages.tapiocaSalgada,
        price: 5,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Pizza",
        slug: "tapioca-pizza",
        description: "Queijo, presunto, oregano e tomate.",
        imageUrl: menuImages.tapiocaSalgada,
        price: 14,
        sortOrder: 2,
      },
      {
        name: "Frango",
        slug: "tapioca-frango",
        description: "Tomate, frango e catupiry.",
        imageUrl: menuImages.tapiocaSalgada,
        price: 14,
        sortOrder: 3,
      },
      {
        name: "Da Casa",
        slug: "tapioca-da-casa",
        description: "Queijo e presunto.",
        imageUrl: menuImages.tapiocaSalgada,
        price: 14,
        sortOrder: 4,
      },
      {
        name: "Italiana",
        slug: "tapioca-italiana",
        description: "Queijo.",
        imageUrl: menuImages.tapiocaSalgada,
        price: 14,
        sortOrder: 5,
      },
      {
        name: "Calabresa com catupiry",
        slug: "tapioca-calabresa-catupiry",
        description: "Calabresa fatiada com catupiry.",
        imageUrl: menuImages.tapiocaSalgada,
        price: 14,
        sortOrder: 6,
      },
      {
        name: "Carne moida com queijo",
        slug: "tapioca-carne-moida-queijo",
        description: "Carne moida temperada com queijo derretido.",
        imageUrl: menuImages.tapiocaSalgada,
        price: 14,
        sortOrder: 7,
      },
      {
        name: "Ovo com queijo",
        slug: "tapioca-ovo-queijo",
        description: "Ovo mexido com queijo.",
        imageUrl: menuImages.tapiocaSalgada,
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
      {
        name: "Baianinha",
        slug: "tapioca-baianinha",
        description: "Leite condensado e chocolate.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Uva com chocolate",
        slug: "tapioca-uva-chocolate",
        description: "Uva e chocolate.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 2,
      },
      {
        name: "Banana com canela",
        slug: "tapioca-banana-canela",
        description: "Banana, leite condensado e canela.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 3,
      },
      {
        name: "Prestigio",
        slug: "tapioca-prestigio",
        description: "Leite condensado e coco.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 4,
      },
      {
        name: "Sensacao",
        slug: "tapioca-sensacao",
        description: "Leite condensado, chocolate e morango.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 5,
      },
      {
        name: "Ouro Branco",
        slug: "tapioca-ouro-branco",
        description: "Bombom Ouro Branco.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 6,
      },
      {
        name: "Ouro Branco com nutella",
        slug: "tapioca-ouro-branco-nutella",
        description: "Bombom Ouro Branco e Nutella.",
        imageUrl: menuImages.doceCrepe,
        price: 17,
        sortOrder: 7,
      },
      {
        name: "Sonho de Valsa",
        slug: "tapioca-sonho-de-valsa",
        description: "Bombom Sonho de Valsa e leite condensado.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 8,
      },
      {
        name: "Sonho de Valsa com nutella",
        slug: "tapioca-sonho-de-valsa-nutella",
        description: "Bombom Sonho de Valsa e Nutella.",
        imageUrl: menuImages.doceCrepe,
        price: 17,
        sortOrder: 9,
      },
      {
        name: "Romeu e Julieta",
        slug: "tapioca-romeu-julieta",
        description: "Queijo e goiabada.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 10,
      },
      {
        name: "Chocolate com morango",
        slug: "tapioca-chocolate-morango",
        description: "Chocolate e morango.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 11,
      },
      {
        name: "Chocolate branco c/ morango",
        slug: "tapioca-chocolate-branco-morango",
        description: "Chocolate branco e morango.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 12,
      },
    ],
  },
  {
    name: "Acai",
    slug: "acai",
    description: "Copos de acai com adicionais inclusos para montar do seu jeito.",
    sortOrder: 11,
    items: [
      {
        name: "Acai 240ml",
        slug: "acai-240ml",
        description: "Copo com ate 3 adicionais inclusos.",
        imageUrl: menuImages.acai,
        price: 13,
        sortOrder: 1,
        isFeatured: true,
        optionGroupSlugs: ["complementos-do-acai"],
      },
      {
        name: "Acai 360ml",
        slug: "acai-360ml",
        description: "Copo com ate 3 adicionais inclusos.",
        imageUrl: menuImages.acai,
        price: 18,
        sortOrder: 2,
        optionGroupSlugs: ["complementos-do-acai"],
      },
      {
        name: "Acai 500ml",
        slug: "acai-500ml",
        description: "Copo com ate 3 adicionais inclusos.",
        imageUrl: menuImages.acai,
        price: 22,
        sortOrder: 3,
        optionGroupSlugs: ["complementos-do-acai"],
      },
    ],
  },
  {
    name: "Salgados",
    slug: "salgados",
    description: "Coxinhas, risoles, enroladinhos e assados da casa.",
    sortOrder: 10,
    items: [
      {
        name: "Coxinha pequena de frango",
        slug: "coxinha-pequena-frango",
        description: "Coxinha pequena de frango preparada na hora.",
        imageUrl: menuImages.pastelSalgado,
        price: 6,
        sortOrder: 1,
      },
      {
        name: "Risoles pequeno de carne",
        slug: "risoles-pequeno-carne",
        description: "Risoles pequeno recheado com carne.",
        imageUrl: menuImages.pastelSalgado,
        price: 6,
        sortOrder: 2,
      },
      {
        name: "Risoles pequeno de queijo e presunto",
        slug: "risoles-pequeno-queijo-presunto",
        description: "Risoles pequeno com queijo e presunto.",
        imageUrl: menuImages.pastelSalgado,
        price: 6,
        sortOrder: 3,
      },
      {
        name: "Enroladinho de vina pequeno",
        slug: "enroladinho-vina-pequeno",
        description: "Enroladinho de vina em tamanho pequeno.",
        imageUrl: menuImages.pastelSalgado,
        price: 6.5,
        sortOrder: 4,
      },
      {
        name: "Coxinha grande de frango com cheddar",
        slug: "coxinha-grande-frango-cheddar",
        description: "Coxinha grande de frango com cheddar.",
        imageUrl: menuImages.pastelSalgado,
        price: 10.5,
        sortOrder: 5,
        isFeatured: true,
      },
      {
        name: "Coxinha grande de frango com requeijao",
        slug: "coxinha-grande-frango-requeijao",
        description: "Coxinha grande de frango com requeijao.",
        imageUrl: menuImages.pastelSalgado,
        price: 10.5,
        sortOrder: 6,
      },
      {
        name: "Coxinha grande de frango",
        slug: "coxinha-grande-frango",
        description: "Coxinha grande de frango tradicional.",
        imageUrl: menuImages.pastelSalgado,
        price: 9.5,
        sortOrder: 7,
      },
      {
        name: "Risoles grande de carne",
        slug: "risoles-grande-carne",
        description: "Risoles grande recheado com carne.",
        imageUrl: menuImages.pastelSalgado,
        price: 9.5,
        sortOrder: 8,
      },
      {
        name: "Risoles grande de queijo e presunto",
        slug: "risoles-grande-queijo-presunto",
        description: "Risoles grande com queijo e presunto.",
        imageUrl: menuImages.pastelSalgado,
        price: 9.5,
        sortOrder: 9,
      },
      {
        name: "Enroladinho de vina grande",
        slug: "enroladinho-vina-grande",
        description: "Enroladinho de vina em tamanho grande.",
        imageUrl: menuImages.pastelSalgado,
        price: 9.5,
        sortOrder: 10,
      },
      {
        name: "Espeto de frango",
        slug: "espeto-frango",
        description: "Espeto de frango bem servido e dourado.",
        imageUrl: menuImages.pastelSalgado,
        price: 7.5,
        sortOrder: 11,
      },
      {
        name: "Assado de vina com cheddar",
        slug: "assado-vina-cheddar",
        description: "Assado de vina com cheddar derretido.",
        imageUrl: menuImages.pastelSalgado,
        price: 10,
        sortOrder: 12,
      },
      {
        name: "Assado de vina com catupiry",
        slug: "assado-vina-catupiry",
        description: "Assado de vina com catupiry cremoso.",
        imageUrl: menuImages.pastelSalgado,
        price: 10,
        sortOrder: 13,
      },
      {
        name: "Assado de Hamburgao com cheddar",
        slug: "assado-hamburgao-cheddar",
        description: "Assado de hamburgao com cheddar.",
        imageUrl: menuImages.pastelSalgado,
        price: 11,
        sortOrder: 14,
      },
      {
        name: "Assado de Hamburgao com catupiry",
        slug: "assado-hamburgao-catupiry",
        description: "Assado de hamburgao com catupiry.",
        imageUrl: menuImages.pastelSalgado,
        price: 11,
        sortOrder: 15,
      },
      {
        name: "Assado de carne moida",
        slug: "assado-carne-moida",
        description: "Assado de carne moida temperada.",
        imageUrl: menuImages.pastelSalgado,
        price: 10,
        sortOrder: 16,
      },
      {
        name: "Assado de queijo e presunto",
        slug: "assado-queijo-presunto",
        description: "Assado de queijo e presunto.",
        imageUrl: menuImages.pastelSalgado,
        price: 10,
        sortOrder: 17,
      },
      {
        name: "Assado de frango com catupiry",
        slug: "assado-frango-catupiry",
        description: "Assado de frango com catupiry cremoso.",
        imageUrl: menuImages.pastelSalgado,
        price: 11,
        sortOrder: 18,
      },
      {
        name: "Assado de frango com cheddar",
        slug: "assado-frango-cheddar",
        description: "Assado de frango com cheddar derretido.",
        imageUrl: menuImages.pastelSalgado,
        price: 11,
        sortOrder: 19,
      },
    ],
  },
  {
    name: "Almoço",
    slug: "almoco",
    description: lunchWeekDescription,
    sortOrder: 11,
    availableFrom: "11:00",
    availableUntil: "15:00",
    items: [
      {
        name: "Contrafilé",
        slug: "contrafile",
        description: "Contrafilé servido com arroz, feijão, macarrão, salada e batata frita.",
        price: 32,
        sortOrder: 1,
        optionGroupSlugs: ["adicionais-do-almoco"],
      },
      {
        name: "Bife à parmegiana",
        slug: "bife-parmegiana",
        description: "Bife à parmegiana servido com molho, queijo e acompanhamentos do almoço.",
        price: 18,
        sortOrder: 2,
        optionGroupSlugs: ["tamanhos-do-bife-a-parmegiana", "adicionais-do-almoco"],
      },
      {
        name: "Bife à cavalo",
        slug: "bife-a-cavalo",
        description: "Bife à cavalo servido com ovo, arroz, feijão e acompanhamentos do almoço.",
        price: 18,
        sortOrder: 3,
        optionGroupSlugs: ["tamanhos-do-bife-a-cavalo", "adicionais-do-almoco"],
      },
      {
        name: "Frango ao molho",
        slug: "frango-ao-molho",
        description: "Arroz, feijão, macarrão, salada de alface com tomate, batata frita e frango ao molho.",
        price: 15,
        sortOrder: 4,
        availableWeekdays: ["monday"],
        optionGroupSlugs: ["tamanhos-do-almoco", "adicionais-do-almoco"],
      },
      {
        name: "Frango à milanesa",
        slug: "frango-a-milanesa",
        description: "Arroz, feijão, macarrão, salada mista, batata frita e frango à milanesa.",
        price: 15,
        sortOrder: 5,
        availableWeekdays: ["tuesday"],
        optionGroupSlugs: ["tamanhos-do-almoco", "adicionais-do-almoco"],
      },
      {
        name: "Carne de panela",
        slug: "carne-de-panela",
        description: "Arroz, feijão, macarrão, salada de repolho com tomate e cebolinha, batata frita e carne de panela.",
        price: 15,
        sortOrder: 6,
        availableWeekdays: ["wednesday"],
        optionGroupSlugs: ["tamanhos-do-almoco", "adicionais-do-almoco"],
      },
      {
        name: "Strogonoff",
        slug: "strogonoff",
        description: "Arroz, feijão, macarrão, salada de alface com tomate e cebola, batata frita e strogonoff.",
        price: 15,
        sortOrder: 7,
        availableWeekdays: ["thursday"],
        optionGroupSlugs: ["tamanhos-do-almoco", "adicionais-do-almoco"],
      },
      {
        name: "Coxa e sobrecoxa assada",
        slug: "coxa-sobrecoxa-assada",
        description: "Arroz, feijão, macarrão, vinagrete, batata frita e coxa e sobrecoxa assada.",
        price: 15,
        sortOrder: 8,
        availableWeekdays: ["friday"],
        optionGroupSlugs: ["tamanhos-do-almoco", "adicionais-do-almoco"],
      },
      {
        name: "Feijoada",
        slug: "feijoada-almoco",
        description: "Arroz, feijão, macarrão, salada mista e carnes de bife, bisteca e filé de frango grelhado.",
        price: 15,
        sortOrder: 9,
        availableWeekdays: ["saturday"],
        optionGroupSlugs: ["tamanhos-do-almoco", "adicionais-do-almoco"],
      },
    ],
  },
];

const explicitIngredientSlugsByItem = new Map<string, string[]>([
  ["combo-x-salada", ["pao", "hamburguer-bovino", "queijo", "alface", "tomate", "milho", "maionese-da-casa"]],
  ["combo-x-egg", ["pao", "hamburguer-bovino", "queijo", "ovo", "alface", "tomate", "maionese-da-casa"]],
  ["combo-x-bacon", ["pao", "hamburguer-bovino", "queijo", "bacon", "alface", "tomate", "maionese-da-casa"]],
  ["combo-x-frango", ["pao", "file-de-frango", "queijo", "alface", "tomate", "maionese-da-casa"]],
  ["combo-x-calabresa", ["pao", "hamburguer-bovino", "queijo", "calabresa", "alface", "tomate", "maionese-da-casa"]],
  [
    "combo-artesanal-tradicional",
    [
      "pao-de-brioche",
      "manteiga",
      "maionese-da-casa",
      "alface",
      "tomate",
      "cebola-caramelizada",
      "hamburguer-artesanal-bovino",
      "cheddar",
      "molho-billy-jack",
    ],
  ],
  [
    "combo-artesanal-bacon",
    [
      "pao-de-brioche",
      "manteiga",
      "maionese-da-casa",
      "alface",
      "tomate",
      "cebola-caramelizada",
      "hamburguer-artesanal-bovino",
      "bacon",
      "cheddar",
      "molho-billy-jack",
    ],
  ],
  [
    "combo-artesanal-calabresa",
    [
      "pao-de-brioche",
      "manteiga",
      "maionese-da-casa",
      "alface",
      "tomate",
      "cebola-caramelizada",
      "hamburguer-artesanal-bovino",
      "calabresa",
      "cheddar",
      "molho-billy-jack",
    ],
  ],
  [
    "combo-artesanal-duplo",
    [
      "pao-de-brioche",
      "manteiga",
      "maionese-da-casa",
      "alface",
      "tomate",
      "cebola-caramelizada",
      "hamburguer-artesanal-bovino",
      "cheddar",
      "molho-billy-jack",
    ],
  ],
]);

function normalizeSeedText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function inferIngredientSlugs(category: CategorySeed, item: MenuItemSeed) {
  const explicitSlugs = item.ingredientSlugs || explicitIngredientSlugsByItem.get(item.slug);

  if (explicitSlugs) {
    return explicitSlugs;
  }

  const text = normalizeSeedText(`${item.name}. ${item.description ?? ""}`);
  const slugs = new Set<string>();

  if (category.slug.includes("pastel")) {
    slugs.add("massa-de-pastel");
  }

  if (category.slug.includes("tapioca")) {
    slugs.add("massa-de-tapioca");
  }

  for (const ingredient of ingredients) {
    const patterns = ingredient.patterns || [ingredient.name];

    if (patterns.some((pattern) => text.includes(normalizeSeedText(pattern)))) {
      slugs.add(ingredient.slug);
    }
  }

  if (slugs.has("pao-de-brioche") || slugs.has("pao-de-forma")) {
    slugs.delete("pao");
  }

  if (slugs.has("hamburguer-artesanal-bovino")) {
    slugs.delete("hamburguer-bovino");
  }

  if (slugs.has("file-de-frango") || slugs.has("file-de-frango-grelhado") || slugs.has("frango-ao-molho") || slugs.has("frango-a-milanesa")) {
    slugs.delete("frango-desfiado");
  }

  return Array.from(slugs);
}

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
            priceDelta: option.priceDelta ?? 0,
            isDefault: false,
            isActive: true,
          },
          update: {
            name: option.name,
            sortOrder: option.sortOrder,
            priceDelta: option.priceDelta ?? 0,
            isDefault: false,
            isActive: true,
          },
        });
    }
  }

  return optionGroupIds;
}

async function syncIngredients() {
  const ingredientIds = new Map<string, string>();

  for (const ingredient of ingredients) {
    const savedIngredient = await prisma.ingredient.upsert({
      where: { slug: ingredient.slug },
      create: {
        name: ingredient.name,
        slug: ingredient.slug,
        price: 0,
        sortOrder: ingredient.sortOrder,
        isActive: true,
      },
      update: {
        name: ingredient.name,
        price: 0,
        sortOrder: ingredient.sortOrder,
        isActive: true,
      },
    });

    ingredientIds.set(ingredient.slug, savedIngredient.id);
  }

  return ingredientIds;
}

async function syncCategoriesAndItems(optionGroupIds: Map<string, string>, ingredientIds: Map<string, string>) {
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
        availableFrom: category.availableFrom,
        availableUntil: category.availableUntil,
        isActive: true,
      },
      update: {
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        availableFrom: category.availableFrom,
        availableUntil: category.availableUntil,
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
          imageUrl: item.imageUrl,
          price: item.price,
          sortOrder: item.sortOrder,
          isFeatured: item.isFeatured ?? false,
          isActive: true,
        },
        update: {
          categoryId: savedCategory.id,
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          price: item.price,
          sortOrder: item.sortOrder,
          isFeatured: item.isFeatured ?? false,
          isActive: true,
        },
      });

      await prisma.menuItemOptionGroup.deleteMany({
        where: { menuItemId: savedItem.id },
      });

      const optionGroupSlugs = Array.from(
        new Set([
          ...(item.optionGroupSlugs || []),
          ...(categoryDefaultOptionGroupSlugs[category.slug] || []),
        ]),
      );

      if (optionGroupSlugs.length) {
        await prisma.menuItemOptionGroup.createMany({
          data: optionGroupSlugs.map((groupSlug, index) => {
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

      await prisma.menuItemIngredient.deleteMany({
        where: { menuItemId: savedItem.id },
      });

      const ingredientSlugs = inferIngredientSlugs(category, item);

      if (ingredientSlugs.length) {
        await prisma.menuItemIngredient.createMany({
          data: ingredientSlugs.map((ingredientSlug, index) => {
            const ingredientId = ingredientIds.get(ingredientSlug);

            if (!ingredientId) {
              throw new Error(`Ingrediente nao encontrado para slug ${ingredientSlug}.`);
            }

            return {
              menuItemId: savedItem.id,
              ingredientId,
              quantity: ingredientSlug === "hamburguer-artesanal-bovino" && item.slug === "artesanal-duplo" ? 2 : 1,
              sortOrder: index + 1,
            };
          }),
        });
      }
    }
  }
}

async function seedDeliveryFeeRules() {
  const store = await prisma.storeProfile.upsert({
    where: { slug: "loja-principal" },
    create: {
      slug: "loja-principal",
      name: "Lanchonete Familia",
      zipCode: "81170-260",
      street: "R. Gilberto Kaminski",
      number: "170",
      neighborhood: "Cidade Industrial de Curitiba",
      city: "Curitiba",
      state: "PR",
      latitude: -25.5149,
      longitude: -49.331093,
      maxDeliveryDistanceKm: 5,
    },
    update: {
      name: "Lanchonete Familia",
      zipCode: "81170-260",
      street: "R. Gilberto Kaminski",
      number: "170",
      neighborhood: "Cidade Industrial de Curitiba",
      city: "Curitiba",
      state: "PR",
      latitude: -25.5149,
      longitude: -49.331093,
      maxDeliveryDistanceKm: 5,
    },
  });

  for (const weekday of businessWeekdays) {
    await prisma.storeBusinessHour.upsert({
      where: {
        storeProfileId_weekday: {
          storeProfileId: store.id,
          weekday,
        },
      },
      create: {
        storeProfileId: store.id,
        weekday,
        opensAt: "18:00",
        closesAt: "23:30",
        isOpen: true,
      },
      update: {},
    });
  }

  await prisma.deliveryFeeRule.updateMany({
    data: { isActive: false },
  });

  const distanceRules = [
    {
      id: "cm-distance-fee-1km",
      label: "Ate 1 km",
      maxDistanceKm: 1,
      feeAmount: 3,
      sortOrder: 1,
    },
    {
      id: "cm-distance-fee-2km",
      label: "Ate 2 km",
      maxDistanceKm: 2,
      feeAmount: 4,
      sortOrder: 2,
    },
    {
      id: "cm-distance-fee-3km",
      label: "Ate 3 km",
      maxDistanceKm: 3,
      feeAmount: 3.5,
      sortOrder: 3,
    },
    {
      id: "cm-distance-fee-4km",
      label: "Ate 4 km",
      maxDistanceKm: 4,
      feeAmount: 4.25,
      sortOrder: 4,
    },
    {
      id: "cm-distance-fee-5km",
      label: "Ate 5 km",
      maxDistanceKm: 5,
      feeAmount: 5,
      sortOrder: 5,
    },
  ] as const;

  for (const rule of distanceRules) {
    await prisma.deliveryFeeRule.upsert({
      where: {
        id: rule.id,
      },
      create: {
        id: rule.id,
        label: rule.label,
        neighborhood: null,
        city: "Curitiba",
        state: "PR",
        zipCodeStart: null,
        zipCodeEnd: null,
        maxDistanceKm: rule.maxDistanceKm,
        feeAmount: rule.feeAmount,
        minimumOrderAmount: 0,
        freeAboveAmount: null,
        estimatedMinMinutes: 20,
        estimatedMaxMinutes: 60,
        sortOrder: rule.sortOrder,
        isActive: true,
      },
      update: {
        label: rule.label,
        neighborhood: null,
        city: "Curitiba",
        state: "PR",
        zipCodeStart: null,
        zipCodeEnd: null,
        maxDistanceKm: rule.maxDistanceKm,
        feeAmount: rule.feeAmount,
        minimumOrderAmount: 0,
        freeAboveAmount: null,
        estimatedMinMinutes: 20,
        estimatedMaxMinutes: 60,
        sortOrder: rule.sortOrder,
        isActive: true,
      },
    });
  }
}

async function seedCatalog() {
  const optionGroupIds = await syncOptionGroups();
  const ingredientIds = await syncIngredients();
  await syncCategoriesAndItems(optionGroupIds, ingredientIds);
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
