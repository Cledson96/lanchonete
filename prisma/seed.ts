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
  { name: "Pão francês", slug: "pao-frances", sortOrder: 3, patterns: ["pao frances"] },
  { name: "Pão de brioche", slug: "pao-de-brioche", sortOrder: 4, patterns: ["pao de brioche"] },
  { name: "Hambúrguer bovino", slug: "hamburguer-bovino", sortOrder: 5, patterns: ["hamburguer bovino"] },
  { name: "Hambúrguer artesanal bovino", slug: "hamburguer-artesanal-bovino", sortOrder: 6, patterns: ["hamburguer artesanal bovino", "hamburgueres artesanais bovinos"] },
  { name: "Filé de frango", slug: "file-de-frango", sortOrder: 7, patterns: ["file de frango", "filé de frango"] },
  { name: "Frango desfiado", slug: "frango-desfiado", sortOrder: 8, patterns: ["frango desfiado", "frango,", "frango e", "frango."] },
  { name: "Alcatra", slug: "alcatra", sortOrder: 9, patterns: ["alcatra"] },
  { name: "Queijo", slug: "queijo", sortOrder: 10, patterns: ["queijo"] },
  { name: "Queijo cheddar", slug: "queijo-cheddar", sortOrder: 11, patterns: ["queijo cheddar"] },
  { name: "Cheddar", slug: "cheddar", sortOrder: 12, patterns: ["cheddar"] },
  { name: "Presunto", slug: "presunto", sortOrder: 13, patterns: ["presunto"] },
  { name: "Bacon", slug: "bacon", sortOrder: 14, patterns: ["bacon"] },
  { name: "Ovo", slug: "ovo", sortOrder: 15, patterns: ["ovo", "ovos"] },
  { name: "Calabresa", slug: "calabresa", sortOrder: 16, patterns: ["calabresa"] },
  { name: "Alface", slug: "alface", sortOrder: 17, patterns: ["alface"] },
  { name: "Tomate", slug: "tomate", sortOrder: 18, patterns: ["tomate"] },
  { name: "Milho", slug: "milho", sortOrder: 19, patterns: ["milho"] },
  { name: "Maionese", slug: "maionese-da-casa", sortOrder: 20, patterns: ["maionese", "maionese da casa", "maionese caseira"] },
  { name: "Manteiga", slug: "manteiga", sortOrder: 21, patterns: ["manteiga"] },
  { name: "Margarina", slug: "margarina", sortOrder: 22, patterns: ["margarina"] },
  { name: "Cebola caramelizada", slug: "cebola-caramelizada", sortOrder: 23, patterns: ["cebola caramelizada"] },
  { name: "Molho Billy & Jack", slug: "molho-billy-jack", sortOrder: 24, patterns: ["molho billy & jack"] },
  { name: "Orégano", slug: "oregano", sortOrder: 25, patterns: ["oregano"] },
  { name: "Cheiro-verde", slug: "cheiro-verde", sortOrder: 26, patterns: ["cheiro-verde"] },
  { name: "Massa de pastel", slug: "massa-de-pastel", sortOrder: 27, patterns: ["massa crocante", "pastel doce com"] },
  { name: "Carne moída", slug: "carne-moida", sortOrder: 28, patterns: ["carne moida"] },
  { name: "Catupiry", slug: "catupiry", sortOrder: 29, patterns: ["catupiry"] },
  { name: "Chocolate", slug: "chocolate", sortOrder: 30, patterns: ["chocolate e", "chocolate com", "com chocolate.", "e chocolate."] },
  { name: "Chocolate preto", slug: "chocolate-preto", sortOrder: 31, patterns: ["chocolate preto"] },
  { name: "Chocolate ao leite", slug: "chocolate-ao-leite", sortOrder: 32, patterns: ["chocolate ao leite"] },
  { name: "Chocolate branco", slug: "chocolate-branco", sortOrder: 33, patterns: ["chocolate branco"] },
  { name: "Creme de avela", slug: "creme-de-avela", sortOrder: 34, patterns: ["creme de avela"] },
  { name: "Prestigio", slug: "prestigio", sortOrder: 35, patterns: ["prestigio"] },
  { name: "Ouro branco", slug: "ouro-branco", sortOrder: 36, patterns: ["ouro branco"] },
  { name: "Sonho de valsa", slug: "sonho-de-valsa", sortOrder: 37, patterns: ["sonho de valsa"] },
  { name: "Morango", slug: "morango", sortOrder: 38, patterns: ["morango"] },
  { name: "Banana", slug: "banana", sortOrder: 39, patterns: ["banana"] },
  { name: "Canela", slug: "canela", sortOrder: 40, patterns: ["canela"] },
  { name: "Leite condensado", slug: "leite-condensado", sortOrder: 41, patterns: ["leite condensado"] },
  { name: "Coco", slug: "coco", sortOrder: 42, patterns: ["coco"] },
  { name: "Goiabada", slug: "goiabada", sortOrder: 43, patterns: ["goiabada"] },
  { name: "Massa de tapioca", slug: "massa-de-tapioca", sortOrder: 44, patterns: [] },
  { name: "Uva", slug: "uva", sortOrder: 45, patterns: ["uva"] },
  { name: "Requeijão", slug: "requeijao", sortOrder: 46, patterns: ["requeijao"] },
  { name: "Vina", slug: "vina", sortOrder: 47, patterns: ["vina"] },
  { name: "Batata frita", slug: "batata-frita", sortOrder: 48, patterns: ["batata frita"] },
  { name: "Batata palha", slug: "batata-palha", sortOrder: 49, patterns: ["batata palha"] },
  { name: "Arroz", slug: "arroz", sortOrder: 50, patterns: ["arroz"] },
  { name: "Feijão", slug: "feijao", sortOrder: 51, patterns: ["feijao"] },
  { name: "Macarrão", slug: "macarrao", sortOrder: 52, patterns: ["macarrao"] },
  { name: "Salada", slug: "salada", sortOrder: 53, patterns: ["salada"] },
  { name: "Contrafilé", slug: "contrafile", sortOrder: 54, patterns: ["contrafile"] },
  { name: "Bife", slug: "bife", sortOrder: 55, patterns: ["bife"] },
  { name: "Molho", slug: "molho", sortOrder: 56, patterns: ["servido com molho"] },
  { name: "Frango ao molho", slug: "frango-ao-molho", sortOrder: 57, patterns: ["frango ao molho"] },
  { name: "Frango à milanesa", slug: "frango-a-milanesa", sortOrder: 58, patterns: ["frango a milanesa", "frango à milanesa"] },
  { name: "Carne de panela", slug: "carne-de-panela", sortOrder: 59, patterns: ["carne de panela"] },
  { name: "Strogonoff", slug: "strogonoff", sortOrder: 60, patterns: ["strogonoff"] },
  { name: "Coxa e sobrecoxa", slug: "coxa-sobrecoxa", sortOrder: 61, patterns: ["coxa e sobrecoxa"] },
  { name: "Vinagrete", slug: "vinagrete", sortOrder: 62, patterns: ["vinagrete"] },
  { name: "Bisteca", slug: "bisteca", sortOrder: 63, patterns: ["bisteca"] },
  { name: "Filé de frango grelhado", slug: "file-de-frango-grelhado", sortOrder: 64, patterns: ["file de frango grelhado", "filé de frango grelhado"] },
  { name: "Cebola", slug: "cebola", sortOrder: 65, patterns: ["cebola"] },
  { name: "Farofa", slug: "farofa", sortOrder: 66, patterns: ["farofa"] },
  { name: "Frango a passarinho", slug: "frango-a-passarinho", sortOrder: 67, patterns: ["frango a passarinho"] },
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
      { name: "Creme de avela", slug: "creme-de-avela", sortOrder: 9 },
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
      { name: "Bacon extra", slug: "bacon-extra", sortOrder: 2, priceDelta: 6 },
      { name: "Ovo extra", slug: "ovo-extra", sortOrder: 3, priceDelta: 4 },
      { name: "Calabresa extra", slug: "calabresa-extra", sortOrder: 4, priceDelta: 6 },
      { name: "Presunto extra", slug: "presunto-extra", sortOrder: 5, priceDelta: 3 },
      { name: "Frango extra", slug: "frango-extra", sortOrder: 6, priceDelta: 6 },
      { name: "Hamburguer extra", slug: "hamburguer-extra", sortOrder: 7, priceDelta: 8 },
      { name: "Tomate extra", slug: "tomate-extra", sortOrder: 8, priceDelta: 2 },
      { name: "Alface extra", slug: "alface-extra", sortOrder: 9, priceDelta: 2 },
      { name: "Maionese extra", slug: "maionese-extra", sortOrder: 10, priceDelta: 2 },
      { name: "Milho extra", slug: "milho-extra", sortOrder: 11, priceDelta: 2 },
    ],
  },
  {
    name: "Bebida do combo",
    slug: "bebida-combo-lanches",
    description: "Escolha a bebida do combo.",
    minSelections: 1,
    maxSelections: 1,
    isRequired: true,
    sortOrder: 7,
    options: [
      { name: "Suco de laranja 300ml", slug: "suco-laranja-300ml", sortOrder: 1 },
      { name: "Coca cola 220ml", slug: "coca-cola-220ml", sortOrder: 2 },
    ],
  },
  {
    name: "Refrigerante lata 350ml",
    slug: "refrigerante-lata-350ml",
    description: "Escolha o refrigerante lata do combo.",
    minSelections: 1,
    maxSelections: 1,
    isRequired: true,
    sortOrder: 8,
    options: [
      { name: "Coca cola", slug: "coca-cola", sortOrder: 1 },
      { name: "Fanta uva", slug: "fanta-uva", sortOrder: 2 },
      { name: "Fanta laranja", slug: "fanta-laranja", sortOrder: 3 },
      { name: "Sprite", slug: "sprite", sortOrder: 4 },
      { name: "Schweppes", slug: "schweppes", sortOrder: 5 },
      { name: "Kuat", slug: "kuat", sortOrder: 6 },
    ],
  },
  {
    name: "Adicionais dos pasteis",
    slug: "adicionais-dos-pasteis",
    description: "Adicionais disponíveis para pastéis salgados e especiais.",
    minSelections: 0,
    sortOrder: 9,
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
    name: "Adicionais doces dos pasteis",
    slug: "adicionais-doces-dos-pasteis",
    description: "Adicionais disponíveis para pastéis doces.",
    minSelections: 0,
    sortOrder: 10,
    options: [
      { name: "Leite condensado", slug: "leite-condensado", sortOrder: 1, priceDelta: 4 },
      { name: "Uva", slug: "uva", sortOrder: 2, priceDelta: 4 },
      { name: "Morango", slug: "morango", sortOrder: 3, priceDelta: 4 },
      { name: "Banana", slug: "banana", sortOrder: 4, priceDelta: 4 },
      { name: "Coco", slug: "coco", sortOrder: 5, priceDelta: 4 },
      { name: "Chocolate branco", slug: "chocolate-branco", sortOrder: 6, priceDelta: 4 },
      { name: "Chocolate preto", slug: "chocolate-preto", sortOrder: 7, priceDelta: 4 },
      { name: "Creme de avela", slug: "creme-de-avela", sortOrder: 8, priceDelta: 6 },
      { name: "Ouro branco", slug: "ouro-branco", sortOrder: 9, priceDelta: 6 },
      { name: "Sonho de valsa", slug: "sonho-de-valsa", sortOrder: 10, priceDelta: 6 },
    ],
  },
  {
    name: "Adicionais das tapiocas",
    slug: "adicionais-das-tapiocas",
    description: "Adicionais disponíveis para tapiocas salgadas.",
    minSelections: 0,
    sortOrder: 11,
    options: [
      { name: "Queijo extra", slug: "queijo-extra", sortOrder: 1, priceDelta: 3 },
      { name: "Presunto extra", slug: "presunto-extra", sortOrder: 2, priceDelta: 3 },
      { name: "Frango extra", slug: "frango-extra", sortOrder: 3, priceDelta: 5 },
      { name: "Calabresa extra", slug: "calabresa-extra", sortOrder: 4, priceDelta: 5 },
      { name: "Catupiry", slug: "catupiry", sortOrder: 5, priceDelta: 4 },
      { name: "Cheddar", slug: "cheddar", sortOrder: 6, priceDelta: 4 },
      { name: "Ovo extra", slug: "ovo-extra", sortOrder: 7, priceDelta: 4 },
    ],
  },
  {
    name: "Adicionais doces das tapiocas",
    slug: "adicionais-doces-das-tapiocas",
    description: "Adicionais disponíveis para tapiocas doces.",
    minSelections: 0,
    sortOrder: 12,
    options: [
      { name: "Leite condensado", slug: "leite-condensado", sortOrder: 1, priceDelta: 4 },
      { name: "Uva", slug: "uva", sortOrder: 2, priceDelta: 4 },
      { name: "Morango", slug: "morango", sortOrder: 3, priceDelta: 4 },
      { name: "Banana", slug: "banana", sortOrder: 4, priceDelta: 4 },
      { name: "Coco", slug: "coco", sortOrder: 5, priceDelta: 4 },
      { name: "Chocolate branco", slug: "chocolate-branco", sortOrder: 6, priceDelta: 4 },
      { name: "Chocolate preto", slug: "chocolate-preto", sortOrder: 7, priceDelta: 4 },
      { name: "Creme de avela", slug: "creme-de-avela", sortOrder: 8, priceDelta: 6 },
      { name: "Ouro branco", slug: "ouro-branco", sortOrder: 9, priceDelta: 6 },
      { name: "Sonho de valsa", slug: "sonho-de-valsa", sortOrder: 10, priceDelta: 6 },
    ],
  },
  {
    name: "Adicionais dos salgados",
    slug: "adicionais-dos-salgados",
    description: "Adicionais disponíveis para salgados e assados da vitrine.",
    minSelections: 0,
    sortOrder: 13,
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
  {
    name: "Adicionais pagos do acai",
    slug: "adicionais-pagos-do-acai",
    description: "Adicionais extras cobrados fora dos 3 complementos inclusos.",
    minSelections: 0,
    sortOrder: 14,
    options: [
      { name: "Aveia", slug: "aveia", sortOrder: 1, priceDelta: 2 },
      { name: "Granola", slug: "granola", sortOrder: 2, priceDelta: 2 },
      { name: "Sucrilhos", slug: "sucrilhos", sortOrder: 3, priceDelta: 2 },
      { name: "Amendoim", slug: "amendoim", sortOrder: 4, priceDelta: 2 },
      { name: "Leite em po", slug: "leite-em-po", sortOrder: 5, priceDelta: 3 },
      { name: "Pacoca", slug: "pacoca", sortOrder: 6, priceDelta: 3 },
      { name: "Doce de leite", slug: "doce-de-leite", sortOrder: 7, priceDelta: 4 },
      { name: "Leite condensado", slug: "leite-condensado", sortOrder: 8, priceDelta: 4 },
      { name: "Creme de avela", slug: "creme-de-avela", sortOrder: 9, priceDelta: 6 },
      { name: "Chocolate branco", slug: "chocolate-branco", sortOrder: 10, priceDelta: 4 },
      { name: "Confete", slug: "confete", sortOrder: 11, priceDelta: 4 },
      { name: "Uva", slug: "uva", sortOrder: 12, priceDelta: 4 },
      { name: "Morango", slug: "morango", sortOrder: 13, priceDelta: 4 },
      { name: "Banana", slug: "banana", sortOrder: 14, priceDelta: 4 },
    ],
  },
];

const lunchWeekDescription = `Cardápio do almoço de segunda a sábado, com pratos do dia e especiais.`;

const categoryDefaultOptionGroupSlugs: Record<string, string[]> = {
  lanches: ["adicionais-dos-lanches"],
  "combo-lanches": ["adicionais-dos-lanches", "bebida-combo-lanches"],
  "lanches-artesanais": ["adicionais-dos-lanches"],
  "combos-artesanais": ["adicionais-dos-lanches", "refrigerante-lata-350ml"],
  "pastel-salgado": ["adicionais-dos-pasteis"],
  "pastel-doce": ["adicionais-doces-dos-pasteis"],
  "pastel-especial": ["adicionais-dos-pasteis"],
  "tapioca-salgada": ["adicionais-das-tapiocas"],
  "tapioca-doce": ["adicionais-doces-das-tapiocas"],
  acai: ["complementos-do-acai", "adicionais-pagos-do-acai"],
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
        description: "Pao, hamburguer bovino, queijo, presunto e maionese.",
        imageUrl: menuImages.classicBurger,
        price: 12,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "X-Salada",
        slug: "x-salada",
        description: "Pao, hamburguer bovino, queijo, presunto, alface, tomate, milho e maionese.",
        imageUrl: menuImages.classicBurger,
        price: 14,
        sortOrder: 2,
      },
      {
        name: "X-Bacon",
        slug: "x-bacon",
        description: "Pao, hamburguer bovino, queijo, presunto, bacon, alface, tomate, milho e maionese.",
        imageUrl: menuImages.gourmetBurger,
        price: 17.5,
        sortOrder: 3,
      },
      {
        name: "X-Frango",
        slug: "x-frango",
        description: "Pao, hamburguer bovino, frango desfiado, queijo, presunto, alface, tomate, milho e maionese.",
        imageUrl: menuImages.chickenBurger,
        price: 17.5,
        sortOrder: 4,
      },
      {
        name: "X-Egg",
        slug: "x-egg",
        description: "Pao, hamburguer bovino, queijo, presunto, ovo, alface, tomate, milho e maionese.",
        imageUrl: menuImages.classicBurger,
        price: 17.5,
        sortOrder: 5,
      },
      {
        name: "X-Calabresa",
        slug: "x-calabresa",
        description: "Pao, hamburguer bovino, queijo, presunto, calabresa, alface, tomate, milho e maionese.",
        imageUrl: menuImages.gourmetBurger,
        price: 17.5,
        sortOrder: 6,
      },
      {
        name: "X-Tudo",
        slug: "x-tudo",
        description: "Pao, hamburguer bovino, frango desfiado, queijo, presunto, bacon, ovo, calabresa, catupiry, cheddar, alface, tomate, milho e maionese.",
        imageUrl: menuImages.gourmetBurger,
        price: 30,
        sortOrder: 7,
      },
      {
        name: "X-No Prato",
        slug: "x-no-prato",
        description: "Pao, hamburguer bovino, queijo, ovo, bacon, maionese da casa, milho, alface, tomate, presunto, calabresa, frango desfiado, batata frita e batata palha servidos no prato.",
        imageUrl: menuImages.comboBurgerFries,
        price: 35,
        sortOrder: 8,
      },
      {
        name: "Misto Quente",
        slug: "misto-quente",
        description: "Pao frances tostado com margarina, queijo e presunto.",
        imageUrl: menuImages.mistoBauru,
        price: 7,
        sortOrder: 9,
      },
      {
        name: "Bauru",
        slug: "bauru",
        description: "Pao, queijo, presunto, tomate, milho, maionese da casa e oregano.",
        imageUrl: menuImages.mistoBauru,
        price: 12,
        sortOrder: 10,
      },
      {
        name: "Omelete",
        slug: "omelete",
        description: "Ovos, queijo, tomate, milho e frango desfiado.",
        imageUrl: menuImages.omelete,
        price: 14,
        sortOrder: 11,
      },
    ],
  },
  {
    name: "Hot Dog",
    slug: "hot-dog",
    description: "Cachorros-quentes montados conforme o cardapio da casa.",
    sortOrder: 2,
    items: [
      {
        name: "Dog simples",
        slug: "dog-simples",
        description: "Pao, maionese, farofa, batata palha, tomate, cebola, milho e 1 vina.",
        price: 13,
        sortOrder: 1,
      },
      {
        name: "Dog duplo",
        slug: "dog-duplo",
        description: "Pao, maionese, farofa, batata palha, tomate, cebola, milho e 2 vinas.",
        price: 17,
        sortOrder: 2,
      },
      {
        name: "Dog bacon",
        slug: "dog-bacon",
        description: "Pao, maionese, farofa, batata palha, tomate, cebola, milho, bacon e 1 vina.",
        price: 17,
        sortOrder: 3,
      },
      {
        name: "Dog frango",
        slug: "dog-frango",
        description: "Pao, maionese, farofa, batata palha, tomate, cebola, milho, frango e 1 vina.",
        price: 17,
        sortOrder: 4,
      },
      {
        name: "Dog calabresa",
        slug: "dog-calabresa",
        description: "Pao, maionese, farofa, batata palha, tomate, cebola, milho, calabresa e 1 vina.",
        price: 17,
        sortOrder: 5,
      },
      {
        name: "Dog pizza",
        slug: "dog-pizza",
        description: "Pao, 1 vina, queijo, presunto, oregano, maionese, farofa, batata palha, cebola, tomate e milho.",
        price: 17,
        sortOrder: 6,
      },
      {
        name: "Dog especial",
        slug: "dog-especial",
        description: "Pao, maionese, farofa, batata palha, tomate, milho, cebola, bacon, frango, calabresa, 2 vinas, cheddar e catupiry.",
        price: 30,
        sortOrder: 7,
      },
    ],
  },
  {
    name: "Combo Lanches",
    slug: "combo-lanches",
    description: "Combos com fritas de 200g aproximadamente e bebida da casa.",
    sortOrder: 3,
    items: [
      {
        name: "Combo X-Salada + fritas",
        slug: "combo-x-salada",
        description: "Combo com X-Salada, bebida a escolha e fritas de 200g aproximadamente.",
        imageUrl: menuImages.comboBurgerFries,
        price: 27,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Combo X-Egg + fritas",
        slug: "combo-x-egg",
        description: "Combo com X-Egg, bebida a escolha e fritas de 200g aproximadamente.",
        imageUrl: menuImages.comboBurgerFries,
        price: 29,
        sortOrder: 2,
      },
      {
        name: "Combo X-Bacon + fritas",
        slug: "combo-x-bacon",
        description: "Combo com X-Bacon, bebida a escolha e fritas de 200g aproximadamente.",
        imageUrl: menuImages.comboBurgerFries,
        price: 29,
        sortOrder: 3,
      },
      {
        name: "Combo X-Frango + fritas",
        slug: "combo-x-frango",
        description: "Combo com X-Frango, bebida a escolha e fritas de 200g aproximadamente.",
        imageUrl: menuImages.comboBurgerFries,
        price: 29,
        sortOrder: 4,
      },
      {
        name: "Combo X-Calabresa + fritas",
        slug: "combo-x-calabresa",
        description: "Combo com X-Calabresa, bebida a escolha e fritas de 200g aproximadamente.",
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
    sortOrder: 4,
    items: [
      {
        name: "Classico",
        slug: "artesanal-tradicional-simples",
        description: "Pao de brioche, maionese, hamburguer artesanal bovino 150g, queijo cheddar e molho Billy & Jack.",
        imageUrl: menuImages.gourmetBurger,
        price: 16,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Tradicional",
        slug: "tradicional-artesanal",
        description: "Pao de brioche, maionese, alface, tomate, cebola caramelizada, hamburguer artesanal bovino 150g, queijo cheddar e molho Billy & Jack.",
        imageUrl: menuImages.gourmetBurger,
        price: 18,
        sortOrder: 2,
      },
      {
        name: "Artesanal Bacon",
        slug: "artesanal-bacon",
        description: "Pao de brioche, maionese, alface, tomate, cebola caramelizada, hamburguer artesanal bovino 150g, bacon, queijo cheddar e molho Billy & Jack.",
        imageUrl: menuImages.gourmetBurger,
        price: 24,
        sortOrder: 3,
      },
      {
        name: "Artesanal Calabresa",
        slug: "artesanal-calabresa",
        description: "Pao de brioche, maionese, alface, tomate, cebola caramelizada, hamburguer artesanal bovino 150g, calabresa, queijo cheddar e molho Billy & Jack.",
        imageUrl: menuImages.gourmetBurger,
        price: 24,
        sortOrder: 4,
      },
      {
        name: "X-Alcatra",
        slug: "x-alcatra",
        description: "Pao de brioche, maionese, queijo, alface, tomate, cebola caramelizada, 100g de alcatra e molho Billy & Jack.",
        imageUrl: menuImages.gourmetBurger,
        price: 28,
        sortOrder: 5,
      },
      {
        name: "Artesanal Duplo",
        slug: "artesanal-duplo",
        description: "Pao de brioche, maionese, alface, tomate, cebola caramelizada, 2 hamburgueres artesanais bovinos 150g, queijo cheddar e molho Billy & Jack.",
        imageUrl: menuImages.gourmetBurger,
        price: 28,
        sortOrder: 6,
      },
    ],
  },
  {
    name: "Combos Artesanais",
    slug: "combos-artesanais",
    description: "Burger artesanal com batata frita de 200g aproximadamente e refrigerante lata 350ml.",
    sortOrder: 5,
    items: [
      {
        name: "Combo Artesanal Tradicional",
        slug: "combo-artesanal-tradicional",
        description: "Burger artesanal tradicional com queijo cheddar, porcao de batata frita 200g aproximadamente e refrigerante lata 350ml.",
        imageUrl: menuImages.comboBurgerFries,
        price: 34,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Combo Artesanal Bacon",
        slug: "combo-artesanal-bacon",
        description: "Burger artesanal bacon com queijo cheddar, porcao de batata frita 200g aproximadamente e refrigerante lata 350ml.",
        imageUrl: menuImages.comboBurgerFries,
        price: 40,
        sortOrder: 2,
      },
      {
        name: "Combo Artesanal Calabresa",
        slug: "combo-artesanal-calabresa",
        description: "Burger artesanal calabresa com queijo cheddar, porcao de batata frita 200g aproximadamente e refrigerante lata 350ml.",
        imageUrl: menuImages.comboBurgerFries,
        price: 40,
        sortOrder: 3,
      },
      {
        name: "Combo Artesanal Duplo",
        slug: "combo-artesanal-duplo",
        description: "Burger artesanal duplo com queijo cheddar, porcao de batata frita 200g aproximadamente e refrigerante lata 350ml.",
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
    sortOrder: 6,
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
    ],
  },
  {
    name: "Pastel Doce",
    slug: "pastel-doce",
    description: "Sabores doces para fechar o pedido com sobremesa quentinha.",
    sortOrder: 7,
    items: [
      {
        name: "Chocolate preto com morango",
        slug: "pastel-doce-chocolate-morango",
        description: "Pastel doce com chocolate preto e morango.",
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
        description: "Pastel doce com prestigio.",
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
    sortOrder: 8,
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
        name: "Frango com catupiry",
        slug: "pastel-especial-frango-catupiry",
        description: "Massa crocante com frango desfiado e catupiry.",
        imageUrl: menuImages.pastelSalgado,
        price: 12,
        sortOrder: 4,
      },
      {
        name: "Frango com cheddar",
        slug: "pastel-especial-frango-cheddar",
        description: "Massa crocante com frango desfiado e cheddar.",
        imageUrl: menuImages.pastelSalgado,
        price: 12,
        sortOrder: 5,
      },
      {
        name: "Frango com queijo",
        slug: "pastel-especial-frango-queijo",
        description: "Massa crocante com frango desfiado e queijo.",
        imageUrl: menuImages.pastelSalgado,
        price: 12,
        sortOrder: 6,
      },
      {
        name: "Frango com queijo e ovo",
        slug: "pastel-especial-frango-queijo-ovo",
        description: "Massa crocante com frango desfiado, queijo e ovo.",
        imageUrl: menuImages.pastelSalgado,
        price: 15,
        sortOrder: 7,
      },
      {
        name: "Especial",
        slug: "pastel-especial-da-casa",
        description: "Frango, carne moida, calabresa, bacon, queijo, presunto, ovo, oregano, catupiry e cheddar.",
        imageUrl: menuImages.pastelSalgado,
        price: 30,
        sortOrder: 8,
      },
    ],
  },
  {
    name: "Tapioca Salgada",
    slug: "tapioca-salgada",
    description: "Tapiocas salgadas com recheios classicos e sabores da casa.",
    sortOrder: 9,
    items: [
      {
        name: "Natural",
        slug: "tapioca-natural",
        description: "Margarina.",
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
        name: "Frango com catupiry",
        slug: "tapioca-frango",
        description: "Tomate, frango e catupiry.",
        imageUrl: menuImages.tapiocaSalgada,
        price: 14,
        sortOrder: 3,
      },
      {
        name: "Frango com cheddar e tomate",
        slug: "tapioca-frango-cheddar-tomate",
        description: "Frango desfiado, cheddar e tomate.",
        imageUrl: menuImages.tapiocaSalgada,
        price: 14,
        sortOrder: 4,
      },
      {
        name: "Frango com queijo e tomate",
        slug: "tapioca-frango-queijo-tomate",
        description: "Frango desfiado, queijo e tomate.",
        imageUrl: menuImages.tapiocaSalgada,
        price: 14,
        sortOrder: 5,
      },
      {
        name: "Da Casa",
        slug: "tapioca-da-casa",
        description: "Calabresa e queijo.",
        imageUrl: menuImages.tapiocaSalgada,
        price: 14,
        sortOrder: 6,
      },
      {
        name: "Italiana",
        slug: "tapioca-italiana",
        description: "Queijo.",
        imageUrl: menuImages.tapiocaSalgada,
        price: 14,
        sortOrder: 7,
      },
      {
        name: "Calabresa com catupiry",
        slug: "tapioca-calabresa-catupiry",
        description: "Calabresa fatiada com catupiry.",
        imageUrl: menuImages.tapiocaSalgada,
        price: 14,
        sortOrder: 8,
      },
      {
        name: "Carne moida com queijo",
        slug: "tapioca-carne-moida-queijo",
        description: "Carne moida temperada com queijo derretido.",
        imageUrl: menuImages.tapiocaSalgada,
        price: 14,
        sortOrder: 9,
      },
      {
        name: "Ovo com queijo",
        slug: "tapioca-ovo-queijo",
        description: "Ovo mexido com queijo.",
        imageUrl: menuImages.tapiocaSalgada,
        price: 14,
        sortOrder: 10,
      },
    ],
  },
  {
    name: "Tapioca Doce",
    slug: "tapioca-doce",
    description: "Tapiocas doces para sobremesa ou para matar a vontade de acucar.",
    sortOrder: 10,
    items: [
      {
        name: "Baianinha",
        slug: "tapioca-baianinha",
        description: "Leite condensado e chocolate preto.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 1,
        isFeatured: true,
      },
      {
        name: "Uva com chocolate",
        slug: "tapioca-uva-chocolate",
        description: "Uva e chocolate ao leite.",
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
        description: "Prestigio.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 4,
      },
      {
        name: "Sensacao",
        slug: "tapioca-sensacao",
        description: "Leite condensado, chocolate preto e morango.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 5,
      },
      {
        name: "Ouro Branco",
        slug: "tapioca-ouro-branco",
        description: "Ouro branco e leite condensado.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 6,
      },
      {
        name: "Ouro Branco com creme de avela",
        slug: "tapioca-ouro-branco-nutella",
        description: "Ouro branco, creme de avela e leite condensado.",
        imageUrl: menuImages.doceCrepe,
        price: 17,
        sortOrder: 7,
      },
      {
        name: "Sonho de valsa",
        slug: "tapioca-sonho-de-valsa",
        description: "Sonho de valsa e leite condensado.",
        imageUrl: menuImages.doceCrepe,
        price: 14,
        sortOrder: 8,
      },
      {
        name: "Sonho de valsa com creme de avela",
        slug: "tapioca-sonho-de-valsa-nutella",
        description: "Sonho de valsa, creme de avela e leite condensado.",
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
        name: "Chocolate preto com morango",
        slug: "tapioca-chocolate-morango",
        description: "Chocolate preto e morango.",
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
    sortOrder: 12,
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
    sortOrder: 11,
    items: [
      {
        name: "Coxinha pequena de frango",
        slug: "coxinha-pequena-frango",
        description: "Coxinha pequena de frango",
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
        description: "enroladinho de vina pequeno",
        imageUrl: menuImages.pastelSalgado,
        price: 6.5,
        sortOrder: 4,
      },
      {
        name: "Bolinho de carne pequeno",
        slug: "bolinho-carne-pequeno",
        description: "Bolinho de carne pequeno.",
        imageUrl: menuImages.pastelSalgado,
        price: 6,
        sortOrder: 5,
      },
      {
        name: "Pao de queijo",
        slug: "pao-de-queijo",
        description: "Pao de queijo.",
        imageUrl: menuImages.pastelSalgado,
        price: 5,
        sortOrder: 6,
      },
      {
        name: "Coxinha grande de frango com cheddar",
        slug: "coxinha-grande-frango-cheddar",
        description: "Coxinha grande de frango com cheddar.",
        imageUrl: menuImages.pastelSalgado,
        price: 10.5,
        sortOrder: 7,
        isFeatured: true,
      },
      {
        name: "Coxinha grande de frango com requeijao",
        slug: "coxinha-grande-frango-requeijao",
        description: "Coxinha grande de frango com requeijao.",
        imageUrl: menuImages.pastelSalgado,
        price: 10.5,
        sortOrder: 8,
      },
      {
        name: "Coxinha grande de frango",
        slug: "coxinha-grande-frango",
        description: "Coxinha grande de frango tradicional.",
        imageUrl: menuImages.pastelSalgado,
        price: 9.5,
        sortOrder: 9,
      },
      {
        name: "Risoles grande de carne",
        slug: "risoles-grande-carne",
        description: "Risoles grande recheado com carne.",
        imageUrl: menuImages.pastelSalgado,
        price: 9.5,
        sortOrder: 10,
      },
      {
        name: "Risoles grande de queijo e presunto",
        slug: "risoles-grande-queijo-presunto",
        description: "Risoles grande com queijo e presunto.",
        imageUrl: menuImages.pastelSalgado,
        price: 9.5,
        sortOrder: 11,
      },
      {
        name: "Enroladinho de vina grande",
        slug: "enroladinho-vina-grande",
        description: "Enroladinho de vina em tamanho grande.",
        imageUrl: menuImages.pastelSalgado,
        price: 9.5,
        sortOrder: 12,
      },
      {
        name: "Espeto de frango",
        slug: "espeto-frango",
        description: "Espeto de frango bem servido e dourado.",
        imageUrl: menuImages.pastelSalgado,
        price: 7.5,
        sortOrder: 13,
      },
      {
        name: "Assado de vina com cheddar",
        slug: "assado-vina-cheddar",
        description: "Assado de vina com cheddar derretido.",
        imageUrl: menuImages.pastelSalgado,
        price: 10,
        sortOrder: 14,
      },
      {
        name: "Assado de vina com catupiry",
        slug: "assado-vina-catupiry",
        description: "Assado de vina com catupiry cremoso.",
        imageUrl: menuImages.pastelSalgado,
        price: 10,
        sortOrder: 15,
      },
      {
        name: "Assado de Hamburgao com cheddar",
        slug: "assado-hamburgao-cheddar",
        description: "massa, hamburguer, cheddar, queijo e presunto",
        imageUrl: menuImages.pastelSalgado,
        price: 11,
        sortOrder: 16,
      },
      {
        name: "Assado de Hamburgao com catupiry",
        slug: "assado-hamburgao-catupiry",
        description: "Assado de hamburgao com catupiry.",
        imageUrl: menuImages.pastelSalgado,
        price: 11,
        sortOrder: 17,
      },
      {
        name: "Assado de carne moida",
        slug: "assado-carne-moida",
        description: "esfiha assada de carne moida",
        imageUrl: menuImages.pastelSalgado,
        price: 10,
        sortOrder: 18,
      },
      {
        name: "Assado de queijo e presunto",
        slug: "assado-queijo-presunto",
        description: "assado de queijo, presunto e oregano",
        imageUrl: menuImages.pastelSalgado,
        price: 10,
        sortOrder: 19,
      },
      {
        name: "Assado frango Com Catupiry",
        slug: "assado-frango-catupiry",
        description: "Assado de frango com catupiry cremoso.",
        imageUrl: menuImages.pastelSalgado,
        price: 11,
        sortOrder: 20,
      },
      {
        name: "Assado de frango com cheddar",
        slug: "assado-frango-cheddar",
        description: "Assado de frango com cheddar derretido.",
        imageUrl: menuImages.pastelSalgado,
        price: 11,
        sortOrder: 21,
      },
    ],
  },
  {
    name: "Porções",
    slug: "porcoes",
    description: "Porcoes para compartilhar com acompanhamentos e carnes da casa.",
    sortOrder: 13,
    items: [
      {
        name: "Batata frita 500g",
        slug: "batata-frita-500g",
        description: "Batata frita 500g aproximadamente.",
        price: 30,
        sortOrder: 1,
      },
      {
        name: "Batata frita c/ bacon",
        slug: "batata-frita-bacon-600g",
        description: "Batata frita com bacon 600g aproximadamente.",
        price: 45,
        sortOrder: 2,
      },
      {
        name: "Batata frita c/ calabresa acebolada",
        slug: "batata-frita-calabresa-acebolada-600g",
        description: "Batata frita com calabresa acebolada 600g aproximadamente.",
        price: 45,
        sortOrder: 3,
      },
      {
        name: "Frango a passarinho",
        slug: "frango-a-passarinho-1kg",
        description: "Frango a passarinho 1kg aproximadamente.",
        price: 45,
        sortOrder: 4,
      },
      {
        name: "Alcatra acebolada",
        slug: "alcatra-acebolada-500g",
        description: "Alcatra acebolada 500g aproximadamente.",
        price: 65,
        sortOrder: 5,
      },
      {
        name: "Alcatra com batata",
        slug: "alcatra-com-batata-600g",
        description: "Alcatra com batata 600g aproximadamente.",
        price: 65,
        sortOrder: 6,
      },
    ],
  },
  {
    name: "Bebidas",
    slug: "bebidas",
    description: "Bebidas avulsas para acompanhar o pedido.",
    sortOrder: 14,
    items: [
      {
        name: "Coca cola 220ml",
        slug: "coca-cola-220ml",
        description: "Coca cola 220ml.",
        price: 4,
        sortOrder: 1,
      },
      {
        name: "Suco de laranja 300ml",
        slug: "suco-laranja-300ml",
        description: "Suco de laranja 300ml.",
        price: 7,
        sortOrder: 2,
      },
      {
        name: "Coca cola lata 350ml",
        slug: "coca-cola-lata-350ml",
        description: "Coca cola lata 350ml.",
        price: 6,
        sortOrder: 3,
      },
      {
        name: "Fanta uva lata 350ml",
        slug: "fanta-uva-lata-350ml",
        description: "Fanta uva lata 350ml.",
        price: 6,
        sortOrder: 4,
      },
      {
        name: "Fanta laranja lata 350ml",
        slug: "fanta-laranja-lata-350ml",
        description: "Fanta laranja lata 350ml.",
        price: 6,
        sortOrder: 5,
      },
      {
        name: "Sprite lata 350ml",
        slug: "sprite-lata-350ml",
        description: "Sprite lata 350ml.",
        price: 6,
        sortOrder: 6,
      },
      {
        name: "Schweppes lata 350ml",
        slug: "schweppes-lata-350ml",
        description: "Schweppes lata 350ml.",
        price: 6,
        sortOrder: 7,
      },
      {
        name: "Kuat lata 350ml",
        slug: "kuat-lata-350ml",
        description: "Kuat lata 350ml.",
        price: 6,
        sortOrder: 8,
      },
    ],
  },
  {
    name: "Almoço",
    slug: "almoco",
    description: lunchWeekDescription,
    sortOrder: 15,
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
  ["combo-x-salada", ["pao", "hamburguer-bovino", "queijo", "presunto", "alface", "tomate", "milho", "maionese-da-casa"]],
  ["combo-x-egg", ["pao", "hamburguer-bovino", "queijo", "presunto", "ovo", "alface", "tomate", "milho", "maionese-da-casa"]],
  ["combo-x-bacon", ["pao", "hamburguer-bovino", "queijo", "presunto", "bacon", "alface", "tomate", "milho", "maionese-da-casa"]],
  ["combo-x-frango", ["pao", "hamburguer-bovino", "frango-desfiado", "queijo", "presunto", "alface", "tomate", "milho", "maionese-da-casa"]],
  ["combo-x-calabresa", ["pao", "hamburguer-bovino", "queijo", "presunto", "calabresa", "alface", "tomate", "milho", "maionese-da-casa"]],
  ["artesanal-tradicional-simples", ["pao-de-brioche", "maionese-da-casa", "hamburguer-artesanal-bovino", "queijo-cheddar", "molho-billy-jack"]],
  ["tradicional-artesanal", ["pao-de-brioche", "maionese-da-casa", "alface", "tomate", "cebola-caramelizada", "hamburguer-artesanal-bovino", "queijo-cheddar", "molho-billy-jack"]],
  ["artesanal-bacon", ["pao-de-brioche", "maionese-da-casa", "alface", "tomate", "cebola-caramelizada", "hamburguer-artesanal-bovino", "bacon", "queijo-cheddar", "molho-billy-jack"]],
  ["artesanal-calabresa", ["pao-de-brioche", "maionese-da-casa", "alface", "tomate", "cebola-caramelizada", "hamburguer-artesanal-bovino", "calabresa", "queijo-cheddar", "molho-billy-jack"]],
  ["x-alcatra", ["pao-de-brioche", "maionese-da-casa", "queijo", "alface", "tomate", "cebola-caramelizada", "alcatra", "molho-billy-jack"]],
  ["artesanal-duplo", ["pao-de-brioche", "maionese-da-casa", "alface", "tomate", "cebola-caramelizada", "hamburguer-artesanal-bovino", "queijo-cheddar", "molho-billy-jack"]],
  ["combo-artesanal-tradicional", ["pao-de-brioche", "maionese-da-casa", "alface", "tomate", "cebola-caramelizada", "hamburguer-artesanal-bovino", "queijo-cheddar", "molho-billy-jack"]],
  ["combo-artesanal-bacon", ["pao-de-brioche", "maionese-da-casa", "alface", "tomate", "cebola-caramelizada", "hamburguer-artesanal-bovino", "bacon", "queijo-cheddar", "molho-billy-jack"]],
  ["combo-artesanal-calabresa", ["pao-de-brioche", "maionese-da-casa", "alface", "tomate", "cebola-caramelizada", "hamburguer-artesanal-bovino", "calabresa", "queijo-cheddar", "molho-billy-jack"]],
  ["combo-artesanal-duplo", ["pao-de-brioche", "maionese-da-casa", "alface", "tomate", "cebola-caramelizada", "hamburguer-artesanal-bovino", "queijo-cheddar", "molho-billy-jack"]],
  ["dog-simples", ["pao", "maionese-da-casa", "farofa", "batata-palha", "tomate", "cebola", "milho", "vina"]],
  ["dog-duplo", ["pao", "maionese-da-casa", "farofa", "batata-palha", "tomate", "cebola", "milho", "vina"]],
  ["dog-bacon", ["pao", "maionese-da-casa", "farofa", "batata-palha", "tomate", "cebola", "milho", "bacon", "vina"]],
  ["dog-frango", ["pao", "maionese-da-casa", "farofa", "batata-palha", "tomate", "cebola", "milho", "frango-desfiado", "vina"]],
  ["dog-calabresa", ["pao", "maionese-da-casa", "farofa", "batata-palha", "tomate", "cebola", "milho", "calabresa", "vina"]],
  ["dog-pizza", ["pao", "vina", "queijo", "presunto", "oregano", "maionese-da-casa", "farofa", "batata-palha", "cebola", "tomate", "milho"]],
  ["dog-especial", ["pao", "maionese-da-casa", "farofa", "batata-palha", "tomate", "milho", "cebola", "bacon", "frango-desfiado", "calabresa", "vina", "cheddar", "catupiry"]],
  ["pastel-doce-prestigio", ["massa-de-pastel", "prestigio"]],
  ["pastel-especial-da-casa", ["massa-de-pastel", "frango-desfiado", "carne-moida", "calabresa", "bacon", "queijo", "presunto", "ovo", "oregano", "catupiry", "cheddar"]],
  ["tapioca-natural", ["massa-de-tapioca", "margarina"]],
  ["tapioca-da-casa", ["massa-de-tapioca", "calabresa", "queijo"]],
  ["tapioca-prestigio", ["massa-de-tapioca", "prestigio"]],
  ["tapioca-ouro-branco", ["massa-de-tapioca", "ouro-branco", "leite-condensado"]],
  ["tapioca-ouro-branco-nutella", ["massa-de-tapioca", "ouro-branco", "creme-de-avela", "leite-condensado"]],
  ["tapioca-sonho-de-valsa", ["massa-de-tapioca", "sonho-de-valsa", "leite-condensado"]],
  ["tapioca-sonho-de-valsa-nutella", ["massa-de-tapioca", "sonho-de-valsa", "creme-de-avela", "leite-condensado"]],
  ["risoles-pequeno-queijo-presunto", []],
  ["coxinha-grande-frango-cheddar", ["frango-desfiado"]],
  ["coxinha-grande-frango-requeijao", ["frango-desfiado"]],
  ["coxinha-grande-frango", []],
  ["risoles-grande-queijo-presunto", []],
  ["enroladinho-vina-grande", []],
  ["espeto-frango", []],
  ["assado-vina-cheddar", []],
  ["assado-vina-catupiry", []],
  ["assado-hamburgao-cheddar", ["hamburguer-bovino", "queijo", "presunto"]],
  ["assado-carne-moida", []],
  ["assado-queijo-presunto", ["oregano"]],
  ["assado-frango-cheddar", ["frango-desfiado"]],
  ["batata-frita-500g", ["batata-frita"]],
  ["batata-frita-bacon-600g", ["batata-frita", "bacon"]],
  ["batata-frita-calabresa-acebolada-600g", ["batata-frita", "calabresa", "cebola"]],
  ["frango-a-passarinho-1kg", ["frango-a-passarinho"]],
  ["alcatra-acebolada-500g", ["alcatra", "cebola"]],
  ["alcatra-com-batata-600g", ["alcatra", "batata-frita"]],
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

function getIngredientQuantity(itemSlug: string, ingredientSlug: string) {
  if (ingredientSlug === "hamburguer-artesanal-bovino" && ["artesanal-duplo", "combo-artesanal-duplo"].includes(itemSlug)) {
    return 2;
  }

  if (ingredientSlug === "vina" && ["dog-duplo", "dog-especial"].includes(itemSlug)) {
    return 2;
  }

  return 1;
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
              quantity: getIngredientQuantity(item.slug, ingredientSlug),
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
